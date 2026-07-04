"use client";

import { useState, useMemo } from "react";
import SubAffiliateTree from "./SubAffiliateTree";

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

const TABS = ["Overview", "Referrals & Conversions", "Earnings Timeline", "University", "Sub-Affiliates"];

function formatNgn(n: number | string | null | undefined): string {
  const v = Number(n) || 0;
  return `₦${v.toLocaleString()}`;
}

function fmtDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}

export default function AffiliateDetail({
  profile,
  affiliateStatus,
  referrals,
  moduleProgress,
  allModules,
  earningsTimeline,
  withdrawals,
  subAffiliates,
}: {
  profile: any;
  affiliateStatus: any;
  referrals: any[];
  moduleProgress: any[];
  allModules: any[];
  earningsTimeline: any[];
  withdrawals: any[];
  subAffiliates: any[];
}) {
  const [tab, setTab] = useState("Overview");

  // Admin action modals
  const [actionModal, setActionModal] = useState<string | null>(null);
  const [changeTierValue, setChangeTierValue] = useState(affiliateStatus?.tier || "starter");
  const [adjustField, setAdjustField] = useState("pending_earnings_ngn");
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustReason, setAdjustReason] = useState("");
  const [actionResult, setActionResult] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const referralStats = useMemo(() => {
    const total = referrals.length;
    const converted = referrals.filter((r: any) => r.commission_status === "paid").length;
    return { total, converted, rate: total > 0 ? Math.round((converted / total) * 100) : 0 };
  }, [referrals]);

  const universityStats = useMemo(() => {
    const completed = moduleProgress.filter((p: any) => p.completed_at).length;
    const total = allModules.length;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { completed, total, pct, points: Number(affiliateStatus?.university_points) || 0 };
  }, [moduleProgress, allModules, affiliateStatus]);

  async function handleAction(action: string) {
    setSubmitting(true);
    setActionResult(null);
    try {
      let url = "";
      let body: any = {};

      if (action === "change_tier") {
        url = `/api/admin/affiliates/${profile.id}/update-tier`;
        body = { tier: changeTierValue };
      } else if (action === "adjust_earnings") {
        if (adjustReason.trim().length < 10) {
          setActionResult("Error: Reason must be at least 10 characters");
          setSubmitting(false);
          return;
        }
        url = `/api/admin/affiliates/${profile.id}/adjust-earnings`;
        body = { field: adjustField, amount: Number(adjustAmount), reason: adjustReason };
      } else if (action === "reset_code") {
        url = `/api/admin/affiliates/${profile.id}/reset-code`;
        body = {};
      }

      const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (res.ok) {
        setActionResult(action === "change_tier" ? `Tier changed to ${changeTierValue}` : action === "adjust_earnings" ? `Earnings adjusted: ₦${Number(adjustAmount).toLocaleString()}` : "Affiliate code reset");
        setActionModal(null);
      } else {
        setActionResult(`Error: ${data.error || "Request failed"}`);
      }
    } catch (err: any) {
      setActionResult(`Error: ${err.message}`);
    }
    setSubmitting(false);
    setTimeout(() => setActionResult(null), 5000);
  }

  function Modal() {
    if (!actionModal) return null;

    return (
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "1rem" }} onClick={() => setActionModal(null)}>
        <div style={{ background: "white", borderRadius: "var(--radius-lg)", padding: "1.5rem", width: "100%", maxWidth: 440, maxHeight: "80vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
          <h3 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1rem", fontWeight: 700, marginBottom: "1rem" }}>
            {actionModal === "change_tier" && "Change affiliate tier"}
            {actionModal === "adjust_earnings" && "Adjust earnings"}
            {actionModal === "reset_code" && "Reset affiliate code"}
          </h3>

          {actionModal === "change_tier" && (
            <>
              <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginBottom: "0.75rem" }}>
                Current tier: <strong>{affiliateStatus?.tier || "starter"}</strong>
              </p>
              <select value={changeTierValue} onChange={(e) => setChangeTierValue(e.target.value)} style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", fontSize: "0.8125rem", marginBottom: "1rem" }}>
                {TIERS.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
              <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                <button onClick={() => setActionModal(null)} style={{ padding: "0.5rem 1rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", background: "white", fontSize: "0.8125rem", cursor: "pointer" }}>Cancel</button>
                <button onClick={() => handleAction("change_tier")} disabled={submitting} style={{ padding: "0.5rem 1rem", borderRadius: "var(--radius-md)", border: "none", background: "var(--midnight)", color: "white", fontSize: "0.8125rem", cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.6 : 1 }}>
                  {submitting ? "Saving..." : "Confirm"}
                </button>
              </div>
            </>
          )}

          {actionModal === "adjust_earnings" && (
            <>
              <div style={{ marginBottom: "0.75rem" }}>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.25rem" }}>Field</label>
                <select value={adjustField} onChange={(e) => setAdjustField(e.target.value)} style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", fontSize: "0.8125rem" }}>
                  <option value="pending_earnings_ngn">Pending earnings</option>
                  <option value="total_earned_ngn">Total earned</option>
                  <option value="withdrawn_earnings_ngn">Withdrawn</option>
                </select>
              </div>
              <div style={{ marginBottom: "0.75rem" }}>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.25rem" }}>
                  Amount (use negative for deduction)
                </label>
                <input type="number" value={adjustAmount} onChange={(e) => setAdjustAmount(e.target.value)} style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", fontSize: "0.8125rem" }} />
              </div>
              {adjustAmount && (
                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.75rem" }}>
                  Current {adjustField.replace(/_/g, " ")}: <strong>{formatNgn(affiliateStatus?.[adjustField])}</strong>
                  {" → "}
                  <strong>{formatNgn((Number(affiliateStatus?.[adjustField]) || 0) + (Number(adjustAmount) || 0))}</strong>
                </p>
              )}
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.25rem" }}>
                  Reason <span style={{ color: "var(--danger)" }}>*</span>
                </label>
                <textarea value={adjustReason} onChange={(e) => setAdjustReason(e.target.value)} rows={3} placeholder="Explain why this adjustment is needed (min 10 characters)" style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", fontSize: "0.8125rem", resize: "vertical" }} />
                {adjustReason.length > 0 && adjustReason.length < 10 && (
                  <p style={{ fontSize: "0.7rem", color: "var(--danger)", marginTop: "0.25rem" }}>{10 - adjustReason.length} more characters required</p>
                )}
              </div>
              <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                <button onClick={() => setActionModal(null)} style={{ padding: "0.5rem 1rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", background: "white", fontSize: "0.8125rem", cursor: "pointer" }}>Cancel</button>
                <button onClick={() => handleAction("adjust_earnings")} disabled={submitting || adjustReason.trim().length < 10} style={{ padding: "0.5rem 1rem", borderRadius: "var(--radius-md)", border: "none", background: "#B45309", color: "white", fontSize: "0.8125rem", cursor: submitting || adjustReason.trim().length < 10 ? "not-allowed" : "pointer", opacity: submitting || adjustReason.trim().length < 10 ? 0.6 : 1 }}>
                  {submitting ? "Saving..." : "Confirm adjustment"}
                </button>
              </div>
            </>
          )}

          {actionModal === "reset_code" && (
            <>
              <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
                Current code: <strong style={{ fontFamily: "monospace" }}>{affiliateStatus?.custom_affiliate_code || "—"}</strong>
              </p>
              <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginBottom: "1rem" }}>A new AFF-XXXXXXXX code will be generated. This action is logged to the audit log.</p>
              <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                <button onClick={() => setActionModal(null)} style={{ padding: "0.5rem 1rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", background: "white", fontSize: "0.8125rem", cursor: "pointer" }}>Cancel</button>
                <button onClick={() => handleAction("reset_code")} disabled={submitting} style={{ padding: "0.5rem 1rem", borderRadius: "var(--radius-md)", border: "none", background: "var(--danger)", color: "white", fontSize: "0.8125rem", cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.6 : 1 }}>
                  {submitting ? "Resetting..." : "Reset code"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  function OverviewTab() {
    return (
      <div>
        {/* Identity card */}
        <div style={{ background: "white", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", padding: "1.5rem", marginBottom: "1.25rem" }}>
          <h3 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "0.9375rem", fontWeight: 700, marginBottom: "0.75rem" }}>Identity</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "0.75rem", fontSize: "0.8125rem" }}>
            {[
              ["Name", profile?.full_name],
              ["Email", profile?.email],
              ["Phone", profile?.phone || "—"],
              ["Country", profile?.country_of_residence || "—"],
              ["Joined", fmtDate(profile?.created_at)],
              ["Affiliate code", profile?.referral_code || "—"],
              ["Referred by", profile?.referred_by || "—"],
              ["Mobility Score", String(profile?.mobility_score ?? 0)],
              ["Readiness Score", profile?.readiness_score != null ? `${profile.readiness_score}/100` : "—"],
            ].map(([label, value]) => (
              <div key={String(label)}>
                <p style={{ color: "var(--text-muted)", marginBottom: "0.125rem" }}>{String(label)}</p>
                <p style={{ fontWeight: 600, color: "var(--midnight)" }}>{String(value)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Affiliate stats */}
        <div style={{ background: "white", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", padding: "1.5rem", marginBottom: "1.25rem" }}>
          <h3 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "0.9375rem", fontWeight: 700, marginBottom: "0.75rem" }}>Affiliate Stats</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "0.75rem", fontSize: "0.8125rem" }}>
            {[
              ["Tier", (affiliateStatus?.tier || "starter").charAt(0).toUpperCase() + (affiliateStatus?.tier || "starter").slice(1), TIER_COLORS[affiliateStatus?.tier || "starter"]],
              ["Custom code", affiliateStatus?.custom_affiliate_code || "—", "var(--teal)"],
              ["Pending earnings", formatNgn(affiliateStatus?.pending_earnings_ngn), "#B45309"],
              ["Withdrawn", formatNgn(affiliateStatus?.withdrawn_earnings_ngn), "var(--teal)"],
              ["Total earned", formatNgn(affiliateStatus?.total_earned_ngn), "var(--midnight)"],
              ["Referrals", String(referralStats.total), "var(--midnight)"],
              ["Converted", String(referralStats.converted), "var(--teal)"],
              ["Conversion rate", `${referralStats.rate}%`, referralStats.rate > 30 ? "var(--teal)" : "var(--text-muted)"],
              ["University points", String(affiliateStatus?.university_points || 0), "var(--midnight)"],
              ["Modules", `${universityStats.completed}/${universityStats.total}`, "var(--midnight)"],
              ["Rank", String(affiliateStatus?.rank || "—"), "var(--text-muted)"],
              ["Maturity", affiliateStatus?.created_at ? new Date(affiliateStatus.created_at).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" }) : "—", "var(--text-muted)"],
            ].map(([label, value, color]) => (
              <div key={String(label)}>
                <p style={{ color: "var(--text-muted)", marginBottom: "0.125rem" }}>{String(label)}</p>
                <p style={{ fontWeight: 800, fontSize: "1rem", color: String(color) }}>{String(value)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Admin actions panel */}
        <div style={{ background: "white", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", padding: "1.5rem" }}>
          <h3 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "0.9375rem", fontWeight: 700, marginBottom: "0.75rem" }}>Admin Actions</h3>
          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "1rem" }}>All actions are logged to the immutable admin audit log.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "0.75rem" }}>
            <ActionButton label="Change tier" description="Override the affiliate's tier level" dangerous={false} onClick={() => { setChangeTierValue(affiliateStatus?.tier || "starter"); setActionModal("change_tier"); }} />
            <ActionButton label="Adjust earnings" description="Add or deduct earnings with reason" dangerous={true} onClick={() => { setAdjustField("pending_earnings_ngn"); setAdjustAmount(""); setAdjustReason(""); setActionModal("adjust_earnings"); }} />
            <ActionButton label="Reset code" description="Generate a new AFF-XXXXXXXX code" dangerous={true} onClick={() => setActionModal("reset_code")} />
            <ActionButton label="View as user" description="Preview the affiliate dashboard" dangerous={false} onClick={() => window.open(`/dashboard/affiliate?userId=${profile?.id}&adminOverride=true`, "_blank")} />
          </div>
        </div>
      </div>
    );
  }

  function ReferralsTab() {
    const [statusFilter, setStatusFilter] = useState("all");

    const filtered = useMemo(() => {
      if (statusFilter === "all") return referrals;
      if (statusFilter === "converted") return referrals.filter((r: any) => r.commission_status === "paid");
      if (statusFilter === "pending") return referrals.filter((r: any) => r.commission_status === "pending");
      return referrals.filter((r: any) => r.commission_status === statusFilter);
    }, [referrals, statusFilter]);

    return (
      <div style={{ background: "white", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", overflow: "hidden" }}>
        <div style={{ padding: "0.875rem 1rem", borderBottom: "1px solid var(--border)", display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ padding: "0.375rem 0.625rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", fontSize: "0.8125rem" }}>
            <option value="all">All ({referrals.length})</option>
            <option value="converted">Converted ({referrals.filter((r: any) => r.commission_status === "paid").length})</option>
            <option value="pending">Pending ({referrals.filter((r: any) => r.commission_status === "pending").length})</option>
            <option value="expired">Expired ({referrals.filter((r: any) => r.commission_status === "expired").length})</option>
          </select>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8125rem" }}>
            <thead>
              <tr style={{ background: "var(--gray-100)" }}>
                {["Referred user", "Email", "Date referred", "Commission status", "Converted", "Service order", "Actions"].map((h) => (
                  <th key={h} style={{ padding: "0.625rem 1rem", textAlign: "left", fontWeight: 600, color: "var(--text-secondary)", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r: any) => (
                <tr key={r.id} style={{ borderBottom: "1px solid var(--gray-100)" }}>
                  <td style={{ padding: "0.625rem 1rem", fontWeight: 600, color: "var(--midnight)" }}>{r.referred?.full_name || "—"}</td>
                  <td style={{ padding: "0.625rem 1rem", color: "var(--text-secondary)" }}>{r.referred?.email || "—"}</td>
                  <td style={{ padding: "0.625rem 1rem", fontSize: "0.75rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>{fmtDate(r.created_at)}</td>
                  <td style={{ padding: "0.625rem 1rem" }}>
                    <span style={{ fontSize: "0.65rem", fontWeight: 700, padding: "2px 6px", borderRadius: "20px", background: r.commission_status === "paid" ? "var(--teal-pale)" : r.commission_status === "pending" ? "#FEF3C7" : "#FEF2F2", color: r.commission_status === "paid" ? "var(--teal)" : r.commission_status === "pending" ? "#B45309" : "var(--danger)" }}>
                      {r.commission_status || "pending"}
                    </span>
                  </td>
                  <td style={{ padding: "0.625rem 1rem" }}>
                    {r.commission_status === "paid" ? (
                      <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--teal)" }}>✓</span>
                    ) : (
                      <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>—</span>
                    )}
                  </td>
                  <td style={{ padding: "0.625rem 1rem", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                    {r.service_orders?.length > 0 ? (
                      r.service_orders.map((o: any) => (
                        <div key={o.id}>
                          <a href={`/admin/orders/${o.id}`} target="_blank" rel="noopener noreferrer" style={{ color: "var(--teal)", textDecoration: "underline" }}>
                            {o.service_packages?.name || "Order"} — {formatNgn(o.total_amount)}
                          </a>
                        </div>
                      ))
                    ) : "—"}
                  </td>
                  <td style={{ padding: "0.625rem 1rem" }}>
                    {r.referred?.id && (
                      <a href={`/admin/users/${r.referred.id}`} target="_blank" rel="noopener noreferrer" style={{ padding: "0.25rem 0.5rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", fontSize: "0.7rem", textDecoration: "none", color: "var(--teal)", whiteSpace: "nowrap" }}>
                        View user
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <p style={{ padding: "1.5rem", fontSize: "0.875rem", color: "var(--text-muted)", textAlign: "center" }}>No referrals found.</p>
        )}
      </div>
    );
  }

  function EarningsTimelineTab() {
    const timeline = useMemo(() => {
      const entries: Array<{ date: string; type: string; desc: string; amount: number; color: string }> = [];

      for (const w of withdrawals || []) {
        entries.push({
          date: w.processed_at || w.requested_at,
          type: w.status === "approved" ? "withdrawal" : w.status === "rejected" ? "withdrawal_rejected" : "withdrawal_pending",
          desc: w.status === "approved" ? `Withdrawal approved: ${formatNgn(w.amount_ngn)}` : w.status === "rejected" ? `Withdrawal rejected: ${formatNgn(w.amount_ngn)}` : `Withdrawal requested: ${formatNgn(w.amount_ngn)}`,
          amount: Number(w.amount_ngn) || 0,
          color: w.status === "approved" ? "var(--teal)" : w.status === "rejected" ? "var(--danger)" : "#B45309",
        });
      }

      for (const al of earningsTimeline || []) {
        const data = al.event_data || {};
        if (al.event_type === "affiliate_commission") {
          entries.push({
            date: al.created_at,
            type: "commission",
            desc: `Commission earned: ${formatNgn(data.amount)}${data.referral_name ? ` from ${data.referral_name}` : ""}${data.service_name ? ` (${data.service_name})` : ""}`,
            amount: Number(data.amount) || 0,
            color: "var(--teal)",
          });
        } else if (al.event_type === "affiliate_manual_adjustment") {
          const amt = Number(data.amount) || 0;
          entries.push({
            date: al.created_at,
            type: "adjustment",
            desc: `Manual adjustment: ${amt >= 0 ? "+" : ""}${formatNgn(amt)} (${data.field?.replace(/_/g, " ") || ""}) — ${data.reason || "No reason provided"}${data.admin_id ? ` by admin ${data.admin_id.slice(0, 8)}` : ""}`,
            amount: amt,
            color: amt >= 0 ? "var(--teal)" : "var(--danger)",
          });
        } else if (al.event_type === "affiliate_withdrawal_approved") {
          entries.push({
            date: al.created_at,
            type: "withdrawal",
            desc: `Withdrawal approved: ${formatNgn(data.amount_ngn)}`,
            amount: Number(data.amount_ngn) || 0,
            color: "var(--teal)",
          });
        } else if (al.event_type === "affiliate_withdrawal_rejected") {
          entries.push({
            date: al.created_at,
            type: "withdrawal_rejected",
            desc: `Withdrawal rejected: ${formatNgn(data.amount_ngn)}${data.reason ? ` (${data.reason})` : ""}`,
            amount: Number(data.amount_ngn) || 0,
            color: "var(--danger)",
          });
        }
      }

      entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      return entries;
    }, [withdrawals, earningsTimeline]);

    return (
      <div style={{ background: "white", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", padding: "1.5rem" }}>
        {timeline.length === 0 ? (
          <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", textAlign: "center" }}>No earnings activity yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {timeline.map((entry, i) => (
              <div key={i} style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start", paddingBottom: "0.75rem", borderBottom: i < timeline.length - 1 ? "1px solid var(--gray-100)" : "none" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: entry.color, marginTop: "0.375rem", flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: "0.8125rem", color: entry.color, fontWeight: 600 }}>{entry.desc}</p>
                  <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "0.125rem" }}>{fmtDate(entry.date)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  function UniversityTab() {
    const progressMap = new Map(moduleProgress.map((p: any) => [p.module_id, p]));

    return (
      <div>
        {/* Stats card */}
        <div style={{ background: "white", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", padding: "1.5rem", marginBottom: "1.25rem" }}>
          <div style={{ display: "flex", gap: "2rem", alignItems: "center", flexWrap: "wrap" }}>
            <div>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>University points</span>
              <p style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1.5rem", fontWeight: 800, color: "var(--teal)" }}>{universityStats.points}</p>
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.375rem" }}>
                <span>Progress</span>
                <span>{universityStats.completed}/{universityStats.total} modules ({universityStats.pct}%)</span>
              </div>
              <div style={{ height: 6, background: "var(--gray-100)", borderRadius: 4, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${universityStats.pct}%`, background: "var(--teal)", borderRadius: 4, transition: "width 0.3s" }} />
              </div>
            </div>
          </div>
        </div>

        {/* Module table */}
        <div style={{ background: "white", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8125rem" }}>
              <thead>
                <tr style={{ background: "var(--gray-100)" }}>
                  {["#", "Module", "Type", "Points", "Completed at", "Status"].map((h) => (
                    <th key={h} style={{ padding: "0.625rem 1rem", textAlign: "left", fontWeight: 600, color: "var(--text-secondary)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allModules.map((m: any) => {
                  const prog = progressMap.get(m.id);
                  const completed = prog?.completed_at;
                  return (
                    <tr key={m.id} style={{ borderBottom: "1px solid var(--gray-100)" }}>
                      <td style={{ padding: "0.625rem 1rem", color: "var(--text-muted)" }}>{m.order_in_course}</td>
                      <td style={{ padding: "0.625rem 1rem", fontWeight: 600, color: "var(--midnight)" }}>{m.title}</td>
                      <td style={{ padding: "0.625rem 1rem" }}>
                        <span style={{ fontSize: "0.65rem", fontWeight: 700, padding: "2px 6px", borderRadius: "20px", background: "#EFF6FF", color: "#1D4ED8" }}>
                          {m.content_type}
                        </span>
                      </td>
                      <td style={{ padding: "0.625rem 1rem", color: "var(--text-muted)" }}>{m.points_on_completion}</td>
                      <td style={{ padding: "0.625rem 1rem", fontSize: "0.75rem", color: "var(--text-muted)" }}>{completed ? fmtDate(completed) : "—"}</td>
                      <td style={{ padding: "0.625rem 1rem" }}>
                        {completed ? (
                          <span style={{ fontSize: "0.65rem", fontWeight: 700, padding: "2px 6px", borderRadius: "20px", background: "var(--teal-pale)", color: "var(--teal)" }}>Completed</span>
                        ) : (
                          <span style={{ fontSize: "0.65rem", fontWeight: 700, padding: "2px 6px", borderRadius: "20px", background: "var(--gray-100)", color: "var(--text-muted)" }}>Not started</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  function SubAffiliatesTab() {
    const isEligible = affiliateStatus && ["gold", "platinum"].includes(affiliateStatus.tier);
    if (!isEligible) {
      return (
        <div style={{ background: "white", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", padding: "2rem", textAlign: "center" }}>
          <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>Sub-affiliate tree is only available for Gold and Platinum affiliates.</p>
        </div>
      );
    }
    return <SubAffiliateTree subAffiliates={subAffiliates} />;
  }

  function TabContent() {
    switch (tab) {
      case "Overview": return <OverviewTab />;
      case "Referrals & Conversions": return <ReferralsTab />;
      case "Earnings Timeline": return <EarningsTimelineTab />;
      case "University": return <UniversityTab />;
      case "Sub-Affiliates": return <SubAffiliatesTab />;
      default: return null;
    }
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "0.5rem" }}>
        <div>
          <h1 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1.5rem", fontWeight: 800, color: "var(--midnight)", margin: 0 }}>
            {profile?.full_name || "Affiliate Profile"}
          </h1>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginTop: "0.25rem" }}>
            <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>{profile?.email}</span>
            <span style={{ fontSize: "0.65rem", fontWeight: 700, padding: "2px 8px", borderRadius: "20px", background: TIER_BG[affiliateStatus?.tier] || "var(--gray-100)", color: TIER_COLORS[affiliateStatus?.tier] || "var(--text-muted)" }}>
              {(affiliateStatus?.tier || "starter").charAt(0).toUpperCase() + (affiliateStatus?.tier || "starter").slice(1)}
            </span>
            {affiliateStatus?.custom_affiliate_code && (
              <span style={{ fontFamily: "monospace", fontSize: "0.7rem", color: "var(--teal)", background: "var(--teal-pale)", padding: "2px 6px", borderRadius: "var(--radius-sm)" }}>
                {affiliateStatus.custom_affiliate_code}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--border)", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: "0.625rem 1rem", border: "none", borderBottom: tab === t ? "2px solid var(--teal)" : "2px solid transparent", background: "transparent", fontWeight: tab === t ? 600 : 400, color: tab === t ? "var(--teal)" : "var(--text-secondary)", fontSize: "0.8125rem", cursor: "pointer" }}>
            {t}
          </button>
        ))}
      </div>

      <TabContent />

      <Modal />

      {actionResult && (
        <div style={{ position: "fixed", bottom: "1.5rem", right: "1.5rem", padding: "0.75rem 1rem", borderRadius: "var(--radius-md)", background: actionResult.startsWith("Error") ? "#FEF2F2" : "var(--teal-pale)", color: actionResult.startsWith("Error") ? "var(--danger)" : "var(--teal)", fontSize: "0.8125rem", fontWeight: 600, zIndex: 200, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
          {actionResult}
        </div>
      )}
    </div>
  );
}

function ActionButton({ label, description, dangerous, onClick }: { label: string; description: string; dangerous: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ padding: "0.75rem", borderRadius: "var(--radius-md)", border: dangerous ? "1px solid #FECACA" : "1px solid var(--border)", background: dangerous ? "#FEF2F2" : "white", cursor: "pointer", textAlign: "left", transition: "box-shadow 0.15s" }}>
      <p style={{ fontWeight: 700, fontSize: "0.8125rem", color: dangerous ? "var(--danger)" : "var(--midnight)", marginBottom: "0.25rem" }}>{label}</p>
      <p style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{description}</p>
    </button>
  );
}
/* eslint-enable @typescript-eslint/no-explicit-any */
