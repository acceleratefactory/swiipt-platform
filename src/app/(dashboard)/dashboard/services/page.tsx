import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ServiceMarketplace from "@/components/dashboard/services/ServiceMarketplace";

export default async function ServicesPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [packagesRes, profileRes, goalsRes, ordersRes] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).from("service_packages").select("*").eq("is_active", true).order("sort_order"),
    supabase.from("users").select("preferred_currency, mobility_score").eq("id", user.id).single(),
    supabase.from("savings_goals").select("id, goal_name, current_balance, currency, milestone_100_unlocked, status").eq("user_id", user.id).eq("status", "active"),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).from("service_orders").select("package_id, status").eq("user_id", user.id).not("status", "in", '("cancelled")'),
  ]);

  return (
    <ServiceMarketplace
      packages={packagesRes.data || []}
      preferredCurrency={profileRes.data?.preferred_currency || "NGN"}
      mobilityScore={profileRes.data?.mobility_score || 0}
      activeGoals={goalsRes.data || []}
      existingOrders={ordersRes.data || []}
      userId={user.id}
    />
  );
}
