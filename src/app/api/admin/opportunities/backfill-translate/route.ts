import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { enrich } from "@/lib/ai-service";
import { detectOpportunityLanguage, isEnglishCode } from "@/lib/language";

// One-time (repeatable) backfill: translate existing non-English opportunities
// into English so good EU/foreign-language listings are KEPT (in English) instead
// of just hidden by the language filter. Each row calls the AI provider, so we
// process a small batch per call. Cursor: rows whose language is set and NOT one
// of the English-ish codes. Run repeatedly until it reports "No non-English
// opportunities to translate". Depends on an active AI provider being configured.
//
// Trigger (PowerShell):
//   Invoke-RestMethod -Method POST `
//     -Uri "https://<host>/api/admin/opportunities/backfill-translate" `
//     -Headers @{ "x-internal-secret" = "<INTERNAL_API_SECRET>" }

export const runtime = "nodejs";
export const maxDuration = 300;

// Keep each invocation well under the Vercel Hobby 60s function cap:
// 15 AI-translate rows routinely exceeded it (504 Gateway Timeout). 3 rows
// is safe and still makes progress across repeated calls.
const BATCH_SIZE = 3;

export async function POST(request: NextRequest) {
  if (request.headers.get("x-internal-secret") !== process.env.INTERNAL_API_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const serviceSupabase = createServiceClient();

  const { data: opportunities, error: fetchError } = await (serviceSupabase as any)
    .from("opportunities")
    .select("id, title, description, organisation, requirements, language")
    .not("language", "is", null)
    .not("language", "in", "(eng,sco,und)")
    .order("id")
    .limit(BATCH_SIZE);

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  if (!opportunities || opportunities.length === 0) {
    return NextResponse.json({ translated: 0, message: "No non-English opportunities to translate" });
  }

  let translated = 0;
  let failed = 0;

  for (const opp of opportunities) {
    try {
      const result = await enrich({
        task: "translate",
        data: {
          title: opp.title,
          description: opp.description,
          organisation: opp.organisation,
          requirements: opp.requirements,
        },
      });

      const out = result?.enriched || {};
      const newTitle = (out.title || "").trim() || opp.title;
      const newDescription = (out.description || "").trim() || opp.description;

      // Guard: only accept a translation that actually produced English text.
      if (!result?.success || (!out.title && !out.description)) {
        failed++;
        continue;
      }

      const detected = detectOpportunityLanguage(newTitle, newDescription);

      const { error } = await (serviceSupabase as any)
        .from("opportunities")
        .update({
          title: newTitle,
          description: newDescription,
          organisation: (out.organisation || "").trim() || opp.organisation,
          requirements: out.requirements ?? opp.requirements,
          language: isEnglishCode(detected) ? "eng" : detected,
        })
        .eq("id", opp.id);

      if (error) {
        failed++;
      } else {
        translated++;
      }
    } catch {
      failed++;
    }
  }

  return NextResponse.json({
    translated,
    failed,
    remaining: "Run again to process more",
  });
}
