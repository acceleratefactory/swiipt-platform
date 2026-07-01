import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import WelcomeBanner from "@/components/dashboard/home/WelcomeBanner";
import WalletCard from "@/components/dashboard/home/WalletCard";
import GoalsGrid from "@/components/dashboard/home/GoalsGrid";
import ActiveOrders from "@/components/dashboard/home/ActiveOrders";
import ExploreSection from "@/components/dashboard/home/ExploreSection";
import OpportunityScore from "@/components/dashboard/home/OpportunityScore";

export default async function DashboardHomePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [profileRes, walletRes, goalsRes, ordersRes, welcomeRewardRes, readinessRes] = await Promise.all([
    supabase.from("users").select("*").eq("id", user.id).single(),
    supabase.from("wallets").select("*").eq("user_id", user.id).single(),
    supabase.from("savings_goals").select("*").eq("user_id", user.id).eq("status", "active").order("created_at", { ascending: false }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).from("service_orders").select("*, service_packages(id, name, category, destination)").eq("user_id", user.id).not("status", "in", '("completed","cancelled")').order("created_at", { ascending: false }).limit(3),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).from("milestone_rewards").select("*").eq("user_id", user.id).eq("milestone_type", "welcome_gift").eq("redeemed", false).single(),
    supabase.from("users").select("readiness_score, readiness_destination, readiness_last_calculated").eq("id", user.id).single(),
  ]);

  if (!profileRes.data) redirect("/onboarding");
  const profile = profileRes.data;
  const wallet = walletRes.data as unknown as { balance_ngn: number; total_locked_ngn: number; total_credits_ngn: number } | null;
  const goals = goalsRes.data || [];
  const activeOrders = (ordersRes.data || []) as unknown as Array<{ id: string; status: string; service_packages: { id: string; name: string; category: string; destination: string } | null }>;
  const welcomeReward = welcomeRewardRes.data as unknown as { id: string } | null;

  const readinessProfile = readinessRes.data as unknown as {
    readiness_score: number | null;
    readiness_destination: string | null;
    readiness_last_calculated: string | null;
  } | null;

  let readinessScore = readinessProfile?.readiness_score || 0;
  const needsRecalculation = !readinessProfile?.readiness_last_calculated ||
    new Date(readinessProfile.readiness_last_calculated) < new Date(Date.now() - 24 * 60 * 60 * 1000);

  if (needsRecalculation) {
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const recalcRes = await fetch(`${appUrl}/api/readiness/recalculate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const recalcData = await recalcRes.json();
      if (recalcData.score !== undefined) readinessScore = recalcData.score;
    } catch {
      // Silently fail — score from DB is better than nothing
    }
  }

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
      {welcomeReward && (
        <WelcomeBanner reward={welcomeReward} userId={user.id} />
      )}

      <OpportunityScore
        score={readinessScore}
        destination={readinessProfile?.readiness_destination || null}
        userId={user.id}
      />

      <WalletCard
        wallet={wallet}
        profile={profile}
        goalCount={goals.length}
      />

      <GoalsGrid goals={goals} userId={user.id} />

      {activeOrders.length > 0 && (
        <ActiveOrders orders={activeOrders} />
      )}

      <ExploreSection goals={goals} />
    </div>
  );
}
