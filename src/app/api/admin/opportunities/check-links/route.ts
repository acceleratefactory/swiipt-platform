import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(request: NextRequest) {
  if (request.headers.get("x-internal-secret") !== process.env.INTERNAL_API_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const serviceSupabase = createServiceClient();

  const { data: opportunities } = await (serviceSupabase as any)
    .from("opportunities")
    .select("id, application_url, title")
    .eq("is_active", true)
    .neq("application_url", "#");

  const broken: string[] = [];

  for (const opp of (opportunities || [])) {
    try {
      const res = await fetch(opp.application_url, {
        method: "HEAD",
        signal: AbortSignal.timeout(8000),
      });
      if (res.status === 404 || res.status === 410) {
        broken.push(opp.id);
        await (serviceSupabase as any)
          .from("opportunities")
          .update({ needs_review: true, review_reason: `Link returned ${res.status}` })
          .eq("id", opp.id);
      }
    } catch {
      broken.push(opp.id);
      await (serviceSupabase as any)
        .from("opportunities")
        .update({ needs_review: true, review_reason: "Link unreachable" })
        .eq("id", opp.id);
    }
  }

  return NextResponse.json({ checked: opportunities?.length || 0, broken: broken.length });
}
