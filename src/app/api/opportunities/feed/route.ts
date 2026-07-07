import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

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
        .eq("is_active", true);

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

    let { data: opportunities } = await supabase
      .from("opportunities")
      .select("*")
      .eq("is_active", true)
      .eq("segment_slug", segmentSlug || "__none__");

    if (!opportunities) opportunities = [];

    if (segmentSlug && opportunities.length < 5) {
      const { data: trending } = await supabase
        .from("opportunities")
        .select("*")
        .eq("is_active", true)
        .neq("segment_slug", segmentSlug)
        .order("apply_click_count", { ascending: false })
        .order("published_at", { ascending: false })
        .limit(30);

      if (trending) {
        const existingIds = new Set(opportunities.map((o: any) => o.id));
        for (const t of trending) {
          if (!existingIds.has(t.id)) opportunities.push(t);
        }
      }
    }

    if (!segmentSlug && opportunities.length === 0) {
      const { data: trending } = await supabase
        .from("opportunities")
        .select("*")
        .eq("is_active", true)
        .order("is_featured", { ascending: false })
        .order("apply_click_count", { ascending: false })
        .limit(30);

      if (trending) opportunities = trending;
    }

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

    const eligible = opportunities.filter((opp: any) => !dismissedIds.has(opp.id));

    const scored = eligible.map((opp: any) => {
      let score = 50;

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
            opp.title.toLowerCase().includes(r.toLowerCase()) ||
            opp.description.toLowerCase().includes(r.toLowerCase())
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

      if (appliedIds.has(opp.id)) score -= 40;

      if (!interestModel) {
        score += Math.min(15, Math.round((opp.apply_click_count || 0) * 0.5));
        score += Math.min(10, Math.round((opp.view_count || 0) * 0.1));
      }

      return { ...opp, relevanceScore: Math.max(0, Math.min(100, score)) };
    });

    scored.sort((a: any, b: any) => b.relevanceScore - a.relevanceScore);

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
