import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { enrich } from "@/lib/ai-service";
import { detectOpportunityLanguage } from "@/lib/language";
import { normalizeUrl } from "@/lib/url-normalize";

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
    .limit(8);

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
    // P0#3 (§1.5): strengthened mechanical gate — trivial checks are no longer
    // enough to publish. We also reject obvious spam patterns up front.
    const spamHit = isSpam(raw.title || "", raw.description || "", raw.organisation || "");
    const mechanicalChecks = {
      hasUrl: !!raw.url && raw.url !== "#" && /^https?:\/\//i.test(raw.url),
      deadlineNotPast: !raw.deadline || new Date(raw.deadline) > new Date(),
      hasMeaningfulTitle: !!(raw.title && raw.title.trim().length > 15),
      hasMeaningfulDescription: !!(raw.description && raw.description.trim().length > 80),
      hasOrganisation: !!(raw.organisation && raw.organisation.trim().length > 1 && !/unknown/i.test(raw.organisation)),
    };

    const mechanicalPassCount = Object.values(mechanicalChecks).filter(Boolean).length;
    const mechanicalScore = mechanicalPassCount / 5;

    if (spamHit || mechanicalScore < 0.6) {
      await (serviceSupabase as any)
        .from("evidence")
        .update({
          enrichment_status: "failed",
          enriched_data: { rejection_reason: spamHit ? `Spam pattern: ${spamHit}` : "Failed basic quality checks" },
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
      const confidence = trustTier === "trusted" && mechanicalScore >= 0.6 ? 0.92 : (response.confidence || enriched.confidence_score || 0);

      // P0#3 (§1.4): real quality evaluation on EVERY item, not just review_all.
      // Combines mechanical score + AI legitimacy/scam signal (when available)
      // into a single 0..1 quality score. Items below threshold are rejected;
      // borderline items go to a real review queue (needs_review), never "failed".
      const qc = await evaluateQuality({
        trustTier,
        mechanicalScore,
        enriched,
        raw,
        sourceName: item.source_name,
      });

      if (qc.scamRisk) {
        await (serviceSupabase as any)
          .from("evidence")
          .update({
            enrichment_status: "failed",
            quality_score: qc.qualityScore,
            is_scam_risk: true,
            enriched_data: { ...enriched, rejection_reason: "Scam / illegitimate" },
            ai_confidence: confidence,
          })
          .eq("id", item.id);
        rejected++;
        continue;
      }

      if (qc.qualityScore < QUALITY_REJECT) {
        await (serviceSupabase as any)
          .from("evidence")
          .update({
            enrichment_status: "failed",
            quality_score: qc.qualityScore,
            enriched_data: { ...enriched, rejection_reason: qc.reason || "Low quality score" },
            ai_confidence: confidence,
          })
          .eq("id", item.id);
        rejected++;
        continue;
      }

      // Borderline → real review queue (not "failed"). Admin reviews in
      // /admin/opportunities/queue. Evidence keeps enriched data for context.
      if (qc.qualityScore < QUALITY_REVIEW || trustTier === "review_all") {
        await (serviceSupabase as any)
          .from("evidence")
          .update({
            enrichment_status: "needs_review",
            quality_score: qc.qualityScore,
            is_scam_risk: false,
            enriched_data: enriched,
            ai_confidence: confidence,
          })
          .eq("id", item.id);
        needsReview++;
        continue;
      }

      // High quality → publish (Path A for trusted, Path B otherwise).
      const oppId = crypto.randomUUID();
      const seg = safeSegment(enriched.segment_slug, sourceRecord?.segment_slug);
      const { data: publishedOpp, error: insertErr } = await (serviceSupabase as any)
        .from("opportunities")
        .insert({
          id: oppId,
          segment_slug: seg,
          title: enriched.cleaned_title || raw.title || "Untitled",
          organisation: resolveOrganisation(enriched, raw),
          location_country: enriched.location_country || raw.location || "Global",
          location_city: enriched.location_city || null,
          type: safeType(enriched.type, seg),
          description: enriched.cleaned_description || raw.description || "",
          requirements: enriched.requirements || raw.requirements || null,
          salary_range: enriched.salary_range || raw.salary || null,
          deadline: enriched.deadline || raw.deadline || null,
          application_url: raw.url,
          normalized_url: normalizeUrl(raw.url),
          cover_image_url: null,
          language: detectOpportunityLanguage(
            enriched.cleaned_title || raw.title,
            enriched.cleaned_description || raw.description
          ),
          source_url: item.source_url || null,
          source_name: item.source_name,
          ai_generated: true,
          ai_relevance_score: Math.round((confidence || mechanicalScore) * 100),
          ai_quality_score: Math.round(qc.qualityScore * 100),
          is_scam_risk: false,
          quality_reason: qc.reason || null,
          is_active: true,
          published_at: new Date().toISOString(),
          provenance: {
            source_id: item.source_id || null,
            source_evidence_id: item.id,
            evidence_type: item.evidence_type,
            ai_model: enriched.ai_model || null,
            ai_confidence: confidence,
            ai_quality_score: qc.qualityScore,
            ai_raw_response: enriched,
            captured_at: item.captured_at,
            enriched_at: new Date().toISOString(),
            confidence_history: [
              { score: confidence, reason: "ai_extraction", timestamp: new Date().toISOString() },
            ],
            source_trust_tier: trustTier,
          },
        })
        .select("id")
        .single();

      if (insertErr) {
        console.error("[PROCESS-QUEUE] INSERT ERROR:", {
          message: insertErr.message,
          evidence_id: item.id,
          oppId,
        });
        await (serviceSupabase as any)
          .from("evidence")
          .update({
            enrichment_status: "failed",
            quality_score: qc.qualityScore,
            enriched_data: { ...enriched, insert_error: insertErr.message },
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
          quality_score: qc.qualityScore,
          enriched_data: { ...enriched, debug_oppId: oppId, debug_publishedOpp: publishedOpp },
          ai_confidence: confidence,
          opportunity_id: publishedOpp?.id ?? oppId,
        })
        .eq("id", item.id);

      console.error("[PROCESS-QUEUE] SUCCESS:", {
        evidence_id: item.id,
        oppId,
        publishedOpp_id: publishedOpp?.id,
        qualityScore: qc.qualityScore,
      });

      published++;
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

// ─── P0#3 (§1.4 / §1.5): quality gate ────────────────────────────────────
// Quality thresholds (0..1). Below REJECT → dropped. Between REJECT and REVIEW
// → sent to the real admin review queue. At/above REVIEW → published.
const QUALITY_REJECT = 0.4;
const QUALITY_REVIEW = 0.6;

// Spam / scammy title+description patterns. Returns the matched pattern or null.
function isSpam(title: string, description: string, organisation: string): string | null {
  const text = `${title} ${description} ${organisation}`.toLowerCase();
  const patterns: RegExp[] = [
    /(click here now|earn \$?\d+ ?(per|a) ?(day|week|hour)|work from home (and|&) get rich)/,
    /(crypto|forex|bitcoin) (trading|investment|signal|doubler)/,
    /(telegram|whatsapp) (channel|group) (link|join)/,
    /(loan|grant) approval (without|no) (credit check|documents)/,
    /(dm|inbox|message) me (for|to) (more|details)/,
    /(urgent|limited).{0,20}(only|spots left|act now)/,
    /(www\.)?(bit\.ly|tinyurl|t\.co|cutt\.ly|rb\.gy|shorte\.st)/,
  ];
  for (const p of patterns) {
    if (p.test(text)) return p.source;
  }
  return null;
}

interface QualityInput {
  trustTier: "trusted" | "standard" | "review_all";
  mechanicalScore: number;
  enriched: any;
  raw: any;
  sourceName?: string | null;
}

interface QualityResult {
  qualityScore: number;
  scamRisk: boolean;
  reason?: string;
}

// Produce a single 0..1 quality score. Base = mechanical score; trusted tier
// gets a boost; AI legitimacy/scam signal (if the model returned one) drives
// the score down hard. When AI is unavailable we fall back to mechanical only.
async function evaluateQuality(input: QualityInput): Promise<QualityResult> {
  const { trustTier, mechanicalScore, enriched, raw } = input;

  let score = mechanicalScore; // 0..1 base from mechanical checks (now /5)
  if (trustTier === "trusted") score = Math.min(1, score + 0.15);

  // AI legitimacy signal (only present when the provider returned it, e.g.
  // review_all / public-submission style prompts). Trusted/standard format-only
  // prompts don't return these, so we rely on mechanical + trust.
  const aiLegit = enriched?.is_legitimate;
  const aiScam = enriched?.is_scam_risk;
  const aiConf = typeof enriched?.confidence_score === "number" ? enriched.confidence_score : null;

  if (aiScam === true) {
    return { qualityScore: 0, scamRisk: true, reason: "AI flagged scam risk" };
  }
  if (aiLegit === false) {
    score = Math.min(score, 0.35);
  }
  if (typeof aiConf === "number") {
    // Blend AI confidence with mechanical (AI is the stronger signal).
    score = score * 0.4 + aiConf * 0.6;
  }

  // Heuristic penalties for low-information content.
  const desc = (raw?.description || enriched?.cleaned_description || "").trim();
  if (desc.length < 120) score -= 0.1;
  if (!raw?.organisation || /unknown/i.test(raw.organisation)) score -= 0.1;

  score = Math.max(0, Math.min(1, score));
  const reason =
    score < QUALITY_REVIEW ? "Borderline quality — queued for review" : undefined;
  return { qualityScore: score, scamRisk: false, reason };
}
