import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const SIGNAL_WEIGHTS: Record<string, number> = {
  like: 3.5,
};

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { opportunityId } = await request.json();
    if (!opportunityId) {
      return NextResponse.json({ error: "opportunityId is required" }, { status: 400 });
    }

    const { data: opportunity } = await (supabase as any)
      .from("opportunities")
      .select("type, segment_slug, location_country, organisation")
      .eq("id", opportunityId)
      .single();

    if (!opportunity) {
      return NextResponse.json({ error: "Opportunity not found" }, { status: 404 });
    }

    const { data: existing } = await (supabase as any)
      .from("opportunity_signals")
      .select("id")
      .eq("user_id", user.id)
      .eq("opportunity_id", opportunityId)
      .eq("signal_type", "like")
      .maybeSingle();

    if (existing) {
      await (supabase as any)
        .from("opportunity_signals")
        .delete()
        .eq("id", existing.id);

      const { count } = await (supabase as any)
        .from("opportunity_signals")
        .select("id", { count: "exact" })
        .eq("opportunity_id", opportunityId)
        .eq("signal_type", "like");

      return NextResponse.json({ liked: false, like_count: count || 0 });
    }

    await (supabase as any).from("opportunity_signals").insert({
      user_id: user.id,
      opportunity_id: opportunityId,
      signal_type: "like",
      signal_weight: SIGNAL_WEIGHTS.like,
      opportunity_segment: opportunity.segment_slug,
      opportunity_type: opportunity.type,
      opportunity_country: opportunity.location_country,
      opportunity_organisation: opportunity.organisation,
    });

    const { count } = await (supabase as any)
      .from("opportunity_signals")
      .select("id", { count: "exact" })
      .eq("opportunity_id", opportunityId)
      .eq("signal_type", "like");

    return NextResponse.json({ liked: true, like_count: count || 0 });
  } catch (error) {
    console.error("Like error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
