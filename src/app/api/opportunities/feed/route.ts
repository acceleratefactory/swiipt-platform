import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(_request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("career_profiles")
      .select("segment_slug, desired_countries, desired_roles")
      .eq("user_id", user.id)
      .single();

    if (!profile?.segment_slug) {
      return NextResponse.json({ error: "No career profile found" }, { status: 400 });
    }

    const { data: opportunities } = await supabase
      .from("opportunities")
      .select("*")
      .eq("segment_slug", profile.segment_slug)
      .eq("is_active", true);

    const { data: userData } = await supabase
      .from("users")
      .select("user_tier")
      .eq("id", user.id)
      .single();

    const userTier = userData?.user_tier || "free";

    if (!opportunities || opportunities.length === 0) {
      return NextResponse.json({
        feed: [],
        userReferrals: 0,
        userTier,
        segmentSlug: profile.segment_slug,
      });
    }

    const scored = opportunities.map((opp) => {
      let score = 50;
      if (opp.is_featured) score += 20;
      if (
        profile.desired_countries &&
        profile.desired_countries.some(
          (c: string) => c.toLowerCase() === (opp.location_country || "").toLowerCase()
        )
      ) {
        score += 15;
      }
      if (
        opp.type === "scholarship" &&
        profile.desired_roles?.includes("scholarship")
      ) {
        score += 15;
      }
      if (
        opp.type === "job" &&
        profile.desired_roles?.length &&
        profile.desired_roles.some(
          (r: string) =>
            opp.title.toLowerCase().includes(r.toLowerCase()) ||
            opp.description.toLowerCase().includes(r.toLowerCase())
        )
      ) {
        score += 10;
      }
      return { ...opp, relevanceScore: Math.min(score, 100) };
    });

    scored.sort((a, b) => b.relevanceScore - a.relevanceScore);

    const feedRecords = scored.map((opp) => ({
      user_id: user.id,
      opportunity_id: opp.id,
    }));

    await (supabase as any).from("user_opportunity_feed").upsert(feedRecords, {
      onConflict: "user_id, opportunity_id",
      ignoreDuplicates: false,
    });

    const { data: referralCount } = await supabase
      .from("referrals")
      .select("id", { count: "exact", head: true })
      .eq("referrer_id", user.id)
      .eq("commission_status", "completed");

    return NextResponse.json({
      feed: scored,
      userReferrals: referralCount ?? 0,
      userTier,
      segmentSlug: profile.segment_slug,
    });
  } catch (error) {
    console.error("Feed generation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
