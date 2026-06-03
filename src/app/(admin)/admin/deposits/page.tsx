import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PendingDepositsTable from "@/components/admin/deposits/PendingDepositsTable";
import DepositHistoryTable from "@/components/admin/deposits/DepositHistoryTable";

export default async function AdminDepositsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: role } = await (supabase as any)
    .from("user_roles").select("role").eq("user_id", user.id).single();
  if (!role || (role.role !== "admin" && role.role !== "case_manager")) redirect("/dashboard");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabaseAny = supabase as any;

  const { data: pendingDeposits } = await supabaseAny
    .from("deposits")
    .select("*, users(full_name, email), savings_goals(goal_name, destination)")
    .eq("status", "pending")
    .not("user_confirmed_at", "is", null)
    .order("user_confirmed_at", { ascending: true });

  const { data: recentConfirmed } = await supabaseAny
    .from("deposits")
    .select("*, users(full_name, email), savings_goals(goal_name)")
    .in("status", ["confirmed", "rejected"])
    .order("admin_confirmed_at", { ascending: false })
    .limit(50);

  return (
    <div>
      <h1 style={{ fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', fontSize: '1.375rem', fontWeight: 800, color: 'var(--midnight)', marginBottom: '1.5rem' }}>
        Deposits
      </h1>
      <PendingDepositsTable initialDeposits={pendingDeposits || []} />
      <DepositHistoryTable deposits={recentConfirmed || []} />
    </div>
  );
}
