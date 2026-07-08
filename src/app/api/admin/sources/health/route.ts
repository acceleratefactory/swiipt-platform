import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function GET(request: NextRequest) {
  if (request.headers.get("x-internal-secret") !== process.env.INTERNAL_API_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const serviceSupabase = createServiceClient();

  const { data: sources } = await (serviceSupabase as any)
    .from("opportunity_sources")
    .select("id, name, source_type, is_active, is_degraded, consecutive_errors, last_error, last_error_at, last_pulled_at, total_ingested, total_published, trust_tier")
    .order("name");

  const sourceIds = (sources || []).map((s: any) => s.id);

  let recentLogs: any[] = [];
  if (sourceIds.length > 0) {
    const { data } = await (serviceSupabase as any)
      .from("source_health_log")
      .select("source_id, pulled_at, items_found, items_new, duration_ms, error_message, success")
      .in("source_id", sourceIds)
      .order("pulled_at", { ascending: false })
      .limit(sourceIds.length * 10);

    recentLogs = data || [];
  }

  const logsBySource: Record<string, any[]> = {};
  for (const log of recentLogs) {
    if (!logsBySource[log.source_id]) logsBySource[log.source_id] = [];
    logsBySource[log.source_id].push(log);
  }

  const healthSummary = (sources || []).map((source: any) => {
    const logs = logsBySource[source.id] || [];
    const successfulPulls = logs.filter((l: any) => l.success);
    const failedPulls = logs.filter((l: any) => !l.success);
    const totalPulls = logs.length;

    const avgDuration = successfulPulls.length > 0
      ? Math.round(successfulPulls.reduce((sum: number, l: any) => sum + (l.duration_ms || 0), 0) / successfulPulls.length)
      : null;

    const totalItemsFound = logs.reduce((sum: number, l: any) => sum + (l.items_found || 0), 0);
    const totalItemsNew = logs.reduce((sum: number, l: any) => sum + (l.items_new || 0), 0);

    const lastSuccessful = successfulPulls[0]?.pulled_at || null;
    const lastFailed = failedPulls[0]?.pulled_at || null;

    const errorRate = totalPulls > 0
      ? Math.round((failedPulls.length / totalPulls) * 100)
      : 0;

    let healthStatus: string;
    if (source.is_degraded) {
      healthStatus = "degraded";
    } else if (errorRate > 50) {
      healthStatus = "unstable";
    } else if (errorRate > 20) {
      healthStatus = "warning";
    } else {
      healthStatus = "healthy";
    }

    return {
      id: source.id,
      name: source.name,
      source_type: source.source_type,
      trust_tier: source.trust_tier,
      is_active: source.is_active,
      health_status: healthStatus,
      consecutive_errors: source.consecutive_errors || 0,
      last_error: source.last_error,
      last_error_at: source.last_error_at,
      last_pulled_at: source.last_pulled_at,
      total_ingested: source.total_ingested,
      total_published: source.total_published,
      stats: {
        recent_pulls: totalPulls,
        successful_pulls: successfulPulls.length,
        failed_pulls: failedPulls.length,
        error_rate_pct: errorRate,
        avg_duration_ms: avgDuration,
        total_items_found: totalItemsFound,
        total_items_new: totalItemsNew,
        last_successful_pull: lastSuccessful,
        last_failed_pull: lastFailed,
      },
    };
  });

  const overall = {
    total_sources: sources?.length || 0,
    active_sources: healthSummary.filter((s: any) => s.is_active).length,
    degraded_sources: healthSummary.filter((s: any) => s.health_status === "degraded").length,
    healthy_sources: healthSummary.filter((s: any) => s.health_status === "healthy").length,
    warning_sources: healthSummary.filter((s: any) => s.health_status === "warning").length,
    unstable_sources: healthSummary.filter((s: any) => s.health_status === "unstable").length,
  };

  return NextResponse.json({ overall, sources: healthSummary });
}
