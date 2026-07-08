import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function GET(request: NextRequest) {
  if (request.headers.get("x-internal-secret") !== process.env.INTERNAL_API_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const serviceSupabase = createServiceClient();

  const { data: sources } = await (serviceSupabase as any)
    .from("opportunity_sources")
    .select("id, name, source_type, trust_tier, is_active, is_degraded, total_ingested, total_published, consecutive_errors")
    .order("name");

  const sourceIds = (sources || []).map((s: any) => s.id);
  if (sourceIds.length === 0) {
    return NextResponse.json({ sources: [] });
  }

  // Get published opportunities per source with confidence scores
  const { data: opps } = await (serviceSupabase as any)
    .from("opportunities")
    .select("source_name, ai_relevance_score, is_active")
    .in("source_name", (sources || []).map((s: any) => s.name))
    .eq("ai_generated", true);

  // Get user engagement per source
  const { data: feed } = await (serviceSupabase as any)
    .from("user_opportunity_feed")
    .select("opportunity_id, is_saved, is_applied")
    .in("opportunity_id", (opps || []).map((o: any) => o.id));

  // Build metrics per source
  const metricsByName: Record<string, any> = {};

  for (const source of sources || []) {
    const sourceOpps = (opps || []).filter((o: any) => o.source_name === source.name);
    const activeOpps = sourceOpps.filter((o: any) => o.is_active);

    const oppIds = sourceOpps.map((o: any) => o.id);
    const sourceFeed = (feed || []).filter((f: any) => oppIds.includes(f.opportunity_id));

    const totalSaves = sourceFeed.filter((f: any) => f.is_saved).length;
    const totalApplies = sourceFeed.filter((f: any) => f.is_applied).length;

    const scores = sourceOpps
      .map((o: any) => o.ai_relevance_score)
      .filter((s: any) => s !== null && s !== undefined);

    const avgConfidence = scores.length > 0
      ? scores.reduce((sum: number, s: number) => sum + s, 0) / scores.length / 100
      : 0;

    const publishRate = source.total_ingested > 0
      ? source.total_published / source.total_ingested
      : 0;

    let healthStatus: string;
    if (source.is_degraded) {
      healthStatus = "degraded";
    } else if (source.consecutive_errors >= 3) {
      healthStatus = "unstable";
    } else if (avgConfidence < 0.5 && source.total_published > 10) {
      healthStatus = "low_quality";
    } else {
      healthStatus = "healthy";
    }

    metricsByName[source.name] = {
      id: source.id,
      name: source.name,
      source_type: source.source_type,
      trust_tier: source.trust_tier,
      is_active: source.is_active,
      health_status: healthStatus,
      total_ingested: source.total_ingested,
      total_published: source.total_published,
      active_opportunities: activeOpps.length,
      avg_confidence: Math.round(avgConfidence * 100) / 100,
      publish_rate: Math.round(publishRate * 100) / 100,
      total_saves: totalSaves,
      total_applies: totalApplies,
      engagement_rate: activeOpps.length > 0
        ? Math.round(((totalSaves + totalApplies) / activeOpps.length) * 100) / 100
        : 0,
      consecutive_errors: source.consecutive_errors,
    };
  }

  // Sources with no metrics get defaults
  const allMetrics = (sources || []).map((s: any) => metricsByName[s.name] || {
    id: s.id,
    name: s.name,
    source_type: s.source_type,
    trust_tier: s.trust_tier,
    is_active: s.is_active,
    health_status: s.is_degraded ? "degraded" : "healthy",
    total_ingested: s.total_ingested,
    total_published: s.total_published,
    active_opportunities: 0,
    avg_confidence: 0,
    publish_rate: 0,
    total_saves: 0,
    total_applies: 0,
    engagement_rate: 0,
    consecutive_errors: s.consecutive_errors,
  });

  // Summary
  const summary = {
    total_sources: allMetrics.length,
    active_sources: allMetrics.filter((m: any) => m.is_active).length,
    healthy_sources: allMetrics.filter((m: any) => m.health_status === "healthy").length,
    degraded_sources: allMetrics.filter((m: any) => m.health_status === "degraded").length,
    low_quality_sources: allMetrics.filter((m: any) => m.health_status === "low_quality").length,
    total_opportunities: allMetrics.reduce((sum: number, m: any) => sum + m.active_opportunities, 0),
    avg_platform_confidence: allMetrics.length > 0
      ? Math.round((allMetrics.reduce((sum: number, m: any) => sum + m.avg_confidence, 0) / allMetrics.length) * 100) / 100
      : 0,
  };

  return NextResponse.json({ summary, sources: allMetrics });
}
