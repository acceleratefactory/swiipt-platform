import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { enrich } from "@/lib/ai-service";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  if (request.headers.get("x-internal-secret") !== process.env.INTERNAL_API_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const serviceSupabase = createServiceClient();

  const { data: evidenceItems } = await (serviceSupabase as any)
    .from("evidence")
    .select("*")
    .eq("enrichment_status", "pending")
    .order("captured_at", { ascending: true })
    .limit(30);

  if (!evidenceItems || evidenceItems.length === 0) {
    return NextResponse.json({ processed: 0 });
  }

  let published = 0;
  let needsReview = 0;
  let rejected = 0;

  for (const item of evidenceItems) {
    await (serviceSupabase as any)
      .from("evidence")
      .update({ enrichment_status: "processing" })
      .eq("id", item.id);

    const raw = item.raw_data || {};
    const mechanicalChecks = {
      hasUrl: !!raw.url && raw.url !== "#",
      deadlineInFuture: !raw.deadline || new Date(raw.deadline) > new Date(),
      hasMeaningfulTitle: !!(raw.title && raw.title.length > 10),
      hasMeaningfulDescription: !!(raw.description && raw.description.length > 50),
    };

    const mechanicalScore = Object.values(mechanicalChecks).filter(Boolean).length / 4;

    if (mechanicalScore < 0.5) {
      await (serviceSupabase as any)
        .from("evidence")
        .update({
          enrichment_status: "failed",
          enriched_data: { rejection_reason: "Failed basic quality checks" },
        })
        .eq("id", item.id);
      rejected++;
      continue;
    }

    const { data: sourceRecord } = await (serviceSupabase as any)
      .from("opportunity_sources")
      .select("trust_tier, segment_slug")
      .eq("name", item.source_name)
      .single();

    const trustTier = (sourceRecord?.trust_tier || "standard") as "trusted" | "standard" | "review_all";

    try {
      const response = await enrich({
        task: "process-queue",
        data: {
          raw_title: raw.title,
          raw_organisation: raw.organisation,
          raw_location: raw.location,
          raw_description: raw.description,
          raw_salary: raw.salary,
          raw_deadline: raw.deadline,
          raw_url: raw.url,
          raw_requirements: raw.requirements,
          source_name: item.source_name,
          source_url: item.source_url,
        },
        tier: trustTier,
      });

      const enriched: any = response.enriched || {};
      const confidence = trustTier === "trusted" && mechanicalScore >= 0.5 ? 0.92 : (response.confidence || enriched.confidence_score || 0);

      if (enriched.is_scam_risk) {
        await (serviceSupabase as any)
          .from("evidence")
          .update({
            enrichment_status: "failed",
            enriched_data: enriched,
            ai_confidence: confidence,
          })
          .eq("id", item.id);
        rejected++;
        continue;
      }

      const provenance = {
        source_id: item.source_id || null,
        source_evidence_id: item.id,
        evidence_type: item.evidence_type,
        ai_model: enriched.ai_model || null,
        ai_confidence: confidence,
        ai_raw_response: enriched,
        captured_at: item.captured_at,
        enriched_at: new Date().toISOString(),
        confidence_history: [
          { score: confidence, reason: "ai_extraction", timestamp: new Date().toISOString() },
        ],
        source_trust_tier: trustTier,
      };

      if (trustTier === "trusted" && mechanicalScore >= 0.5) {
        const oppId = crypto.randomUUID();
        const { data: publishedOpp, error: insertErrA } = await (serviceSupabase as any)
          .from("opportunities")
          .insert({
            id: oppId,
            segment_slug: safeSegment(enriched.segment_slug, sourceRecord?.segment_slug),
            title: enriched.cleaned_title || raw.title || "Untitled",
            organisation: resolveOrganisation(enriched, raw),
            location_country: enriched.location_country || raw.location || "Global",
            location_city: enriched.location_city || null,
            type: safeType(enriched.type, safeSegment(enriched.segment_slug, sourceRecord?.segment_slug)),
            description: enriched.cleaned_description || raw.description || "",
            requirements: enriched.requirements || raw.requirements || null,
            salary_range: enriched.salary_range || raw.salary || null,
            deadline: enriched.deadline || raw.deadline || null,
            application_url: raw.url,
            cover_image_url: null,
            source_url: item.source_url || null,
            source_name: item.source_name,
            ai_generated: true,
            ai_relevance_score: Math.round(confidence * 100),
            is_active: true,
            published_at: new Date().toISOString(),
            provenance,
          })
          .select("id")
          .single();

        if (insertErrA) {
          console.error("[PROCESS-QUEUE] INSERT ERROR Path A:", {
            message: insertErrA.message,
            evidence_id: item.id,
            oppId: oppId
          });
          await (serviceSupabase as any)
            .from("evidence")
            .update({
              enrichment_status: "failed",
              enriched_data: { ...enriched, insert_error: insertErrA.message },
              ai_confidence: confidence,
            })
            .eq("id", item.id);
          rejected++;
          continue;
        }

        await (serviceSupabase as any)
          .from("evidence")
          .update({
            enrichment_status: "enriched",
            enriched_data: { ...enriched, debug_oppId: oppId, debug_publishedOpp: publishedOpp },
            ai_confidence: confidence,
            opportunity_id: publishedOpp?.id ?? oppId,
          })
          .eq("id", item.id);

        console.error("[PROCESS-QUEUE] SUCCESS Path A:", {
          evidence_id: item.id,
          oppId: oppId,
          publishedOpp_id: publishedOpp?.id,
          final_opportunity_id: publishedOpp?.id ?? oppId
        });

        published++;
      } else if (trustTier === "review_all") {
        await (serviceSupabase as any)
          .from("evidence")
          .update({
            enrichment_status: "failed",
            enriched_data: enriched,
            ai_confidence: confidence,
          })
          .eq("id", item.id);
        needsReview++;
      } else if (mechanicalScore >= 0.75) {
        const oppId = crypto.randomUUID();
        const { data: publishedOpp, error: insertErrB } = await (serviceSupabase as any)
          .from("opportunities")
          .insert({
            id: oppId,
            segment_slug: safeSegment(enriched.segment_slug, sourceRecord?.segment_slug),
            title: enriched.cleaned_title || raw.title || "Untitled",
            organisation: resolveOrganisation(enriched, raw),
            location_country: enriched.location_country || raw.location || "Global",
            location_city: enriched.location_city || null,
            type: safeType(enriched.type, safeSegment(enriched.segment_slug, sourceRecord?.segment_slug)),
            description: enriched.cleaned_description || raw.description || "",
            requirements: enriched.requirements || raw.requirements || null,
            salary_range: enriched.salary_range || raw.salary || null,
            deadline: enriched.deadline || raw.deadline || null,
            application_url: raw.url,
            cover_image_url: null,
            source_url: item.source_url || null,
            source_name: item.source_name,
            ai_generated: true,
            ai_relevance_score: Math.round((confidence || mechanicalScore) * 100),
            is_active: true,
            published_at: new Date().toISOString(),
            provenance,
          })
          .select("id")
          .single();

        if (insertErrB) {
          console.error("[PROCESS-QUEUE] INSERT ERROR Path B:", {
            message: insertErrB.message,
            evidence_id: item.id,
            oppId: oppId
          });
          await (serviceSupabase as any)
            .from("evidence")
            .update({
              enrichment_status: "failed",
              enriched_data: { ...enriched, insert_error: insertErrB.message },
              ai_confidence: confidence,
            })
            .eq("id", item.id);
          rejected++;
          continue;
        }

        await (serviceSupabase as any)
          .from("evidence")
          .update({
            enrichment_status: "enriched",
            enriched_data: { ...enriched, debug_oppId: oppId, debug_publishedOpp: publishedOpp },
            ai_confidence: confidence,
            opportunity_id: publishedOpp?.id ?? oppId,
          })
          .eq("id", item.id);

        console.error("[PROCESS-QUEUE] SUCCESS Path B:", {
          evidence_id: item.id,
          oppId: oppId,
          publishedOpp_id: publishedOpp?.id,
          final_opportunity_id: publishedOpp?.id ?? oppId
        });

        published++;
      } else if (mechanicalScore >= 0.5) {
        await (serviceSupabase as any)
          .from("evidence")
          .update({
            enrichment_status: "failed",
            enriched_data: enriched,
            ai_confidence: confidence,
          })
          .eq("id", item.id);
        needsReview++;
      } else {
        await (serviceSupabase as any)
          .from("evidence")
          .update({
            enrichment_status: "failed",
            enriched_data: enriched,
            ai_confidence: confidence,
          })
          .eq("id", item.id);
        rejected++;
      }
    } catch {
      await (serviceSupabase as any)
        .from("evidence")
        .update({
          enrichment_status: "failed",
          enriched_data: { error: "AI processing error" },
        })
        .eq("id", item.id);
      needsReview++;
    }
  }

  return NextResponse.json({ processed: evidenceItems.length, published, needsReview, rejected, version: 3 });
}

