import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import FloatLedgerEntry from "@/components/admin/float/FloatLedgerEntry";
import FloatLedgerHistory from "@/components/admin/float/FloatLedgerHistory";
import AUMChart from "@/components/admin/float/AUMChart";

export default async function AdminFloatPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: role } = await (supabase as any).from("user_roles").select("role").eq("user_id", user.id).single();
  if (!role || role.role !== "admin") redirect("/dashboard");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: entries } = await (supabase as any)
    .from("float_ledger")
    .select("*, creator:created_by(full_name)")
    .order("entry_date", { ascending: false })
    .limit(90);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: aum } = await (supabase as any).rpc("get_total_aum");

  const currentAUM = aum || 0;

  return (
    <div>
      <h1 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1.5rem", fontWeight: 800, color: "var(--midnight)", marginBottom: "1.5rem" }}>
        Float Ledger
      </h1>

      <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: "var(--radius-md)", padding: "1rem", marginBottom: "1.5rem", fontSize: "0.8125rem", color: "#92400E" }}>
        <strong>⚠️ Float income is bonus margin, not operating budget.</strong><br />
        Do not promise returns to users based on this figure.<br />
        The platform earns float as a by-product of locked capital.<br />
        Users earn service advantages, not financial yield.
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
        <FloatLedgerEntry currentAUM={currentAUM} />
        <AUMChart entries={entries || []} />
      </div>

      <FloatLedgerHistory entries={entries || []} />
    </div>
  );
}
