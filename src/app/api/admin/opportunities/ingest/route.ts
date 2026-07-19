import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { createRSSEvidence } from "@/lib/evidence-adapters";
import { fetchFromAPI } from "@/lib/api-adapters";
import { createScraperEvidence } from "@/lib/scraper-adapters";
import { normalizeUrl } from "@/lib/url-normalize";

const DEGRADE_THRESHOLD = 5;
const CIRCUIT_BREAKER_THRESHOLD = 3;
const CONCURRENT_BATCH_SIZE = 5;

interface SourceRecord {
  id: string;
  name: string;
  source_type: string;
  source_url: string;
  trust_tier: string;
  pull_frequency_hours: number;
  last_pulled_at: string | null;
  total_ingested: number;
  consecutive_errors: number;
  is_degraded: boolean;
  last_error_at: string | null;
  rate_limit_per_hour: number;
  rate_used_this_hour: number;
  rate_window_start: string | null;
}

function isRateLimited(source: SourceRecord): boolean {
  const now = Date.now();
  const windowStart = source.rate_window_start
    ? new Date(source.rate_window_start).getTime()
    : 0;
  const hourMs = 60 * 60 * 1000;
  if (!windowStart || now - windowStart > hourMs) return false;
  return source.rate_used_this_hour >= source.rate_limit_per_hour;
}

function isCircuitOpen(source: SourceRecord): boolean {
  // TEMPORARY breaker: only skip a source if it is actively erroring RIGHT
  // NOW (errors within the last hour). A permanently-degraded source that
  // never recovers silently kills throughput, so we let it retry after the
  // cooldown window instead of disabling it forever.
  const recentErrorCutoff = Date.now() - 60 * 60 * 1000;
  const lastErr = source.last_error_at ? new Date(source.last_error_at).getTime() : 0;
  if (lastErr && lastErr > recentErrorCutoff) {
    return source.consecutive_errors >= CIRCUIT_BREAKER_THRESHOLD;
  }
  return false;
}

function sortByPriority(sources: SourceRecord[]): SourceRecord[] {
  const tierOrder: Record<string, number> = { trusted: 0, standard: 1, review_all: 2 };
  return [...sources].sort((a, b) => {
    const tierA = tierOrder[a.trust_tier] ?? 1;
    const tierB = tierOrder[b.trust_tier] ?? 1;
    if (tierA !== tierB) return tierA - tierB;
    return a.name.localeCompare(b.name);
  });
}

async function processSource(
  serviceSupabase: any,
  source: SourceRecord
): Promise<{ itemsNew: number; itemsFound: number; durationMs: number; error: string | null }> {
  // Effective cooldown capped at 1h so healthy sources are re-pulled often
  // enough to keep the feed stocked. Long 6h+ frequencies were throttling
  // throughput to a trickle.
  const pullFrequencyHours = Math.min(source.pull_frequency_hours || 6, 1);
  const lastPulledAt = source.last_pulled_at ? new Date(source.last_pulled_at).getTime() : 0;
  const cooldownMs = pullFrequencyHours * 60 * 60 * 1000;
  if (lastPulledAt && Date.now() - lastPulledAt < cooldownMs) {
    return { itemsNew: 0, itemsFound: 0, durationMs: 0, error: null };
  }

  if (isRateLimited(source)) {
    return { itemsNew: 0, itemsFound: 0, durationMs: 0, error: null };
  }

  if (isCircuitOpen(source)) {
    return { itemsNew: 0, itemsFound: 0, durationMs: 0, error: null };
  }

  const startTime = Date.now();
  let itemsFound = 0;
  let itemsNew = 0;
  let errorMessage: string | null = null;

  try {
    let evidenceRecords: Array<{
      evidence_type: string;
      raw_data: Record<string, any>;
      source_url: string | null;
      source_name: string | null;
      content_hash: string;
    }> = [];

    if (source.source_type === "rss") {
      evidenceRecords = await createRSSEvidence(source.source_url, source.name, 100);
    } else if (source.source_type === "api") {
      evidenceRecords = await fetchFromAPI(source.name, source.source_url, 100);
    } else if (source.source_type === "scraper") {
      // P0#1a — generic HTML scraper for sources with no RSS/JSON feed.
      evidenceRecords = await createScraperEvidence(source.source_url, source.name, 20);
    }

    itemsFound = evidenceRecords.length;
    let sourceIngested = 0;

    for (const ev of evidenceRecords) {
      const normUrl = normalizeUrl(ev.raw_data.url || ev.raw_data.link || "");

      // P0#4: dedupe on normalized_url FIRST (catches cross-source + tracker-noise
      // duplicates), then fall back to content_hash for identical raw items.
      if (normUrl) {
        const { data: existingByUrl } = await serviceSupabase
          .from("evidence")
          .select("id")
          .eq("normalized_url", normUrl)
          .limit(1)
          .maybeSingle();
        if (existingByUrl) continue;
      }

      const { data: existing } = await serviceSupabase
        .from("evidence")
        .select("id")
        .eq("content_hash", ev.content_hash)
        .limit(1)
        .maybeSingle();

      if (existing) continue;

      const { data: existingOpp } = await serviceSupabase
        .from("opportunities")
        .select("id")
        .eq("normalized_url", normUrl)
        .limit(1)
        .maybeSingle();

      if (existingOpp) continue;

      await serviceSupabase.from("evidence").insert({
        evidence_type: ev.evidence_type,
        raw_data: ev.raw_data,
        source_url: ev.source_url,
        source_name: ev.source_name,
        content_hash: ev.content_hash,
        normalized_url: normUrl,
        enrichment_status: "pending",
      });

      sourceIngested++;
    }

    itemsNew = sourceIngested;
    const now = new Date();
    const windowStart = source.rate_window_start ? new Date(source.rate_window_start).getTime() : 0;
    const hourMs = 60 * 60 * 1000;
    const inSameWindow = windowStart && now.getTime() - windowStart < hourMs;

    await serviceSupabase
      .from("opportunity_sources")
      .update({
        last_pulled_at: now.toISOString(),
        total_ingested: (source.total_ingested || 0) + sourceIngested,
        consecutive_errors: 0,
        last_error: null,
        last_error_at: null,
        rate_used_this_hour: inSameWindow ? source.rate_used_this_hour + itemsFound : itemsFound,
        rate_window_start: inSameWindow ? source.rate_window_start : now.toISOString(),
      })
      .eq("id", source.id);
  } catch (err: any) {
    errorMessage = err?.message || "Unknown error";
    const newErrorCount = (source.consecutive_errors || 0) + 1;
    const shouldDegrade = newErrorCount >= DEGRADE_THRESHOLD;

    await serviceSupabase
      .from("opportunity_sources")
      .update({
        last_pulled_at: new Date().toISOString(),
        consecutive_errors: newErrorCount,
        last_error: errorMessage,
        last_error_at: new Date().toISOString(),
        is_degraded: shouldDegrade,
      })
      .eq("id", source.id);
  }

  const durationMs = Date.now() - startTime;

  await serviceSupabase.from("source_health_log").insert({
    source_id: source.id,
    items_found: itemsFound,
    items_new: itemsNew,
    items_duplicate: itemsFound - itemsNew,
    duration_ms: durationMs,
    error_message: errorMessage,
    success: errorMessage === null,
  });

  return { itemsNew, itemsFound, durationMs, error: errorMessage };
}

