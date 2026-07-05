import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { enrich } from "@/lib/ai-service";

export async function POST(request: NextRequest) {
  if (request.headers.get("x-internal-secret") !== process.env.INTERNAL_API_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const serviceSupabase = createServiceClient();

  const { data: queueItems } = await (serviceSupabase as any)
    .from("opportunity_queue")
    .select("*")
    .eq("status", "pending")
    .order("ingested_at", { ascending: true })
    .limit(20);

  if (!queueItems || queueItems.length === 0) {
    return NextResponse.json({ processed: 0 });
  }

  let published = 0;
  let needsReview = 0;
  let rejected = 0;

  for (const item of queueItems) {
    await (serviceSupabase as any)
      .from("opportunity_queue")
      .update({ status: "processing" })
      .eq("id", item.id);

    const mechanicalChecks = {
      hasUrl: !!item.raw_url && item.raw_url !== "#",
      deadlineInFuture: !item.raw_deadline || new Date(item.raw_deadline) > new Date(),
      hasMeaningfulTitle: !!(item.raw_title && item.raw_title.length > 10),
      hasMeaningfulDescription: !!(item.raw_description && item.raw_description.length > 50),
    };

    const mechanicalScore = Object.values(mechanicalChecks).filter(Boolean).length / 4;

    if (mechanicalScore < 0.5) {
      await (serviceSupabase as any)
        .from("opportunity_queue")
        .update({
          status: "rejected",
          rejection_reason: "Failed basic quality checks",
          processed_at: new Date().toISOString(),
        })
        .eq("id", item.id);
      rejected++;
      continue;
    }

    const { data: sourceRecord } = await (serviceSupabase as any)
      .from("opportunity_sources")
      .select("trust_tier")
      .eq("name", item.source_name)
      .single();

    const trustTier = (sourceRecord?.trust_tier || "standard") as "trusted" | "standard" | "review_all";

    try {
      const response = await enrich({
        task: "process-queue",
        data: item,
        tier: trustTier,
      });

      const enriched: any = response.enriched || {};
      const confidence = trustTier === "trusted" && mechanicalScore >= 0.75 ? 0.92 : (response.confidence || enriched.confidence_score || 0);

      if (enriched.is_scam_risk) {
        await (serviceSupabase as any)
          .from("opportunity_queue")
          .update({
            status: "rejected",
            confidence_score: confidence,
            ai_enriched_data: enriched,
            rejection_reason: "Flagged as potential scam",
            processed_at: new Date().toISOString(),
          })
          .eq("id", item.id);
        rejected++;
        continue;
      }

      if (trustTier === "trusted" && mechanicalScore >= 0.75) {
        const { data: publishedOpp } = await (serviceSupabase as any)
          .from("opportunities")
          .insert({
            segment_slug: enriched.segment_slug || item.source_name,
            title: enriched.cleaned_title || item.raw_title,
            organisation: enriched.cleaned_organisation || item.raw_organisation || "Unknown",
            location_country: enriched.location_country || item.raw_location || "Global",
            location_city: enriched.location_city || null,
            type: enriched.type || "job",
            description: enriched.cleaned_description || item.raw_description || "",
            requirements: enriched.requirements || item.raw_requirements || null,
            salary_range: enriched.salary_range || item.raw_salary || null,
            deadline: enriched.deadline || item.raw_deadline || null,
            application_url: item.raw_url,
            source_url: item.source_url || null,
            source_name: item.source_name,
            ai_generated: true,
            ai_relevance_score: Math.round(confidence * 100),
            is_active: true,
            published_at: new Date().toISOString(),
          })
          .select("id")
          .single();

        await (serviceSupabase as any)
          .from("opportunity_queue")
          .update({
            status: "approved",
            confidence_score: confidence,
            ai_enriched_data: enriched,
            processed_at: new Date().toISOString(),
            published_opportunity_id: publishedOpp?.id,
          })
          .eq("id", item.id);

        published++;
      } else if (trustTier === "review_all") {
        await (serviceSupabase as any)
          .from("opportunity_queue")
          .update({
            status: "needs_review",
            confidence_score: confidence,
            ai_enriched_data: enriched,
            review_notes: "Tier 3 — manual review required",
            processed_at: new Date().toISOString(),
          })
          .eq("id", item.id);
        needsReview++;
      } else if (confidence >= 0.85 && enriched.is_legitimate && enriched.is_relevant_for_nigerians) {
        const { data: publishedOpp } = await (serviceSupabase as any)
          .from("opportunities")
          .insert({
            segment_slug: enriched.segment_slug,
            title: enriched.cleaned_title,
            organisation: enriched.cleaned_organisation,
            location_country: enriched.location_country,
            location_city: enriched.location_city || null,
            type: enriched.type,
            description: enriched.cleaned_description,
            requirements: enriched.requirements || null,
            salary_range: enriched.salary_range || null,
            deadline: enriched.deadline || null,
            application_url: item.raw_url,
            source_url: item.source_url || null,
            source_name: item.source_name,
            ai_generated: true,
            ai_relevance_score: Math.round(confidence * 100),
            is_active: true,
            published_at: new Date().toISOString(),
          })
          .select("id")
          .single();

        await (serviceSupabase as any)
          .from("opportunity_queue")
          .update({
            status: "approved",
            confidence_score: confidence,
            ai_enriched_data: enriched,
            processed_at: new Date().toISOString(),
            published_opportunity_id: publishedOpp?.id,
          })
          .eq("id", item.id);

        published++;
      } else if (confidence >= 0.60) {
        await (serviceSupabase as any)
          .from("opportunity_queue")
          .update({
            status: "needs_review",
            confidence_score: confidence,
            ai_enriched_data: enriched,
            review_notes: `Confidence: ${confidence}. Reason: ${enriched.rejection_reason || "Below auto-publish threshold"}`,
            processed_at: new Date().toISOString(),
          })
          .eq("id", item.id);
        needsReview++;
      } else {
        await (serviceSupabase as any)
          .from("opportunity_queue")
          .update({
            status: "rejected",
            confidence_score: confidence,
            ai_enriched_data: enriched,
            rejection_reason: enriched.rejection_reason || "Below confidence threshold",
            processed_at: new Date().toISOString(),
          })
          .eq("id", item.id);
        rejected++;
      }
    } catch {
      await (serviceSupabase as any)
        .from("opportunity_queue")
        .update({
          status: "needs_review",
          review_notes: "AI processing error — needs manual review",
          processed_at: new Date().toISOString(),
        })
        .eq("id", item.id);
      needsReview++;
    }
  }

  return NextResponse.json({ processed: queueItems.length, published, needsReview, rejected });
}
