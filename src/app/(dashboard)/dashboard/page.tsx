import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import WelcomeBanner from "@/components/dashboard/home/WelcomeBanner";
import WalletCard from "@/components/dashboard/home/WalletCard";
import GoalsGrid from "@/components/dashboard/home/GoalsGrid";
import ActiveOrders from "@/components/dashboard/home/ActiveOrders";
import ExploreSection from "@/components/dashboard/home/ExploreSection";

export default async function DashboardHomePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [profileRes, walletRes, goalsRes, ordersRes, welcomeRewardRes] = await Promise.all([
    supabase.from("users").select("*").eq("id", user.id).single(),
    supabase.from("wallets").select("*").eq("user_id", user.id).single(),
    supabase.from("savings_goals").select("*").eq("user_id", user.id).eq("status", "active").order("created_at", { ascending: false }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).from("service_orders").select("*, service_packages(name, category, destination)").eq("user_id", user.id).not("status", "in", '("completed","cancelled")').order("created_at", { ascending: false }).limit(3),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).from("milestone_rewards").select("*").eq("user_id", user.id).eq("milestone_type", "welcome_gift").eq("redeemed", false).single(),
  ]);

  if (!profileRes.data) redirect("/onboarding");
  const profile = profileRes.data;
  const wallet = walletRes.data as unknown as { balance_ngn: number; total_locked_ngn: number; total_credits_ngn: number } | null;
  const goals = goalsRes.data || [];
  const activeOrders = (ordersRes.data || []) as unknown as Array<{ id: string; status: string; service_packages: { name: string; category: string; destination: string } | null }>;
  const welcomeReward = welcomeRewardRes.data as unknown as { id: string } | null;

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
      {welcomeReward && (
        <WelcomeBanner reward={welcomeReward} userId={user.id} />
      )}

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
