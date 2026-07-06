import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function GET() {
  const serviceSupabase = createServiceClient();

  const { data: items, error } = await (serviceSupabase as any)
    .from("opportunity_queue")
    .select("*")
    .eq("status", "needs_review")
    .order("ingested_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { count: total } = await (serviceSupabase as any)
    .from("opportunity_queue")
    .select("*", { count: "exact", head: true })
    .eq("status", "needs_review");

  return NextResponse.json({ items: items || [], total: total || 0 });
}

export async function POST(request: NextRequest) {
  if (request.headers.get("x-internal-secret") !== process.env.INTERNAL_API_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const serviceSupabase = createServiceClient();
  const body = await request.json();
  const { queueId, action, editedData } = body;

  if (!queueId || !action) {
    return NextResponse.json({ error: "queueId and action are required" }, { status: 400 });
  }

  const { data: item } = await (serviceSupabase as any)
    .from("opportunity_queue")
    .select("*")
    .eq("id", queueId)
    .single();

  if (!item) {
    return NextResponse.json({ error: "Queue item not found" }, { status: 404 });
  }

  if (action === "publish") {
    const enriched = item.ai_enriched_data || {};

    const { data: publishedOpp } = await (serviceSupabase as any)
      .from("opportunities")
      .insert({
        segment_slug: enriched.segment_slug || editedData?.segment_slug || "job_seeker",
        title: editedData?.title || enriched.cleaned_title || item.raw_title || "Untitled",
        organisation: editedData?.organisation || enriched.cleaned_organisation || item.raw_organisation || "Unknown",
        location_country: editedData?.location_country || enriched.location_country || item.raw_location || "Global",
        location_city: editedData?.location_city || enriched.location_city || null,
        type: editedData?.type || enriched.type || "job",
        description: editedData?.description || enriched.cleaned_description || item.raw_description || "",
        requirements: editedData?.requirements || enriched.requirements || item.raw_requirements || null,
        salary_range: editedData?.salary_range || enriched.salary_range || item.raw_salary || null,
        deadline: editedData?.deadline || enriched.deadline || item.raw_deadline || null,
        application_url: item.raw_url,
        source_url: item.source_url || null,
        source_name: item.source_name,
        ai_generated: true,
        ai_relevance_score: Math.round((item.confidence_score || 0.7) * 100),
        is_active: true,
        published_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    await (serviceSupabase as any)
      .from("opportunity_queue")
      .update({
        status: "approved",
        processed_at: new Date().toISOString(),
        published_opportunity_id: publishedOpp?.id,
      })
      .eq("id", queueId);

    return NextResponse.json({ success: true, publishedId: publishedOpp?.id });
  }

  if (action === "reject") {
    await (serviceSupabase as any)
      .from("opportunity_queue")
      .update({
        status: "rejected",
        rejection_reason: body.reason || "Rejected by admin",
        processed_at: new Date().toISOString(),
      })
      .eq("id", queueId);

    return NextResponse.json({ success: true, status: "rejected" });
  }

  return NextResponse.json({ error: "Invalid action. Use 'publish' or 'reject'." }, { status: 400 });
}
