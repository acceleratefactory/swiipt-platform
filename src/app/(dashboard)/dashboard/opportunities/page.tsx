import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import OpportunityFeed from "@/components/dashboard/opportunities/OpportunityFeed";
import HideScrollbar from "@/components/dashboard/opportunities/HideScrollbar";
import { scoreOpportunities } from "@/lib/opportunity-feed-score";

interface Oppty {
  id: string;
  segment_slug: string;
  title: string;
  organisation: string;
  location_country: string;
  location_city: string | null;
  type: string;
  description: string;
  requirements: string | null;
  salary_range: string | null;
  funding_amount: string | null;
  deadline: string | null;
  application_url: string;
  is_featured: boolean;
  related_service_slug: string | null;
  related_goal_template_id: string | null;
  source_url: string | null;
  source_name: string | null;
  ai_generated: boolean;
  ai_relevance_score: number | null;
  language?: string | null;
  relevanceScore?: number;
  is_saved?: boolean;
  is_applied?: boolean;
  is_liked?: boolean;
  like_count?: number;
  created_at: string;
}

export default async function OpportunitiesPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [
    profileRes,
    userRes,
    oppRes,
    feedRes,
    interestModelRes,
    likeRes,
  ] = await Promise.all([
    supabase.from("career_profiles").select("segment_slug, desired_countries, desired_roles").eq("user_id", user.id).single(),
    supabase.from("users").select("user_tier, referral_code").eq("id", user.id).single(),
    supabase.from("opportunities").select("*").eq("is_active", true).or("language.is.null,language.in.(eng,sco,und)").neq("is_non_english", true).order("created_at", { ascending: false }),
    supabase.from("user_opportunity_feed").select("opportunity_id, relevance_score, is_saved, is_applied").eq("user_id", user.id),
    supabase.from("user_interest_model").select("*").eq("user_id", user.id).single(),
    supabase.from("opportunity_signals").select("opportunity_id").eq("user_id", user.id).eq("signal_type", "like"),
  ]);

  if (!profileRes.data) redirect("/dashboard/opportunities/onboarding");

  const segmentSlug = profileRes.data.segment_slug;
  const userTier = userRes.data?.user_tier || "free";
  const referralCode = userRes.data?.referral_code || "";
  const referralLink = referralCode
    ? `${process.env.NEXT_PUBLIC_APP_URL || "https://swiipt-platform.vercel.app"}/signup?ref=${referralCode}`
    : undefined;

  const savedMap = new Map<string, { relevance_score: number; is_saved: boolean; is_applied: boolean }>();
  for (const f of feedRes.data || []) {
    savedMap.set(f.opportunity_id, f);
  }

  // Fix 1: hydrate the current user's likes from opportunity_signals so the
  // heart survives a refresh. RLS restricts this table to the owner, so
  // like_count reflects the user's own like state (0/1), matching the toggle
  // count the like route returns. Global counts are deferred.
  const likedIds = new Set<string>(
    (likeRes.data || []).map((s: any) => s.opportunity_id)
  );

  // Fix 1: rank the FULL active pool with the shared interest/intent scorer.
  // Football is excluded inside the scorer; there is NO segment filter, so a
  // job_seeker sees scholarships/fellowships/etc. and the learned model re-ranks
  // over time. Interest matches sort first, everything else after.
  const scored = scoreOpportunities(oppRes.data || [], {
    profile: {
      segment_slug: segmentSlug,
      desired_countries: profileRes.data.desired_countries,
      desired_roles: profileRes.data.desired_roles,
    },
    interestModel: interestModelRes.data,
    appliedIds: new Set(
      (feedRes.data || [])
        .filter((f: any) => f.is_applied)
        .map((f: any) => f.opportunity_id)
    ),
  });

  const allOpportunities: Oppty[] = scored.map((opp) => ({
    ...opp,
    is_saved: savedMap.get(opp.id)?.is_saved || false,
    is_applied: savedMap.get(opp.id)?.is_applied || false,
    is_liked: likedIds.has(opp.id),
    like_count: likedIds.has(opp.id) ? 1 : 0,
  }));

  const ADMIN_SUPABASE = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data: activeAds } = await ADMIN_SUPABASE
    .from("feed_ads")
    .select("*")
    .eq("status", "active")
    .order("priority", { ascending: true });

  return (
    <div style={{ marginLeft: "-1.5rem", marginRight: "-1.5rem", marginTop: "-1.5rem", width: "calc(100% + 3rem)" }}>
      <HideScrollbar />
      <div style={{ maxWidth: 470, margin: "0 auto" }}>
        <OpportunityFeed
          allOpportunities={allOpportunities}
          activeAds={activeAds || []}
          userTier={userTier}
          referralLink={referralLink}
        />
      </div>
    </div>
  );
}
