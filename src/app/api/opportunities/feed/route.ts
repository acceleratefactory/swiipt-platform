import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { scoreOpportunities } from "@/lib/opportunity-feed-score";

const ADMIN_SUPABASE = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const query = body.query?.trim();
    const typeFilter = body.type?.trim();
    const countryFilter = body.country?.trim();
    const isSearch = query || typeFilter || countryFilter;

    const { data: userData } = await supabase
      .from("users")
      .select("user_tier")
      .eq("id", user.id)
      .single();

    const userTier = userData?.user_tier || "free";

    if (isSearch) {
      let searchQuery = supabase
        .from("opportunities")
        .select("*")
        .eq("is_active", true)
        // Non-English filter (Session 46): keep English + untagged, hide the rest.
        .or("language.is.null,language.in.(eng,sco,und)");

      if (query) {
        searchQuery = searchQuery.or(
          `title.ilike.%${query}%,organisation.ilike.%${query}%,description.ilike.%${query}%`
        );
      }
      if (typeFilter) {
        searchQuery = searchQuery.eq("type", typeFilter);
      }
      if (countryFilter) {
        searchQuery = searchQuery.or(`location_country.ilike.%${countryFilter}%`);
      }

      const { data: results } = await searchQuery
        .order("created_at", { ascending: false })
        .limit(50);

      return NextResponse.json({
        feed: results || [],
        userReferrals: 0,
        userTier,
        segmentSlug: null,
      });
    }

    const { data: profile } = await supabase
      .from("career_profiles")
      .select("segment_slug, desired_countries, desired_roles")
      .eq("user_id", user.id)
      .single();

    const segmentSlug = profile?.segment_slug || null;

    // Fix 1: rank the FULL active pool (no segment filter). Football exclusion
    // and cross-domain ranking happen inside the shared scorer.
    let { data: opportunities } = await supabase
      .from("opportunities")
      .select("*")
      .eq("is_active", true)
      // Non-English filter (Session 46): keep English + untagged, hide the rest.
      // The scorer also drops non-English; this trims the payload after backfill.
      .or("language.is.null,language.in.(eng,sco,und)");

    if (!opportunities) opportunities = [];

    if (opportunities.length === 0) {
      return NextResponse.json({
        feed: [],
        userReferrals: 0,
        userTier,
        segmentSlug,
      });
    }

    const [interestModelRes, seenFeedRes] = await Promise.all([
      ADMIN_SUPABASE.from("user_interest_model")
        .select("*")
        .eq("user_id", user.id)
        .single(),
      ADMIN_SUPABASE.from("user_opportunity_feed")
        .select("opportunity_id, is_dismissed, is_applied")
        .eq("user_id", user.id),
    ]);

    const interestModel = interestModelRes.data;
    const dismissedIds = new Set(
      (seenFeedRes.data || []).filter((f: any) => f.is_dismissed).map((f: any) => f.opportunity_id)
    );
    const appliedIds = new Set(
      (seenFeedRes.data || []).filter((f: any) => f.is_applied).map((f: any) => f.opportunity_id)
    );

    // Exclude dismissed, then rank with the shared interest/intent scorer.
    const feedOpps = opportunities.filter((opp: any) => !dismissedIds.has(opp.id));
    const scored = scoreOpportunities(feedOpps, {
      profile,
      interestModel,
      appliedIds,
    });

    const { data: activeAds } = await (supabase as any)
      .from("feed_ads")
      .select("*")
      .eq("status", "active")
      .order("priority", { ascending: true });

    let adIndex = 0;
    const adFrequency = 7;
    const injected: any[] = [];
    for (let i = 0; i < scored.length; i++) {
      injected.push(scored[i]);
      if ((i + 1) % adFrequency === 0 && activeAds && adIndex < activeAds.length) {
        const ad = activeAds[adIndex % activeAds.length];
        injected.push({
          id: `ad-${ad.id}`,
          title: ad.headline,
          organisation: ad.advertiser_name || "Sponsored",
          description: ad.body || "",
          type: "ad",
          is_ad: true,
          ad_data: ad,
          location_country: "",
          application_url: ad.cta_url,
          is_active: true,
          is_featured: false,
          created_at: new Date().toISOString(),
          cover_image_url: ad.cover_image_url || null,
          media_type: ad.cover_image_url ? "image" : "none",
          cta_label: ad.cta_label,
        });
        adIndex++;
      }
    }

    const feedRecords = injected.map((opp: any) => ({
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
      feed: injected,
      userReferrals: referralCount ?? 0,
      userTier,
      segmentSlug,
    });
  } catch (error) {
    console.error("Feed generation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
