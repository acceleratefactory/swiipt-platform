import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ReferralHub from "@/components/dashboard/refer/ReferralHub";
import ReferralStats from "@/components/dashboard/refer/ReferralStats";
import EarningsHistory from "@/components/dashboard/refer/EarningsHistory";

export default async function ReferPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [profileRes, referralsRes, periodKey] = await Promise.all([
    supabase.from("users").select("full_name, referral_code, alumni_status").eq("id", user.id).single(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).from("referrals").select("*, referred:referred_id(full_name, created_at)").eq("referrer_id", user.id).order("created_at", { ascending: false }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).rpc("get_current_period_key"),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: userLeaderboardEntry } = await (supabase as any)
    .from("leaderboard_entries")
    .select("rank, referral_count")
    .eq("user_id", user.id)
    .eq("period_key", periodKey.data)
    .single();

  const totalReferrals = referralsRes.data?.length || 0;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pendingCommissions = referralsRes.data?.filter((r: any) => r.commission_status === "pending").reduce((sum: number, r: any) => sum + (r.commission_amount_ngn || 0), 0) || 0;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const earnedCommissions = referralsRes.data?.filter((r: any) => r.commission_status === "earned" || r.commission_status === "paid").reduce((sum: number, r: any) => sum + (r.commission_amount_ngn || 0), 0) || 0;

  return (
    <div>
      <h1 style={{ fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', fontSize: '1.5rem', fontWeight: 800, color: 'var(--midnight)', marginBottom: '1.5rem' }}>
        Refer & Earn
      </h1>
      <ReferralHub referralCode={profileRes.data?.referral_code || ""} />
      <ReferralStats totalReferrals={totalReferrals} pendingCommissions={pendingCommissions} earnedCommissions={earnedCommissions} isAlumni={profileRes.data?.alumni_status ?? false} leaderboardEntry={userLeaderboardEntry} />
      <EarningsHistory referrals={referralsRes.data || []} />
    </div>
  );
}