export async function POST(request: NextRequest) {
  if (request.headers.get("x-internal-secret") !== process.env.INTERNAL_API_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const serviceSupabase = createServiceClient();

  // P0#1: only pull sources that are both active AND have a working adapter.
  // 'pending_scraper' / 'disabled' sources (valuable but no adapter yet) are
  // skipped so they no longer inflate the live source count or silently fail.
  const { data: sources } = await serviceSupabase
    .from("opportunity_sources")
    .select("*")
    .eq("is_active", true)
    .eq("source_status", "active")
    .in("source_type", ["rss", "api", "scraper"]);

  if (!sources || sources.length === 0) {
    return NextResponse.json({ ingested: 0 });
  }

  const sorted = sortByPriority(sources);
  let totalIngested = 0;
  let totalFound = 0;
  let totalErrors = 0;
  let totalDurationMs = 0;
  const startTime = Date.now();

  for (let i = 0; i < sorted.length; i += CONCURRENT_BATCH_SIZE) {
    const batch = sorted.slice(i, i + CONCURRENT_BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map((source) => processSource(serviceSupabase, source))
    );

    for (const result of results) {
      if (result.status === "fulfilled") {
        totalIngested += result.value.itemsNew;
        totalFound += result.value.itemsFound;
        if (result.value.error) totalErrors++;
        totalDurationMs += result.value.durationMs;
      } else {
        totalErrors++;
      }
    }
  }

  const totalDurationSec = (Date.now() - startTime) / 1000;
  const itemsPerMin = totalDurationSec > 0 ? Math.round((totalIngested / totalDurationSec) * 60) : 0;
  const errorRate = sorted.length > 0 ? Math.round((totalErrors / sorted.length) * 100) : 0;
  const avgProcessingTime = totalIngested > 0 ? Math.round(totalDurationMs / totalIngested) : 0;

  if (totalIngested > 0) {
    fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/admin/opportunities/process-queue`, {
      method: "POST",
      headers: { "x-internal-secret": process.env.INTERNAL_API_SECRET! },
    }).catch(() => {});
  }

  return NextResponse.json({
    ingested: totalIngested,
    version: 4,
    metrics: {
      sources_processed: sorted.length,
      items_found: totalFound,
      items_per_minute: itemsPerMin,
      error_rate_pct: errorRate,
      avg_processing_time_ms: avgProcessingTime,
      total_duration_sec: Math.round(totalDurationSec * 100) / 100,
    },
  });
}
