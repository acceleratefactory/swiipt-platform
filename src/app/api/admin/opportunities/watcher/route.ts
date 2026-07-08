import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { createHash } from "crypto";

const DEGRADE_THRESHOLD = 5;

function computeHash(data: string): string {
  return createHash("sha256").update(data).digest("hex").slice(0, 64);
}

function stripHtml(text: string): string {
  return text.replace(/<[^>]*>/g, "").replace(/&[^;]+;/g, " ").trim();
}

export async function POST(request: NextRequest) {
  if (request.headers.get("x-internal-secret") !== process.env.INTERNAL_API_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const serviceSupabase = createServiceClient();

  const { data: sources } = await (serviceSupabase as any)
    .from("opportunity_sources")
    .select("*")
    .eq("is_active", true)
    .eq("source_type", "watcher");

  let totalChanged = 0;

  for (const source of sources || []) {
    const pageUrl = source.source_url;
    if (!pageUrl || pageUrl === "#") continue;

    const startTime = Date.now();
    let itemsFound = 0;
    let errorMessage: string | null = null;

    try {
      const res = await fetch(pageUrl, {
        signal: AbortSignal.timeout(15000),
        headers: {
          "User-Agent": "Swiipt-Bot/1.0 (opportunities@swiipt.com)",
          "Accept": "text/html,application/xhtml+xml",
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const html = await res.text();
      const newHash = computeHash(html);

      const { data: existing } = await (serviceSupabase as any)
        .from("page_hashes")
        .select("id, content_hash, change_count")
        .eq("source_id", source.id)
        .eq("page_url", pageUrl)
        .maybeSingle();

      if (!existing) {
        await (serviceSupabase as any).from("page_hashes").insert({
          source_id: source.id,
          page_url: pageUrl,
          content_hash: newHash,
          content_snapshot: stripHtml(html).slice(0, 2000),
          last_checked_at: new Date().toISOString(),
        });
      } else {
        await (serviceSupabase as any)
          .from("page_hashes")
          .update({
            content_hash: newHash,
            last_checked_at: new Date().toISOString(),
          })
          .eq("id", existing.id);

        if (newHash !== existing.content_hash) {
          await (serviceSupabase as any)
            .from("page_hashes")
            .update({ last_changed_at: new Date().toISOString() })
            .eq("id", existing.id);

          await (serviceSupabase as any).from("evidence").insert({
            evidence_type: "watcher",
            raw_data: {
              title: `Page changed: ${source.name}`,
              organisation: source.name,
              description: stripHtml(html).slice(0, 1000),
              url: pageUrl,
              change_summary: `Content hash changed from ${existing.content_hash.slice(0, 8)}… to ${newHash.slice(0, 8)}…`,
            },
            source_url: pageUrl,
            source_name: source.name,
            content_hash: `watcher-${source.id}-${newHash}`,
            enrichment_status: "pending",
          });

          itemsFound = 1;
          totalChanged++;
        }
      }

      await (serviceSupabase as any)
        .from("opportunity_sources")
        .update({
          last_pulled_at: new Date().toISOString(),
          consecutive_errors: 0,
          last_error: null,
          last_error_at: null,
        })
        .eq("id", source.id);
    } catch (err: any) {
      errorMessage = err?.message || "Unknown error";
      const newErrorCount = (source.consecutive_errors || 0) + 1;
      const shouldDegrade = newErrorCount >= DEGRADE_THRESHOLD;

      await (serviceSupabase as any)
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

    await (serviceSupabase as any).from("source_health_log").insert({
      source_id: source.id,
      items_found: itemsFound,
      items_new: itemsFound,
      duration_ms: durationMs,
      error_message: errorMessage,
      success: errorMessage === null,
    });
  }

  if (totalChanged > 0) {
    fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/admin/opportunities/process-queue`, {
      method: "POST",
      headers: { "x-internal-secret": process.env.INTERNAL_API_SECRET! },
    }).catch(() => {});
  }

  return NextResponse.json({ watched: sources?.length || 0, changed: totalChanged });
}
