"use client";
import { useState } from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function TransactionTable({ transactions, userId: _userId }: { transactions: any[]; userId: string }) {
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = transactions
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((t: any) => typeFilter === "all" || t.type === typeFilter)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((t: any) => statusFilter === "all" || t.status === statusFilter);

  const typeIcons: Record<string, string> = {
    deposit: "↓",
    withdrawal: "↑",
    gift_sent: "🎁",
    gift_received: "🎁",
  };

  const typeColors: Record<string, string> = {
    deposit: "var(--teal)",
    withdrawal: "var(--danger)",
    gift_sent: "#1D4ED8",
    gift_received: "#6D28D9",
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const statusStyles: Record<string, any> = {
    confirmed: { label: "Confirmed", color: "var(--teal)", bg: "var(--teal-pale)" },
    pending: { label: "Pending", color: "#B45309", bg: "#FEF3C7" },
    rejected: { label: "Rejected", color: "var(--danger)", bg: "#FEF2F2" },
    completed: { label: "Completed", color: "var(--teal)", bg: "var(--teal-pale)" },
    requested: { label: "Requested", color: "#B45309", bg: "#FEF3C7" },
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function rowBg(t: any): string {
    if (t.status === "pending" || t.status === "requested") return "#FFFBEB";
    if (t.type === "gift_received") return "#F5F3FF";
    if (t.type === "gift_sent") return "#EFF6FF";
    return "white";
  }

  return (
    <div style={{ background: "white", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", overflow: "hidden" }}>
      {/* Filters */}
      <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--border)", display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600, marginRight: "0.25rem" }}>Type:</span>
          {["all", "deposit", "withdrawal", "gift_sent", "gift_received"].map(t => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              style={{
                padding: "0.25rem 0.625rem",
                borderRadius: "20px",
                border: typeFilter === t ? "2px solid var(--teal)" : "1px solid var(--border)",
                background: typeFilter === t ? "var(--teal-pale)" : "white",
                color: typeFilter === t ? "var(--teal)" : "var(--text-secondary)",
                fontSize: "0.75rem",
                fontWeight: typeFilter === t ? 600 : 400,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {t === "all" ? "All" : t === "gift_sent" ? "Gifts Sent" : t === "gift_received" ? "Gifts Received" : t.charAt(0).toUpperCase() + t.slice(1) + "s"}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600, marginRight: "0.25rem" }}>Status:</span>
          {["all", "confirmed", "pending", "completed", "rejected"].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              style={{
                padding: "0.25rem 0.625rem",
                borderRadius: "20px",
                border: statusFilter === s ? "2px solid var(--teal)" : "1px solid var(--border)",
                background: statusFilter === s ? "var(--teal-pale)" : "white",
                color: statusFilter === s ? "var(--teal)" : "var(--text-secondary)",
                fontSize: "0.75rem",
                fontWeight: statusFilter === s ? 600 : 400,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Desktop table */}
      <div className="desktop-only" style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8125rem" }}>
          <thead>
            <tr style={{ background: "var(--gray-100)" }}>
              {["Date", "Type", "Goal", "Amount", "Currency", "NGN Equiv", "Reference", "Status", "Confirmed at"].map(h => (
                <th key={h} style={{ padding: "0.625rem 1rem", textAlign: "left", fontWeight: 600, color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {filtered.map((t: any) => {
              const st = statusStyles[t.status] || { label: t.status, color: "var(--text-muted)", bg: "var(--gray-100)" };
              return (
                <tr key={t.id} style={{ borderBottom: "1px solid var(--gray-100)", background: rowBg(t) }}>
                  <td style={{ padding: "0.625rem 1rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                    {new Date(t.date).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td style={{ padding: "0.625rem 1rem" }}>
                    <span style={{ color: typeColors[t.type] || "var(--text-muted)", fontWeight: 600 }}>
                      {typeIcons[t.type] || ""} {t.type === "gift_sent" ? "Gift sent" : t.type === "gift_received" ? "Gift received" : t.type.charAt(0).toUpperCase() + t.type.slice(1)}
                    </span>
                  </td>
                  <td style={{ padding: "0.625rem 1rem", color: "var(--text-secondary)", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {t.goal_name}
                  </td>
                  <td style={{ padding: "0.625rem 1rem", fontWeight: 700, color: "var(--midnight)", whiteSpace: "nowrap" }}>
                    {t.type === "deposit" || t.type === "gift_received" ? "+" : "-"}{t.amount.toLocaleString()}
                  </td>
                  <td style={{ padding: "0.625rem 1rem", color: "var(--text-muted)" }}>{t.currency}</td>
                  <td style={{ padding: "0.625rem 1rem", color: "var(--text-muted)", fontFamily: "monospace", fontSize: "0.75rem" }}>
                    ₦{t.ngn_equivalent.toLocaleString()}
                  </td>
                  <td style={{ padding: "0.625rem 1rem", fontFamily: "monospace", fontSize: "0.75rem", color: "var(--teal)" }}>
                    {t.reference || "—"}
                  </td>
                  <td style={{ padding: "0.625rem 1rem" }}>
                    <span style={{ fontSize: "0.65rem", fontWeight: 700, padding: "2px 6px", borderRadius: "20px", background: st.bg, color: st.color }}>
                      {st.label}
                    </span>
                  </td>
                  <td style={{ padding: "0.625rem 1rem", color: "var(--text-muted)", fontSize: "0.75rem", whiteSpace: "nowrap" }}>
                    {t.confirmed_at ? new Date(t.confirmed_at).toLocaleDateString("en-NG", { day: "numeric", month: "short" }) : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile card view */}
      <div className="mobile-only">
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {filtered.map((t: any) => {
          const st = statusStyles[t.status] || { label: t.status, color: "var(--text-muted)", bg: "var(--gray-100)" };
          return (
            <div key={t.id} style={{ padding: "0.875rem 1.25rem", borderBottom: "1px solid var(--gray-100)", background: rowBg(t) }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.375rem" }}>
                <span style={{ color: typeColors[t.type] || "var(--text-muted)", fontWeight: 600, fontSize: "0.8125rem" }}>
                  {typeIcons[t.type] || ""} {t.type === "gift_sent" ? "Gift sent" : t.type === "gift_received" ? "Gift received" : t.type.charAt(0).toUpperCase() + t.type.slice(1)}
                </span>
                <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                  {new Date(t.date).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{t.goal_name}</p>
                  <p style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                    {t.reference || ""} {t.currency}
                  </p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--midnight)" }}>
                    {t.type === "deposit" || t.type === "gift_received" ? "+" : "-"}{t.amount.toLocaleString()}
                  </p>
                  <span style={{ fontSize: "0.65rem", fontWeight: 700, padding: "2px 6px", borderRadius: "20px", background: st.bg, color: st.color }}>
                    {st.label}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <p style={{ padding: "2rem", fontSize: "0.875rem", color: "var(--text-muted)", textAlign: "center" }}>
          No transactions match your filters.
        </p>
      )}
    </div>
  );
}
