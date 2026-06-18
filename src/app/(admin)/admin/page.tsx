import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import MetricsCards from "@/components/admin/overview/MetricsCards";
import RecentActivityFeed from "@/components/admin/overview/RecentActivityFeed";

export default async function AdminOverviewPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: role } = await (supabase as any)
    .from("user_roles").select("role").eq("user_id", user.id).single();
  if (!role || (role.role !== "admin" && role.role !== "case_manager")) redirect("/dashboard");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabaseAny = supabase as any;

  const [
    { count: totalUsers },
    { count: pendingDeposits },
    { count: pendingVisaConfirmations },
    { count: activeGoals },
    { count: activeOrders },
    { count: pendingWithdrawals },
    { count: pendingDocuments },
    { data: recentDeposits },
    { data: recentSignups },
  ] = await Promise.all([
    supabase.from("users").select("*", { count: "exact", head: true }),
    supabase.from("deposits").select("*", { count: "exact", head: true })
      .eq("status", "pending").not("user_confirmed_at", "is", null),
    supabaseAny.from("visa_redemptions").select("*", { count: "exact", head: true })
      .eq("status", "pending_payment"),
    supabase.from("savings_goals").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabaseAny.from("service_orders").select("*", { count: "exact", head: true })
      .not("status", "in", '("completed","cancelled")'),
    supabaseAny.from("withdrawals").select("*", { count: "exact", head: true }).eq("status", "requested"),
    supabaseAny.from("document_requests").select("*", { count: "exact", head: true }).eq("status", "uploaded"),
    supabaseAny.from("deposits").select("*, users(full_name, email)")
      .eq("status", "pending").not("user_confirmed_at", "is", null)
      .order("user_confirmed_at", { ascending: false }).limit(5),
    supabase.from("users").select("id, full_name, email, created_at")
      .order("created_at", { ascending: false }).limit(5),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: aum } = await (supabase as any).rpc("get_total_aum");

  return (
    <div>
      <h1 style={{ fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', fontSize: '1.375rem', fontWeight: 800, color: 'var(--midnight)', marginBottom: '1.5rem' }}>
        Overview
      </h1>

      <MetricsCards
        totalUsers={totalUsers || 0}
        pendingDeposits={pendingDeposits || 0}
        pendingVisaConfirmations={pendingVisaConfirmations || 0}
        activeGoals={activeGoals || 0}
        activeOrders={activeOrders || 0}
        pendingWithdrawals={pendingWithdrawals || 0}
        pendingDocuments={pendingDocuments || 0}
        totalAUM={aum || 0}
      />

      <RecentActivityFeed
        recentDeposits={recentDeposits || []}
        recentSignups={recentSignups || []}
      />
    </div>
  );
}
