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
    .select("*, users(full_name, email)")
    .eq("status", "pending")
    .not("user_confirmed_at", "is", null)
    .order("user_confirmed_at", { ascending: true });

  // Fetch goal names separately to avoid RLS join issue with savings_goals
  if (pendingDeposits && pendingDeposits.length > 0) {
    const goalIds = pendingDeposits
      .map((d: any) => d.goal_id)
      .filter((id: any) => id !== null);
    if (goalIds.length > 0) {
      const { data: goals } = await supabaseAny
        .from("savings_goals")
        .select("id, goal_name, destination")
        .in("id", goalIds);
      const goalMap = new Map((goals || []).map((g: any) => [g.id, g]));
      pendingDeposits.forEach((d: any) => {
        d.savings_goals = d.goal_id ? (goalMap.get(d.goal_id) || null) : null;
      });
    }
  }

  // Detect which pending deposits are visa-related
  const visaDepositIds = new Set<string>();
  const pendingIds = (pendingDeposits || []).map((d: any) => d.id);
  if (pendingIds.length > 0) {
    const { data: visaLinks } = await supabaseAny
      .from("visa_redemptions")
      .select("deposit_id, booking_fee_deposit_id")
      .or(`deposit_id.in.(${pendingIds.join(",")}),booking_fee_deposit_id.in.(${pendingIds.join(",")})`);
    (visaLinks || []).forEach((v: any) => {
      if (v.deposit_id) visaDepositIds.add(v.deposit_id);
      if (v.booking_fee_deposit_id) visaDepositIds.add(v.booking_fee_deposit_id);
    });
  }

  const { data: recentConfirmed } = await supabaseAny
    .from("deposits")
    .select("*, users(full_name, email)")
    .in("status", ["confirmed", "rejected"])
    .order("admin_confirmed_at", { ascending: false })
    .limit(50);

  if (recentConfirmed && recentConfirmed.length > 0) {
    const goalIds = recentConfirmed
      .map((d: any) => d.goal_id)
      .filter((id: any) => id !== null);
    if (goalIds.length > 0) {
      const { data: goals } = await supabaseAny
        .from("savings_goals")
        .select("id, goal_name")
        .in("id", goalIds);
      const goalMap = new Map((goals || []).map((g: any) => [g.id, g]));
      recentConfirmed.forEach((d: any) => {
        d.savings_goals = d.goal_id ? (goalMap.get(d.goal_id) || null) : null;
      });
    }
  }

  return (
    <div>
      <h1 style={{ fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', fontSize: '1.375rem', fontWeight: 800, color: 'var(--midnight)', marginBottom: '1.5rem' }}>
        Deposits
      </h1>
      <PendingDepositsTable initialDeposits={pendingDeposits || []} visaDepositIds={visaDepositIds} />
      <DepositHistoryTable deposits={recentConfirmed || []} />
    </div>
  );
}
