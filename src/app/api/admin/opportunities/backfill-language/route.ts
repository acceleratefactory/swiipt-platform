import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { detectOpportunityLanguage } from "@/lib/language";

// One-time (repeatable) backfill: detect and store the language of every
// opportunity that hasn't been tagged yet, so the feed can hide non-English
// listings immediately. Detection is local (no network), so we process a large
// batch per call. Cursor: rows where language IS NULL. Run repeatedly until it
// reports "No opportunities need language detection".
//
// Trigger (PowerShell):
//   Invoke-RestMethod -Method POST `
//     -Uri "https://<host>/api/admin/opportunities/backfill-language" `
//     -Headers @{ "x-internal-secret" = "<INTERNAL_API_SECRET>" }

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  if (request.headers.get("x-internal-secret") !== process.env.INTERNAL_API_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const serviceSupabase = createServiceClient();

  const { data: opportunities, error: fetchError } = await (serviceSupabase as any)
    .from("opportunities")
    .select("id, title, description")
    .is("language", null)
    .order("id")
    .limit(500);

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  if (!opportunities || opportunities.length === 0) {
    return NextResponse.json({ updated: 0, message: "No opportunities need language detection" });
  }

  let updated = 0;
  let failed = 0;
  const counts: Record<string, number> = {};

  for (const opp of opportunities) {
    try {
      const lang = detectOpportunityLanguage(opp.title, opp.description);
      counts[lang] = (counts[lang] || 0) + 1;
      const { error } = await (serviceSupabase as any)
        .from("opportunities")
        .update({ language: lang })
        .eq("id", opp.id);
      if (error) {
        failed++;
      } else {
        updated++;
      }
    } catch {
      failed++;
    }
  }

  return NextResponse.json({
    updated,
    failed,
    languages: counts,
    remaining: "Run again to process more",
  });
}
