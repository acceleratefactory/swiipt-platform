import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AffiliateLeaderboard from "@/components/dashboard/affiliate/AffiliateLeaderboard";

export default async function LeaderboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: allStatus } = await supabase
    .from("affiliate_status")
    .select("*, users!inner(full_name, email)")
    .order("total_earned_ngn", { ascending: false })
    .limit(50);

  const { data: userStatus } = await supabase
    .from("affiliate_status")
    .select("*")
    .eq("user_id", user.id)
    .single();

  const leaders = (allStatus || []).slice(0, 10).map((s: any) => ({
    ...s,
    isCurrentUser: s.user_id === user.id,
  }));

  return (
    <div>
      <a href="/dashboard/affiliate" style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '1rem' }}>
        ← Back to affiliate hub
      </a>
      <h1 style={{ fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', fontSize: '1.375rem', fontWeight: 800, color: 'var(--midnight)', marginBottom: '1.5rem' }}>
        Affiliate Leaderboard
      </h1>
      <AffiliateLeaderboard leaders={leaders} userRank={userStatus} />
    </div>
  );
}
