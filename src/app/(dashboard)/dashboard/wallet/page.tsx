import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import WalletSummary from "@/components/dashboard/wallet/WalletSummary";
import TransactionTable from "@/components/dashboard/wallet/TransactionTable";
import ExportButton from "@/components/dashboard/wallet/ExportButton";

export default async function WalletPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [walletRes, depositsRes, withdrawalsRes, giftsRes, holidayBookingsRes, serviceOrdersRes, certsRes, profileRes] = await Promise.all([
    supabase.from("wallets").select("*").eq("user_id", user.id).single(),
    supabase.from("deposits")
      .select("*, savings_goals(goal_name, currency)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from("withdrawals")
      .select("*, savings_goals(goal_name, currency)")
      .eq("user_id", user.id)
      .order("requested_at", { ascending: false }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from("goal_gifts")
      .select("*, giver:giver_id(full_name), recipient:recipient_id(full_name), giver_goal:giver_goal_id(goal_name), recipient_goal:recipient_goal_id(goal_name)")
      .or(`giver_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .order("created_at", { ascending: false }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from("holiday_bookings")
      .select("*, holiday_packages(title)")
      .eq("user_id", user.id)
      .in("status", ["payment_confirmed", "completed"])
      .order("created_at", { ascending: false }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from("service_orders")
      .select("*, service_packages(name)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from("platform_certificates")
      .select("fee_deposit_id")
      .eq("user_id", user.id)
      .not("fee_deposit_id", "is", null),
    supabase.from("users").select("preferred_currency, full_name").eq("id", user.id).single(),
  ]);

  const feeDepositIds = new Set((certsRes.data || []).map((c: { fee_deposit_id: string }) => c.fee_deposit_id));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const transactions: any[] = [
    ...(depositsRes.data || []).map(d => ({
      id: d.id,
      type: (feeDepositIds.has(d.id) ? "certificate_fee" : "deposit") as "deposit" | "certificate_fee",
      amount: d.amount,
      currency: d.currency,
      ngn_equivalent: d.ngn_equivalent || d.amount,
      status: d.status,
      date: d.created_at,
      reference: d.payment_reference,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      goal_name: (d as any).savings_goals?.goal_name || "Free wallet",
      confirmed_at: d.admin_confirmed_at,
    })),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...(withdrawalsRes.data || []).map((w: any) => ({
      id: w.id,
      type: "withdrawal" as const,
      amount: w.net_amount,
      currency: w.currency,
      ngn_equivalent: w.net_amount,
      status: w.status,
      date: w.requested_at,
      reference: null as string | null,
      goal_name: w.savings_goals?.goal_name || "—",
      penalty_amount: w.penalty_amount,
      is_early_exit: w.is_early_exit,
      confirmed_at: w.processed_at,
    })),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...(giftsRes.data || []).map((g: any) => ({
      id: g.id,
      type: (g.giver_id === user.id ? "gift_sent" : "gift_received") as "gift_sent" | "gift_received",
      amount: g.amount,
      currency: g.currency,
      ngn_equivalent: g.ngn_equivalent || g.amount,
      status: "completed" as const,
      date: g.created_at,
      reference: null as string | null,
      goal_name: g.giver_id === user.id
        ? g.giver_goal?.goal_name || "—"
        : g.recipient_goal?.goal_name || "—",
      counterpart_name: g.giver_id === user.id
        ? g.recipient?.full_name
        : g.giver?.full_name,
      confirmed_at: g.created_at,
    })),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...(holidayBookingsRes.data || []).map((b: any) => ({
      id: b.id,
      type: "holiday_booking" as const,
      amount: b.total_price,
      currency: b.currency,
      ngn_equivalent: b.total_price,
      status: b.status,
      date: b.created_at,
      reference: b.reference || null,
      goal_name: b.holiday_packages?.title || "Holiday booking",
      confirmed_at: b.updated_at,
    })),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...(serviceOrdersRes.data || []).map((o: any) => ({
      id: o.id,
      type: "service_payment" as const,
      amount: o.final_price,
      currency: o.payment_currency || "NGN",
      ngn_equivalent: o.ngn_equivalent,
      status: o.status,
      date: o.created_at,
      reference: null as string | null,
      goal_name: o.service_packages?.name || "Service payment",
      confirmed_at: o.updated_at || o.created_at,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalDeposited = (depositsRes.data || [])
    .filter(d => d.status === "confirmed")
    .reduce((sum, d) => sum + (d.ngn_equivalent || d.amount), 0);

  const totalWithdrawn = (withdrawalsRes.data || [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((w: any) => w.status === "completed")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .reduce((sum: number, w: any) => sum + w.net_amount, 0);

  const totalPenalties = (withdrawalsRes.data || [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((w: any) => w.status === "completed" && w.is_early_exit)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .reduce((sum: number, w: any) => sum + (w.penalty_amount || 0), 0);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h1 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1.5rem", fontWeight: 800, color: "var(--midnight)" }}>
          Wallet
        </h1>
        <ExportButton transactions={transactions} userName={profileRes.data?.full_name || "User"} />
      </div>

      <WalletSummary
        wallet={walletRes.data}
        totalDeposited={totalDeposited}
        totalWithdrawn={totalWithdrawn}
        totalPenalties={totalPenalties}
        preferredCurrency={profileRes.data?.preferred_currency || "NGN"}
      />

      <TransactionTable transactions={transactions} userId={user.id} />
    </div>
  );
}
