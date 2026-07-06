import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import OpportunityFeed from "@/components/dashboard/opportunities/OpportunityFeed";

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
  relevanceScore?: number;
  is_saved?: boolean;
  is_applied?: boolean;
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
  ] = await Promise.all([
    supabase.from("career_profiles").select("segment_slug").eq("user_id", user.id).single(),
    supabase.from("users").select("user_tier, referral_code").eq("id", user.id).single(),
    supabase.from("opportunities").select("*").eq("is_active", true).order("created_at", { ascending: false }),
    supabase.from("user_opportunity_feed").select("opportunity_id, relevance_score, is_saved, is_applied").eq("user_id", user.id),
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

  const allOpportunities: Oppty[] = (oppRes.data || []).map((opp) => {
    const feed = savedMap.get(opp.id);
    return {
      ...opp,
      relevanceScore: feed?.relevance_score || opp.ai_relevance_score || undefined,
      is_saved: feed?.is_saved || false,
      is_applied: feed?.is_applied || false,
    };
  });

  const segmentOpps = allOpportunities.filter((o) => o.segment_slug === segmentSlug);

  const scoredSegment = segmentOpps.map((o) => ({
    ...o,
    relevanceScore: o.relevanceScore || 50,
  }));

  scoredSegment.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));

  return (
    <div style={{ marginLeft: "-1.5rem", marginRight: "-1.5rem", width: "calc(100% + 3rem)" }}>
      <div style={{ maxWidth: 630, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "flex-end", padding: "0.75rem" }}>
          <a
            href="/dashboard/opportunities/search"
            title="Search opportunities"
            style={{ fontSize: "1.25rem", textDecoration: "none", color: "var(--text-muted)", padding: "0.25rem", lineHeight: 1 }}
          >
            {"\uD83D\uDD0D"}
          </a>
        </div>
        <OpportunityFeed
          allOpportunities={scoredSegment}
          userTier={userTier}
          referralLink={referralLink}
        />
      </div>
    </div>
  );
}
