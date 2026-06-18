import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ServiceMarketplace from "@/components/dashboard/services/ServiceMarketplace";

export default async function ServicesPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [packagesRes, profileRes, goalsRes, ordersRes, walletRes] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).from("service_packages").select("*").eq("is_active", true).order("sort_order"),
    supabase.from("users").select("preferred_currency, mobility_score").eq("id", user.id).single(),
    supabase.from("savings_goals").select("id, goal_name, current_balance, currency, milestone_100_unlocked, status").eq("user_id", user.id).eq("status", "active"),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).from("service_orders").select("package_id, status").eq("user_id", user.id).not("status", "in", '("cancelled")'),
    supabase.from("wallets").select("total_credits_ngn").eq("user_id", user.id).maybeSingle(),
  ]);

  const walletCredits = (walletRes.data as unknown as { total_credits_ngn: number } | null)?.total_credits_ngn || 0;

  return (
    <ServiceMarketplace
      packages={packagesRes.data || []}
      preferredCurrency={profileRes.data?.preferred_currency || "NGN"}
      mobilityScore={profileRes.data?.mobility_score || 0}
      activeGoals={goalsRes.data || []}
      existingOrders={ordersRes.data || []}
      userId={user.id}
      walletCredits={walletCredits}
    />
  );
}
