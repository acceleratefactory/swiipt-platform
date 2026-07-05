import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const SIGNAL_WEIGHTS: Record<string, number> = {
  service_click: 3.0,
};

const VALID_SIGNALS = ["service_click"];

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { opportunityId, signal_type } = await request.json();
    if (!opportunityId || !signal_type || !VALID_SIGNALS.includes(signal_type)) {
      return NextResponse.json(
        { error: "opportunityId and signal_type (service_click) are required" },
        { status: 400 }
      );
    }

    const { data: opportunity } = await (supabase as any)
      .from("opportunities")
      .select("type, segment_slug, location_country, organisation")
      .eq("id", opportunityId)
      .single();

    if (!opportunity) {
      return NextResponse.json({ error: "Opportunity not found" }, { status: 404 });
    }

    await (supabase as any).from("opportunity_signals").insert({
      user_id: user.id,
      opportunity_id: opportunityId,
      signal_type,
      signal_weight: SIGNAL_WEIGHTS[signal_type] || 1.0,
      opportunity_segment: opportunity.segment_slug,
      opportunity_type: opportunity.type,
      opportunity_country: opportunity.location_country,
      opportunity_organisation: opportunity.organisation,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Track signal error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
