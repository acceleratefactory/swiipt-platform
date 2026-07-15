import { NextRequest, NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  if (request.headers.get("x-internal-secret") !== process.env.INTERNAL_API_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { userId } = await request.json();
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  const adminSupabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: signals, error } = await adminSupabase
    .from("opportunity_signals")
    .select("*")
    .eq("user_id", userId)
    .gte("created_at", new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
    .order("created_at", { ascending: false });

  if (error || !signals || signals.length === 0) {
    return NextResponse.json({ ok: true, signalCount: 0 });
  }

  const now = Date.now();
  const segmentScores: Record<string, number> = {};
  const countryScores: Record<string, number> = {};
  const typeScores: Record<string, number> = {};
  const orgAffinity: Record<string, number> = {};

  // Reweight so TIME SPENT is the dominant interest signal (user rule):
  // dwell_long (lingering on a card) and passive view reading count more than
  // one-off binary actions like apply/share. Applied on top of the stored
  // signal_weight from the capture route.
  const INTEREST_TYPE_WEIGHTS: Record<string, number> = {
    dwell_long: 3.0,
    view: 1.5,
    expand: 1.5,
    save: 1.5,
    like: 1.5,
    search: 1.0,
    share: 1.0,
    service_click: 1.0,
    apply: 1.0,
    dismiss: 1.0,
    dwell_short: 1.0,
  };

  for (const signal of signals) {
    const ageMs = now - new Date(signal.created_at).getTime();
    const ageDays = ageMs / (1000 * 60 * 60 * 24);
    const recencyMultiplier = Math.max(0.4, 1 - (ageDays / 90) * 0.6);
    const typeMultiplier = INTEREST_TYPE_WEIGHTS[signal.signal_type] ?? 1;
    const effectiveWeight = signal.signal_weight * recencyMultiplier * typeMultiplier;

    if (signal.opportunity_segment) {
      segmentScores[signal.opportunity_segment] =
        (segmentScores[signal.opportunity_segment] || 0) + effectiveWeight;
    }
    if (signal.opportunity_country) {
      countryScores[signal.opportunity_country] =
        (countryScores[signal.opportunity_country] || 0) + effectiveWeight;
    }
    if (signal.opportunity_type) {
      typeScores[signal.opportunity_type] =
        (typeScores[signal.opportunity_type] || 0) + effectiveWeight;
    }
    if (signal.signal_weight > 0 && signal.opportunity_organisation) {
      orgAffinity[signal.opportunity_organisation] =
        (orgAffinity[signal.opportunity_organisation] || 0) + effectiveWeight;
    }
  }

  function normalise(scores: Record<string, number>): Record<string, number> {
    const maxVal = Math.max(...Object.values(scores), 1);
    return Object.fromEntries(
      Object.entries(scores).map(([k, v]) => [k, Math.round((v / maxVal) * 100)])
    );
  }

  const suppressedCountries = Object.entries(countryScores)
    .filter(([, v]) => v < -2)
    .map(([k]) => k);

  const suppressedTypes = Object.entries(typeScores)
    .filter(([, v]) => v < -2)
    .map(([k]) => k);

  const topOrgs = Object.entries(orgAffinity)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([org]) => org);

  const modelConfidence = signals.length >= 50 ? "high" : signals.length >= 10 ? "medium" : "low";

  await adminSupabase.from("user_interest_model").upsert({
    user_id: userId,
    segment_scores: normalise(segmentScores),
    country_scores: normalise(countryScores),
    type_scores: normalise(typeScores),
    org_affinity: topOrgs,
    suppressed_countries: suppressedCountries,
    suppressed_types: suppressedTypes,
    total_signals: signals.length,
    last_updated: new Date().toISOString(),
    model_confidence: modelConfidence,
  }, { onConflict: "user_id" });

  return NextResponse.json({ ok: true, signalCount: signals.length, modelConfidence });
}
