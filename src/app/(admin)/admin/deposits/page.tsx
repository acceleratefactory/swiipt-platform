import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import PendingDepositsTable from "@/components/admin/deposits/PendingDepositsTable";
import DepositHistoryTable from "@/components/admin/deposits/DepositHistoryTable";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminDepositsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const adminSupabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: role } = await adminSupabase
    .from("user_roles").select("role").eq("user_id", user.id).single();
  if (!role || (role.role !== "admin" && role.role !== "case_manager")) redirect("/dashboard");

  const { data: _pending } = await adminSupabase
    .from("deposits")
    .select("*")
    .eq("status", "pending")
    .not("user_confirmed_at", "is", null)
    .order("user_confirmed_at", { ascending: true });

  const { data: _confirmed } = await adminSupabase
    .from("deposits")
    .select("*")
    .in("status", ["confirmed", "rejected"])
    .order("admin_confirmed_at", { ascending: false })
    .limit(50);

  const allUserIds = Array.from(new Set([
    ...(_pending || []).map((d: any) => d.user_id),
    ...(_confirmed || []).map((d: any) => d.user_id),
  ].filter(Boolean)));

  const allGoalIds = Array.from(new Set((_pending || []).map((d: any) => d.goal_id).filter(Boolean)));

  const [{ data: users }, { data: goals }] = await Promise.all([
    allUserIds.length ? adminSupabase.from("users").select("id, full_name, email").in("id", allUserIds) : { data: [] },
    allGoalIds.length ? adminSupabase.from("savings_goals").select("id, goal_name, destination").in("id", allGoalIds) : { data: [] },
  ]);

  const userMap = new Map((users || []).map((u: any) => [u.id, { full_name: u.full_name, email: u.email }]));
  const goalMap = new Map((goals || []).map((g: any) => [g.id, { goal_name: g.goal_name, destination: g.destination }]));

  const pendingDeposits = (_pending || []).map((d: any) => ({
    ...d,
    users: userMap.get(d.user_id) || null,
    savings_goals: d.goal_id ? goalMap.get(d.goal_id) || null : null,
  }));

  const recentConfirmed = (_confirmed || []).map((d: any) => ({
    ...d,
    users: userMap.get(d.user_id) || null,
  }));

  // Detect which pending deposits are visa-related
  const visaDepositIds = new Set<string>();
  const pendingIds = pendingDeposits.map((d: any) => d.id);
  if (pendingIds.length > 0) {
    const { data: visaLinks } = await adminSupabase
      .from("visa_redemptions")
      .select("deposit_id, booking_fee_deposit_id")
      .or(`deposit_id.in.(${pendingIds.join(",")}),booking_fee_deposit_id.in.(${pendingIds.join(",")})`);
    (visaLinks || []).forEach((v: any) => {
      if (v.deposit_id) visaDepositIds.add(v.deposit_id);
      if (v.booking_fee_deposit_id) visaDepositIds.add(v.booking_fee_deposit_id);
    });
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
