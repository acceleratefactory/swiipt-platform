import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import WithdrawalRequestsTable from "@/components/admin/withdrawals/WithdrawalRequestsTable";

export default async function AdminWithdrawalsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: role } = await (supabase as any)
    .from("user_roles").select("role").eq("user_id", user.id).single();
  if (!role || role.role !== "admin") redirect("/dashboard");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabaseAny = supabase as any;

  const { data: withdrawals } = await supabaseAny
    .from("withdrawals")
    .select("*, users(full_name, email), savings_goals(goal_name, currency)")
    .eq("status", "requested")
    .order("requested_at", { ascending: true });

  const { data: recentProcessed } = await supabaseAny
    .from("withdrawals")
    .select("*, users(full_name, email)")
    .in("status", ["completed", "rejected"])
    .order("processed_at", { ascending: false })
    .limit(20);

  return (
    <div>
      <h1 style={{ fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', fontSize: '1.375rem', fontWeight: 800, color: 'var(--midnight)', marginBottom: '1.5rem' }}>
        Withdrawals
      </h1>
      <WithdrawalRequestsTable
        pendingWithdrawals={withdrawals || []}
        recentProcessed={recentProcessed || []}
      />
    </div>
  );
}
