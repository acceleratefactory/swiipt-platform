import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import RewardsList from "@/components/dashboard/rewards/RewardsList";
import MilestoneProgress from "@/components/dashboard/rewards/MilestoneProgress";
import StreakTracker from "@/components/dashboard/rewards/StreakTracker";
import Leaderboard from "@/components/dashboard/rewards/Leaderboard";
import MobilityScoreCard from "@/components/dashboard/rewards/MobilityScoreCard";
import WinWithSwiipt from "@/components/dashboard/rewards/WinWithSwiipt";

function calculateStreakWeeks(depositDates: string[], targetWeeks: number): number {
  const weeks = new Set<string>();
  depositDates.forEach(date => {
    const d = new Date(date);
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - d.getDay());
    weeks.add(weekStart.toISOString().split("T")[0]);
  });
  return Math.min(weeks.size, targetWeeks);
}

export default async function RewardsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const periodKey = await (supabase as any).rpc("get_current_period_key");

  const [
    profileRes,
    rewardsRes,
    goalsRes,
    depositsRes,
    leaderboardRes,
    prizesRes,
    userEntryRes,
  ] = await Promise.all([
    supabase.from("users").select("full_name, mobility_score, alumni_status").eq("id", user.id).single(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).from("milestone_rewards").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("savings_goals").select("*").eq("user_id", user.id).eq("status", "active"),
    supabase.from("deposits").select("admin_confirmed_at").eq("user_id", user.id).eq("status", "confirmed").gte("admin_confirmed_at", new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).from("leaderboard_entries").select("*, users(full_name)").eq("period_key", periodKey.data).order("rank").limit(10),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).from("leaderboard_prizes").select("*").eq("is_active", true).eq("period_type", "monthly").order("rank_position"),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).from("leaderboard_entries").select("rank, referral_count").eq("user_id", user.id).eq("period_key", periodKey.data).single(),
  ]);

  const depositDates = (depositsRes.data || []).map(d => d.admin_confirmed_at).filter(Boolean) as string[];
  const streak30 = calculateStreakWeeks(depositDates, 4);
  const streak90 = calculateStreakWeeks(depositDates, 12);

  return (
    <div>
      <h1 style={{ fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', fontSize: '1.5rem', fontWeight: 800, color: 'var(--midnight)', marginBottom: '1.5rem' }}>
        Rewards
      </h1>

      <MobilityScoreCard score={profileRes.data?.mobility_score || 0} />
      <WinWithSwiipt prizes={prizesRes.data || []} />
      <RewardsList rewards={rewardsRes.data || []} userId={user.id} activeGoals={goalsRes.data || []} />
      <MilestoneProgress goals={goalsRes.data || []} />
      <StreakTracker streak30Weeks={streak30} streak90Weeks={streak90} />
      <Leaderboard entries={leaderboardRes.data || []} prizes={prizesRes.data || []} userEntry={userEntryRes.data} userId={user.id} />
    </div>
  );
}
