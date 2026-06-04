import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import CurrencyRatesTable from "@/components/admin/currencies/CurrencyRatesTable";

export default async function AdminCurrenciesPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: role } = await (supabase as any).from("user_roles").select("role").eq("user_id", user.id).single();
  if (!role || role.role !== "admin") redirect("/dashboard");

  const [currenciesRes, rateHistoryRes] = await Promise.all([
    supabase.from("currencies").select("*").order("code"),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from("admin_audit_log")
      .select("*, admin:admin_id(full_name)")
      .eq("target_table", "currencies")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  return (
    <div>
      <h1 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1.5rem", fontWeight: 800, color: "var(--midnight)", marginBottom: "1.5rem" }}>
        Currency Management
      </h1>

      <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: "var(--radius-md)", padding: "1rem", marginBottom: "1.5rem", fontSize: "0.8125rem", color: "#92400E" }}>
        <strong>⚠️ Exchange rates affect all price displays across the platform immediately on save.</strong><br />
        Verify rates against the CBN or a trusted FX source before updating.<br />
        NGN rate for NGN must always be 1. Do not change it.
      </div>

      <CurrencyRatesTable currencies={currenciesRes.data || []} adminId={user.id} />

      {/* Rate change history */}
      <div style={{ background: "white", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", overflow: "hidden", marginTop: "1.5rem" }}>
        <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--border)" }}>
          <h2 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1rem", fontWeight: 700, color: "var(--midnight)" }}>
            Rate Change History
          </h2>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8125rem" }}>
            <thead>
              <tr style={{ background: "var(--gray-100)" }}>
                {["Date", "Admin", "Currency", "Old rate", "New rate"].map(h => (
                  <th key={h} style={{ padding: "0.625rem 1rem", textAlign: "left", fontWeight: 600, color: "var(--text-secondary)", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {(rateHistoryRes.data || []).map((entry: any) => {
                const prev = entry.previous_value ? JSON.parse(entry.previous_value) : null;
                const next = entry.new_value ? JSON.parse(entry.new_value) : null;
                return (
                  <tr key={entry.id} style={{ borderBottom: "1px solid var(--gray-100)" }}>
                    <td style={{ padding: "0.625rem 1rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                      {new Date(entry.created_at).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td style={{ padding: "0.625rem 1rem", color: "var(--text-secondary)" }}>{entry.admin?.full_name || "—"}</td>
                    <td style={{ padding: "0.625rem 1rem", fontWeight: 600, color: "var(--midnight)" }}>{entry.target_record_id || "—"}</td>
                    <td style={{ padding: "0.625rem 1rem", color: "var(--text-muted)" }}>
                      {prev ? `₦${prev.ngn_exchange_rate}` : "—"}
                    </td>
                    <td style={{ padding: "0.625rem 1rem", color: "var(--teal)", fontWeight: 600 }}>
                      {next ? `₦${next.ngn_exchange_rate}` : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {(rateHistoryRes.data || []).length === 0 && (
          <p style={{ padding: "2rem", fontSize: "0.875rem", color: "var(--text-muted)", textAlign: "center" }}>No rate changes recorded yet.</p>
        )}
      </div>
    </div>
  );
}
