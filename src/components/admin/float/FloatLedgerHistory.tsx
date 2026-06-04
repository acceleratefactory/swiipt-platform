"use client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function FloatLedgerHistory({ entries }: { entries: any[] }) {
  if (entries.length === 0) {
    return (
      <div style={{ background: "white", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", padding: "2rem", textAlign: "center", fontSize: "0.875rem", color: "var(--text-muted)" }}>
        No ledger entries yet.
      </div>
    );
  }

  return (
    <div style={{ background: "white", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", overflow: "hidden" }}>
      <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--border)" }}>
        <h2 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1rem", fontWeight: 700, color: "var(--midnight)" }}>
          Entry History
        </h2>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8125rem" }}>
          <thead>
            <tr style={{ background: "var(--gray-100)" }}>
              {["Date", "AUM (NGN)", "T-bill allocation", "Rate", "Projected income", "Notes", "Entered by"].map(h => (
                <th key={h} style={{ padding: "0.625rem 1rem", textAlign: "left", fontWeight: 600, color: "var(--text-secondary)", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {entries.map((e: any) => (
              <tr key={e.id} style={{ borderBottom: "1px solid var(--gray-100)" }}>
                <td style={{ padding: "0.625rem 1rem", color: "var(--text-muted)", whiteSpace: "nowrap", fontSize: "0.75rem" }}>
                  {new Date(e.entry_date).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                </td>
                <td style={{ padding: "0.625rem 1rem", fontFamily: "monospace", fontWeight: 700, color: "var(--midnight)" }}>
                  ₦{e.total_locked_ngn.toLocaleString()}
                </td>
                <td style={{ padding: "0.625rem 1rem", fontFamily: "monospace", color: "var(--text-secondary)" }}>
                  {e.tbill_allocation ? `₦${e.tbill_allocation.toLocaleString()}` : "—"}
                </td>
                <td style={{ padding: "0.625rem 1rem", color: "var(--text-muted)" }}>
                  {e.tbill_rate_pa ? `${e.tbill_rate_pa}%` : "—"}
                </td>
                <td style={{ padding: "0.625rem 1rem", fontFamily: "monospace", color: "#6D28D9" }}>
                  {e.projected_annual_income ? `₦${e.projected_annual_income.toLocaleString()}` : "—"}
                </td>
                <td style={{ padding: "0.625rem 1rem", color: "var(--text-muted)", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {e.notes || "—"}
                </td>
                <td style={{ padding: "0.625rem 1rem", color: "var(--text-muted)", fontSize: "0.75rem" }}>
                  {e.creator?.full_name || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
