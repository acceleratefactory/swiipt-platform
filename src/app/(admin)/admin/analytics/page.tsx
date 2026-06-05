import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AnalyticsOverview from "@/components/admin/analytics/AnalyticsOverview";
import UserGrowthChart from "@/components/admin/analytics/UserGrowthChart";
import AUMGrowthChart from "@/components/admin/analytics/AUMGrowthChart";
import GoalDistributionChart from "@/components/admin/analytics/GoalDistributionChart";
import ConversionFunnel from "@/components/admin/analytics/ConversionFunnel";
import RevenueIntelligence from "@/components/admin/analytics/RevenueIntelligence";

export default async function AdminAnalyticsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: role } = await (supabase as any).from("user_roles").select("role").eq("user_id", user.id).single();
  if (!role || (role.role !== "admin" && role.role !== "case_manager")) redirect("/dashboard");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabaseAny = supabase as any;

  const [
    totalUsersRes,
    signupsOverTimeRes,
    totalAUMRes,
    goalsByCategoryRes,
    goalsByDestRes,
    conversionRes,
    serviceFeeRes,
    penaltyRes,
    referralRes,
  ] = await Promise.all([
    supabase.from("users").select("id", { count: "exact", head: true }),

    (supabase as any).rpc("get_signups_by_day", { days_back: 30 }),

    (supabase as any).rpc("get_total_aum"),

    supabase.from("savings_goals")
      .select("goal_category")
      .eq("status", "active"),

    supabase.from("savings_goals")
      .select("destination")
      .eq("status", "active")
      .not("destination", "is", null),

    supabase.from("deposits")
      .select("user_id", { count: "exact", head: true })
      .eq("status", "confirmed"),

    supabaseAny.from("service_orders")
      .select("final_price, payment_currency")
      .eq("status", "completed"),

    supabaseAny.from("withdrawals")
      .select("penalty_amount")
      .eq("status", "completed")
      .gt("penalty_amount", 0),

    supabase.from("referrals").select("id", { count: "exact", head: true }),
  ]);

  return (
    <div>
      <h1 style={{ fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', fontSize: '1.375rem', fontWeight: 800, color: 'var(--midnight)', marginBottom: '1.5rem' }}>
        Analytics
      </h1>

      <AnalyticsOverview
        totalUsers={totalUsersRes.count || 0}
        usersWithDeposits={conversionRes.count || 0}
        totalAUM={totalAUMRes.data || 0}
        completedOrders={serviceFeeRes.data?.length || 0}
        totalServiceRevenue={serviceFeeRes.data?.reduce((sum: number, o: any) => sum + Number(o.final_price), 0) || 0}
        totalPenalties={penaltyRes.data?.reduce((sum: number, w: any) => sum + Number(w.penalty_amount), 0) || 0}
        totalReferrals={referralRes.count || 0}
      />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
        <UserGrowthChart data={signupsOverTimeRes.data || []} />
        <AUMGrowthChart />
      </div>

      <GoalDistributionChart
        byCategory={goalsByCategoryRes.data || []}
        byDestination={(goalsByDestRes.data || []).filter((g: any) => g.destination) as Array<{ destination: string }>}
      />

      <ConversionFunnel
        totalUsers={totalUsersRes.count || 0}
        usersWithGoals={0}
        usersWithDeposits={conversionRes.count || 0}
        usersWithOrders={0}
        completedOrders={serviceFeeRes.data?.length || 0}
      />

      <RevenueIntelligence
        serviceOrders={serviceFeeRes.data || []}
        penalties={penaltyRes.data || []}
      />
    </div>
  );
}
