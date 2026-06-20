import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import WithdrawalRequestsTable from "@/components/admin/withdrawals/WithdrawalRequestsTable";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminWithdrawalsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const adminSupabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: role } = await adminSupabase
    .from("user_roles").select("role").eq("user_id", user.id).single();
  if (!role || role.role !== "admin") redirect("/dashboard");

  const { data: _pending } = await adminSupabase
    .from("withdrawals")
    .select("*")
    .eq("status", "requested")
    .order("requested_at", { ascending: true });

  const { data: _processed } = await adminSupabase
    .from("withdrawals")
    .select("*")
    .in("status", ["completed", "rejected"])
    .order("processed_at", { ascending: false })
    .limit(20);

  const allUserIds = Array.from(new Set([
    ...(_pending || []).map((w: any) => w.user_id),
    ...(_processed || []).map((w: any) => w.user_id),
  ].filter(Boolean)));

  const allGoalIds = Array.from(new Set((_pending || []).map((w: any) => w.goal_id).filter(Boolean)));

  const [{ data: users }, { data: goals }] = await Promise.all([
    allUserIds.length ? adminSupabase.from("users").select("id, full_name, email").in("id", allUserIds) : { data: [] },
    allGoalIds.length ? adminSupabase.from("savings_goals").select("id, goal_name").in("id", allGoalIds) : { data: [] },
  ]);

  const userMap = new Map((users || []).map((u: any) => [u.id, { full_name: u.full_name, email: u.email }]));
  const goalMap = new Map((goals || []).map((g: any) => [g.id, { goal_name: g.goal_name }]));

  const withdrawals = (_pending || []).map((w: any) => ({
    ...w,
    users: userMap.get(w.user_id) || null,
    savings_goals: w.goal_id ? goalMap.get(w.goal_id) || null : null,
  }));

  const recentProcessed = (_processed || []).map((w: any) => ({
    ...w,
    users: userMap.get(w.user_id) || null,
  }));

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
