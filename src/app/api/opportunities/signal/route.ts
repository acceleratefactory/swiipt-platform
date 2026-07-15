import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

const SIGNAL_WEIGHTS: Record<string, number> = {
  view: 0.5,
  expand: 2.0,
  save: 4.0,
  apply: 6.0,
  dismiss: -3.0,
  share: 5.0,
  service_click: 3.0,
  dwell_long: 2.5,
  dwell_short: -0.5,
  search: 3.0,
};

const VALID_SIGNALS = new Set(Object.keys(SIGNAL_WEIGHTS));

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ ok: true });

    const { opportunityId, signalType } = await request.json();
    if (!opportunityId || !signalType || !VALID_SIGNALS.has(signalType)) {
      return NextResponse.json({ ok: true });
    }

    const adminSupabase = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: opp } = await adminSupabase
      .from("opportunities")
      .select("segment_slug, type, location_country, organisation")
      .eq("id", opportunityId)
      .single();

    if (!opp) return NextResponse.json({ ok: true });

    const weight = SIGNAL_WEIGHTS[signalType];

    await adminSupabase.from("opportunity_signals").insert({
      user_id: user.id,
      opportunity_id: opportunityId,
      signal_type: signalType,
      opportunity_segment: opp.segment_slug,
      opportunity_type: opp.type,
      opportunity_country: opp.location_country,
      opportunity_organisation: opp.organisation,
      signal_weight: weight,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
