"use client";

import { useState } from "react";

/* eslint-disable @typescript-eslint/no-explicit-any */

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

function formatNgn(n: number | string | null | undefined): string {
  return `₦${(Number(n) || 0).toLocaleString()}`;
}

function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  return name.split(" ").map((s) => s[0]).join("").toUpperCase().slice(0, 2);
}

export default function SubAffiliateTree({ subAffiliates }: { subAffiliates: any[] }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const totalOverrideEarnings = subAffiliates.reduce((sum, s) => {
    return sum + (Number(s.affiliate_status?.total_earned_ngn) || 0);
  }, 0);

  const totalSubs = subAffiliates.length;
  const totalConverted = subAffiliates.reduce((sum, s) => sum + (s.referralStats?.converted || 0), 0);
  const totalReferrals = subAffiliates.reduce((sum, s) => sum + (s.referralStats?.total || 0), 0);
  const avgConversion = totalReferrals > 0 ? Math.round((totalConverted / totalReferrals) * 100) : 0;

  function toggleExpand(id: string) {
    const next = new Set(expanded);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpanded(next);
  }

  if (!subAffiliates || subAffiliates.length === 0) {
    return (
      <div style={{ background: "white", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", padding: "2rem", textAlign: "center" }}>
        <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>No sub-affiliates yet.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Summary card */}
      <div style={{ background: "white", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", padding: "1.5rem", marginBottom: "1.25rem" }}>
        <h3 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "0.9375rem", fontWeight: 700, marginBottom: "0.75rem" }}>Sub-Affiliate Summary</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "0.75rem", fontSize: "0.8125rem" }}>
          <div>
            <p style={{ color: "var(--text-muted)", marginBottom: "0.125rem" }}>Total override earnings</p>
            <p style={{ fontWeight: 800, fontSize: "1rem", color: "var(--teal)" }}>{formatNgn(totalOverrideEarnings)}</p>
          </div>
          <div>
            <p style={{ color: "var(--text-muted)", marginBottom: "0.125rem" }}>Sub-affiliates</p>
            <p style={{ fontWeight: 800, fontSize: "1rem", color: "var(--midnight)" }}>{totalSubs}</p>
          </div>
          <div>
            <p style={{ color: "var(--text-muted)", marginBottom: "0.125rem" }}>Their referrals</p>
            <p style={{ fontWeight: 800, fontSize: "1rem", color: "var(--midnight)" }}>{totalReferrals}</p>
          </div>
          <div>
            <p style={{ color: "var(--text-muted)", marginBottom: "0.125rem" }}>Avg conversion rate</p>
            <p style={{ fontWeight: 800, fontSize: "1rem", color: avgConversion > 30 ? "var(--teal)" : "var(--text-muted)" }}>{avgConversion}%</p>
          </div>
        </div>
      </div>

      {/* Sub-affiliate cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {subAffiliates.map((sub: any) => {
          const isExpanded = expanded.has(sub.id);
          return (
            <div key={sub.id} style={{ background: "white", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", overflow: "hidden" }}>
              {/* Row header */}
              <button onClick={() => toggleExpand(sub.id)} style={{ width: "100%", display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.875rem 1rem", border: "none", background: "transparent", cursor: "pointer", textAlign: "left" }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--gray-100)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.75rem", color: "var(--text-muted)", flexShrink: 0 }}>
                  {getInitials(sub.full_name)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 600, fontSize: "0.8125rem", color: "var(--midnight)" }}>{sub.full_name || "Unknown"}</p>
                  <p style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{sub.email}</p>
                </div>
                <span style={{ fontSize: "0.65rem", fontWeight: 700, padding: "2px 8px", borderRadius: "20px", background: TIER_BG[sub.affiliate_status?.tier] || "var(--gray-100)", color: TIER_COLORS[sub.affiliate_status?.tier] || "var(--text-muted)" }}>
                  {sub.affiliate_status?.tier || "starter"}
                </span>
                <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                  <div>Earned: {formatNgn(sub.affiliate_status?.total_earned_ngn)}</div>
                  <div>Referred: {sub.referralStats?.total || 0}</div>
                </div>
                <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>{isExpanded ? "▲" : "▼"}</span>
              </button>

              {/* Expanded details */}
              {isExpanded && (
                <div style={{ padding: "0 1rem 0.875rem 1rem", borderTop: "1px solid var(--gray-100)" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "0.75rem", fontSize: "0.8125rem", paddingTop: "0.75rem" }}>
                    {[
                      ["Joined", sub.created_at ? new Date(sub.created_at).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" }) : "—"],
                      ["Referral code", sub.referral_code || "—"],
                      ["Total earnings", formatNgn(sub.affiliate_status?.total_earned_ngn)],
                      ["Pending", formatNgn(sub.affiliate_status?.pending_earnings_ngn)],
                      ["Withdrawn", formatNgn(sub.affiliate_status?.withdrawn_earnings_ngn)],
                      ["Referrals", String(sub.referralStats?.total || 0)],
                      ["Converted", String(sub.referralStats?.converted || 0)],
                      ["Commission rate", `${sub.affiliate_status?.commission_rate || 10}%`],
                    ].map(([label, value]) => (
                      <div key={String(label)}>
                        <p style={{ color: "var(--text-muted)", marginBottom: "0.125rem" }}>{String(label)}</p>
                        <p style={{ fontWeight: 600, color: "var(--midnight)" }}>{String(value)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
/* eslint-enable @typescript-eslint/no-explicit-any */
