import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

const DOWNGRADE_CONFIDENCE_THRESHOLD = 0.6;
const DOWNGRADE_PERIOD_DAYS = 30;

export async function POST(request: NextRequest) {
  if (request.headers.get("x-internal-secret") !== process.env.INTERNAL_API_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const serviceSupabase = createServiceClient();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - DOWNGRADE_PERIOD_DAYS);

  const { data: sources } = await (serviceSupabase as any)
    .from("opportunity_sources")
    .select("id, name, trust_tier")
    .eq("is_active", true)
    .neq("trust_tier", "review_all");

  let downgraded = 0;

  for (const source of sources || []) {
    const { data: opps } = await (serviceSupabase as any)
      .from("opportunities")
      .select("ai_relevance_score")
      .eq("source_name", source.name)
      .eq("ai_generated", true)
      .gte("published_at", cutoffDate.toISOString());

    if (!opps || opps.length < 10) continue;

    const scores = opps
      .map((o: any) => o.ai_relevance_score)
      .filter((s: any) => s !== null && s !== undefined);

    if (scores.length < 10) continue;

    const avgScore = scores.reduce((sum: number, s: number) => sum + s, 0) / scores.length / 100;

    if (avgScore < DOWNGRADE_CONFIDENCE_THRESHOLD) {
      const newTier = source.trust_tier === "trusted" ? "standard" : "review_all";

      await (serviceSupabase as any)
        .from("opportunity_sources")
        .update({ trust_tier: newTier })
        .eq("id", source.id);

      downgraded++;
    }
  }

  return NextResponse.json({ checked: sources?.length || 0, downgraded });
}
