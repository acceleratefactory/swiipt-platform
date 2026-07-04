"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

/* eslint-disable @typescript-eslint/no-explicit-any */
const TIERS = ["starter", "bronze", "silver", "gold", "platinum"];

const TIER_COLORS: Record<string, string> = {
  starter: "var(--text-muted)",
  bronze: "#CD7F32",
  silver: "#C0C0C0",
  gold: "#FFD700",
  platinum: "#E5E4E2",
};

const TIER_BG: Record<string, string> = {
  starter: "var(--gray-100)",
  bronze: "#CD7F3215",
  silver: "#C0C0C015",
  gold: "#FFD70015",
  platinum: "#E5E4E215",
};

function formatNgn(amount: number | string | null | undefined) {
  const n = Number(amount) || 0;
  return `₦${n.toLocaleString()}`;
}

export default function AffiliatesList({
  affiliates,
  totalCount,
  tierBreakdown,
  totalPendingEarnings,
  totalWithdrawn,
}: {
  affiliates: any[];
  totalCount: number;
  tierBreakdown: Record<string, number>;
  totalPendingEarnings: number;
  totalWithdrawn: number;
}) {
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState("all");

  const filtered = useMemo(() => {
    return affiliates.filter((a: any) => {
      const name = a.users?.full_name?.toLowerCase() || "";
      const email = a.users?.email?.toLowerCase() || "";
      const code = (a.custom_affiliate_code || "").toLowerCase();
      const q = search.toLowerCase();
      const matchesSearch = !search || name.includes(q) || email.includes(q) || code.includes(q);
      const matchesTier = tierFilter === "all" || a.tier === tierFilter;
      return matchesSearch && matchesTier;
    });
  }, [affiliates, search, tierFilter]);

  return (
    <div style={{ background: "white", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", overflow: "hidden" }}>
      {/* Stats bar */}
      <div style={{ display: "flex", gap: "1.5rem", padding: "1rem 1.25rem", borderBottom: "1px solid var(--border)", background: "var(--off-white)", flexWrap: "wrap" }}>
        <div>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Total affiliates</span>
          <p style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1.25rem", fontWeight: 800, color: "var(--midnight)" }}>{totalCount}</p>
        </div>
        <div>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Pending earnings</span>
          <p style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1.25rem", fontWeight: 800, color: "#B45309" }}>{formatNgn(totalPendingEarnings)}</p>
        </div>
        <div>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Total paid</span>
          <p style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1.25rem", fontWeight: 800, color: "var(--teal)" }}>{formatNgn(totalWithdrawn)}</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
          {TIERS.map((t) => (
            <span key={t} style={{ fontSize: "0.65rem", fontWeight: 700, padding: "2px 8px", borderRadius: "20px", background: TIER_BG[t], color: TIER_COLORS[t] }}>
              {t}: {tierBreakdown[t] || 0}
            </span>
          ))}
        </div>
      </div>

      {/* Search + filter */}
      <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--border)", display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, or affiliate code"
          style={{ flex: 1, minWidth: 200, padding: "0.5rem 0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", fontSize: "0.8125rem" }}
        />
        <select
          value={tierFilter}
          onChange={(e) => setTierFilter(e.target.value)}
          style={{ padding: "0.5rem 0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", fontSize: "0.8125rem" }}
        >
          <option value="all">All tiers</option>
          {TIERS.map((t) => (
            <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8125rem" }}>
          <thead>
            <tr style={{ background: "var(--gray-100)" }}>
              {["Name", "Email", "Tier", "Code", "Referrals", "Pending", "Total Earned", "", "Actions"].map((h) => (
                <th key={h} style={{ padding: "0.625rem 1rem", textAlign: "left", fontWeight: 600, color: "var(--text-secondary)", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((a: any) => (
              <tr key={a.user_id} style={{ borderBottom: "1px solid var(--gray-100)" }}>
                <td style={{ padding: "0.625rem 1rem", fontWeight: 600, color: "var(--midnight)" }}>{a.users?.full_name || "—"}</td>
                <td style={{ padding: "0.625rem 1rem", color: "var(--text-secondary)" }}>{a.users?.email || "—"}</td>
                <td style={{ padding: "0.625rem 1rem" }}>
                  <span style={{ fontSize: "0.65rem", fontWeight: 700, padding: "2px 8px", borderRadius: "20px", background: TIER_BG[a.tier] || "var(--gray-100)", color: TIER_COLORS[a.tier] || "var(--text-muted)" }}>
                    {a.tier || "starter"}
                  </span>
                </td>
                <td style={{ padding: "0.625rem 1rem", fontFamily: "monospace", fontSize: "0.75rem", color: "var(--teal)" }}>{a.custom_affiliate_code || "—"}</td>
                <td style={{ padding: "0.625rem 1rem" }}>
                  <span style={{ fontWeight: 700, color: "var(--midnight)" }}>{a.referralStats?.total || 0}</span>
                  {a.referralStats?.converted > 0 && (
                    <span style={{ fontSize: "0.7rem", color: "var(--teal)", marginLeft: "0.25rem" }}>
                      ({a.referralStats.converted} conv)
                    </span>
                  )}
                </td>
                <td style={{ padding: "0.625rem 1rem", fontFamily: "monospace", fontSize: "0.75rem", color: "#B45309" }}>{formatNgn(a.pending_earnings_ngn)}</td>
                <td style={{ padding: "0.625rem 1rem", fontFamily: "monospace", fontSize: "0.75rem", color: "var(--teal)" }}>{formatNgn(a.total_earned_ngn)}</td>
                <td style={{ padding: "0.625rem 1rem", color: "var(--text-muted)" }}>{a.modules_completed || 0}</td>
                <td style={{ padding: "0.625rem 1rem" }}>
                  <Link
                    href={`/admin/affiliates/${a.user_id}`}
                    style={{ padding: "0.25rem 0.625rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "white", fontSize: "0.75rem", cursor: "pointer", textDecoration: "none", color: "var(--teal)", whiteSpace: "nowrap" }}
                  >
                    View detail
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <p style={{ padding: "2rem", fontSize: "0.875rem", color: "var(--text-muted)", textAlign: "center" }}>
          {search || tierFilter !== "all" ? "No affiliates match your filters." : "No affiliates found."}
        </p>
      )}
    </div>
  );
}
/* eslint-enable @typescript-eslint/no-explicit-any */
