import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(request: NextRequest) {
  if (request.headers.get("x-internal-secret") !== process.env.INTERNAL_API_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const serviceSupabase = createServiceClient();

  const body = await request.json().catch(() => ({}));
  const limit = Math.min(body.limit || 50, 100);

  // Find failed evidence items that can be reprocessed
  const { data: items } = await (serviceSupabase as any)
    .from("evidence")
    .select("id, source_name, evidence_type, raw_data, captured_at")
    .eq("enrichment_status", "failed")
    .order("captured_at", { ascending: false })
    .limit(limit);

  if (!items || items.length === 0) {
    return NextResponse.json({ reprocessed: 0, message: "No failed items to reprocess" });
  }

  let reprocessed = 0;

  for (const item of items) {
    await (serviceSupabase as any)
      .from("evidence")
      .update({ enrichment_status: "pending" })
      .eq("id", item.id);

    reprocessed++;
  }

  // Trigger process-queue to pick up the re-queued items
  if (reprocessed > 0) {
    fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/admin/opportunities/process-queue`, {
      method: "POST",
      headers: { "x-internal-secret": process.env.INTERNAL_API_SECRET! },
    }).catch(() => {});
  }

  return NextResponse.json({ reprocessed });
}
