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

  const { data: pendingDeposits } = await adminSupabase
    .from("deposits")
    .select("*, users(full_name, email), savings_goals(goal_name, destination)")
    .eq("status", "pending")
    .not("user_confirmed_at", "is", null)
    .order("user_confirmed_at", { ascending: true });

  // Detect which pending deposits are visa-related
  const visaDepositIds = new Set<string>();
  const pendingIds = (pendingDeposits || []).map((d: any) => d.id);
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

  const { data: recentConfirmed } = await adminSupabase
    .from("deposits")
    .select("*, users(full_name, email)")
    .in("status", ["confirmed", "rejected"])
    .order("admin_confirmed_at", { ascending: false })
    .limit(50);

  console.log("pendingDeposits:", pendingDeposits?.length, "recentConfirmed:", recentConfirmed?.length);

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