const ALLOWED_TYPES = new Set([
  "job", "scholarship", "fellowship", "visa_programme", "sports_trial",
  "remote_work", "internship", "training", "grant", "competition",
  "conference", "exchange", "trade_show", "trial", "healthcare",
  "residency", "citizenship", "funding", "contest", "accelerator", "award",
]);

function safeType(raw: string | undefined, segment: string): string {
  if (raw && ALLOWED_TYPES.has(raw)) return raw;
  return inferTypeFromSegment(segment);
}

const ALLOWED_SEGMENTS = new Set([
  "job_seeker", "student", "healthcare", "tech_professional", "footballer",
  "sports_professional", "freelancer", "entrepreneur", "trade_worker", "caregiver",
]);

function safeSegment(raw: string | undefined, fallback?: string): string {
  if (raw && ALLOWED_SEGMENTS.has(raw)) return raw;
  if (fallback && ALLOWED_SEGMENTS.has(fallback)) return fallback;
  return "job_seeker";
}

function inferTypeFromSegment(segment: string): string {
  const segmentTypeMap: Record<string, string> = {
    job_seeker: "job",
    student: "scholarship",
    healthcare: "healthcare",
    tech_professional: "remote_work",
    footballer: "sports_trial",
    sports_professional: "sports_trial",
    freelancer: "remote_work",
    entrepreneur: "grant",
    trade_worker: "training",
    caregiver: "job",
  };
  return segmentTypeMap[segment] || "job";
}

function deriveFromUrl(url: string | undefined): string | null {
  if (!url) return null;
  try {
    const host = new URL(url).hostname.toLowerCase();
    const labels = host.split(".").filter((p) => !["www", "jobs", "careers", "apply", "app", "web"].includes(p));
    const sld = labels.length >= 2 ? labels[labels.length - 2] : labels[labels.length - 1];
    if (!sld || sld.length < 3) return null;
    return sld.charAt(0).toUpperCase() + sld.slice(1);
  } catch {
    return null;
  }
}

function resolveOrganisation(enriched: any, raw: any): string {
  const candidates = [
    enriched?.cleaned_organisation,
    enriched?.organisation,
    raw?.organisation,
    deriveFromUrl(raw?.url),
  ];
  for (const c of candidates) {
    if (typeof c === "string" && c.trim().length > 1 && c.trim().toLowerCase() !== "unknown") {
      return c.trim();
    }
  }
  return "Unknown";
}
