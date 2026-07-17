// Shared feed scoring used by BOTH the feed page (server component) and
// /api/opportunities/feed, so ranking logic lives in exactly one place.
// See reports/findings/feed-personalization-and-ux-plan.md — Fix 1.
//
// Behaviour:
// - Global hard exclusion: footballer segment + sports_trial type never appear
//   in any feed (user rule: "except football").
// - Soft segment-self boost only (no segment filter) — a job_seeker opens with a
//   small relevance nudge toward their own segment, but the pool is everything.
// - Ranked by the interest/intent model; interest matches first, others after.

export interface FeedScoreProfile {
  segment_slug?: string | null;
  desired_countries?: string[] | null;
  desired_roles?: string[] | null;
}

export interface FeedInterestModel {
  segment_scores?: any;
  country_scores?: any;
  type_scores?: any;
  suppressed_countries?: any;
  suppressed_types?: any;
}

export interface ScoreContext {
  profile?: FeedScoreProfile | null;
  interestModel?: FeedInterestModel | null;
  appliedIds?: Set<string>;
}

// Global hard exclusion (user rule) — football never appears in any feed.
const EXCLUDED_SEGMENTS = new Set(["footballer"]);
const EXCLUDED_TYPES = new Set(["sports_trial"]);

// Non-English filter (Session 46). Keep NULL (not yet detected), "eng", "sco"
// (franc's English confusion) and "und" (undetermined/too short). Hide any other
// confidently-detected language (deu/fra/spa/...). This is a lightweight
// dependency-free check; detection itself happens at ingest/backfill.
const ENGLISH_OK = new Set(["eng", "sco", "und"]);

export function isExcluded(opp: any): boolean {
  // P0#5: prefer the precomputed is_non_english flag when present, else fall
  // back to the language-code check.
  if (opp?.is_non_english === true) return true;
  const lang = opp?.language;
  const nonEnglish = !!(lang && !ENGLISH_OK.has(lang));
  return (
    nonEnglish ||
    !!(
      (opp?.segment_slug && EXCLUDED_SEGMENTS.has(opp.segment_slug)) ||
      (opp?.type && EXCLUDED_TYPES.has(opp.type))
    )
  );
}

export function scoreOpportunities(opps: any[], ctx: ScoreContext = {}): any[] {
  const { profile, interestModel, appliedIds } = ctx;
  const segmentSlug = profile?.segment_slug || null;

  // 1) Hard exclusion — drop football everywhere.
  const eligible = opps.filter((o) => !isExcluded(o));

  // 2) Score the full pool (no segment filter — cross-domain surfacing).
  const scored = eligible.map((opp) => {
    let score = 50;

    // Soft segment-self boost (small, not a filter).
    if (segmentSlug && opp.segment_slug === segmentSlug) score += 15;

    if (interestModel?.segment_scores) {
      const segAff = interestModel.segment_scores[opp.segment_slug] || 0;
      score += Math.round(segAff * 0.2);
    }

    if (
      profile?.desired_countries &&
      profile.desired_countries.some(
        (c: string) => c.toLowerCase() === (opp.location_country || "").toLowerCase()
      )
    ) {
      score += 15;
    }

    if (interestModel?.country_scores) {
      const cntAff = interestModel.country_scores[opp.location_country] || 0;
      score += Math.round(cntAff * 0.15);
    }

    if (
      opp.type === "scholarship" &&
      profile?.desired_roles?.includes("scholarship")
    ) {
      score += 15;
    }

    if (
      opp.type === "job" &&
      profile?.desired_roles?.length &&
      profile.desired_roles.some(
        (r: string) =>
          (opp.title || "").toLowerCase().includes(r.toLowerCase()) ||
          (opp.description || "").toLowerCase().includes(r.toLowerCase())
      )
    ) {
      score += 10;
    }

    if (interestModel?.type_scores) {
      const typAff = interestModel.type_scores[opp.type] || 0;
      score += Math.round(typAff * 0.1);
    }

    if (interestModel?.suppressed_countries?.includes(opp.location_country)) score -= 30;
    if (interestModel?.suppressed_types?.includes(opp.type)) score -= 20;

    const ageHours = (Date.now() - new Date(opp.created_at).getTime()) / (1000 * 60 * 60);
    if (ageHours < 24) score += 15;
    else if (ageHours < 72) score += 8;

    if (opp.is_featured) score += 10;

    if (appliedIds?.has(opp.id)) score -= 40;

    // Cold-start fallback: no model yet → boost by popularity.
    if (!interestModel) {
      score += Math.min(15, Math.round((opp.apply_click_count || 0) * 0.5));
      score += Math.min(10, Math.round((opp.view_count || 0) * 0.1));
    }

    return { ...opp, relevanceScore: Math.max(0, Math.min(100, score)) };
  });

  // Interest-first ordering.
  scored.sort((a: any, b: any) => b.relevanceScore - a.relevanceScore);

  // 3) Source-diversity penalty (port from feed/route.ts): no single source
  //    dominates the top of the feed.
  const sourceCounts: Record<string, number> = {};
  for (const opp of scored) {
    const src = opp.source_name || "unknown";
    sourceCounts[src] = (sourceCounts[src] || 0) + 1;
  }
  const totalTop50 = scored.slice(0, 50).length;
  const diversityCutoff = Math.ceil(totalTop50 * 0.4);
  for (const opp of scored) {
    const src = opp.source_name || "unknown";
    if (sourceCounts[src] > diversityCutoff && opp.relevanceScore > 5) {
      opp.relevanceScore = Math.max(5, opp.relevanceScore - 15);
    }
  }

  scored.sort((a: any, b: any) => b.relevanceScore - a.relevanceScore);

  return scored;
}
