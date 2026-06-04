"use client";
import { useState } from "react";
import AdminOverridePanel from "./AdminOverridePanel";

const TABS = ["Overview", "Goals", "Deposits", "Orders", "Referrals", "Activity", "Audit Log"];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function UserProfileAdmin({ profile, wallet, goals, deposits, withdrawals, orders, referrals, activityLog, adminAuditLog, adminId }: { profile: any; wallet: any; goals: any[]; deposits: any[]; withdrawals: any[]; orders: any[]; referrals: any[]; activityLog: any[]; adminAuditLog: any[]; adminId: string }) {
  const [tab, setTab] = useState("Overview");

  const totalDeposited = deposits.filter(d => d.status === "confirmed").reduce((s, d) => s + (d.ngn_equivalent || d.amount), 0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalWithdrawn = withdrawals.filter((w: any) => w.status === "completed").reduce((s, w) => s + w.net_amount, 0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalPenalties = withdrawals.filter((w: any) => w.status === "completed" && w.is_early_exit).reduce((s, w) => s + (w.penalty_amount || 0), 0);

  function TabContent() {
    switch (tab) {
      case "Overview":
        return (
          <div>
            {/* Identity */}
            <div style={{ background: "white", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", padding: "1.5rem", marginBottom: "1.25rem" }}>
              <h3 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "0.9375rem", fontWeight: 700, color: "var(--midnight)", marginBottom: "0.75rem" }}>Identity</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "0.75rem", fontSize: "0.8125rem" }}>
                {[
                  ["Name", profile?.full_name],
                  ["Email", profile?.email],
                  ["Phone", profile?.phone || "—"],
                  ["Country", profile?.country_of_residence || "—"],
                  ["Joined", profile?.created_at ? new Date(profile.created_at).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" }) : "—"],
                  ["Referral code", profile?.referral_code || "—"],
                  ["Referred by", profile?.referred_by || "—"],
                  ["Mobility Score", String(profile?.mobility_score ?? 0)],
                ].map(([label, value]) => (
                  <div key={label}>
                    <p style={{ color: "var(--text-muted)", marginBottom: "0.125rem" }}>{label}</p>
                    <p style={{ fontWeight: 600, color: "var(--midnight)" }}>{value}</p>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem" }}>
                {profile?.alumni_status && (
                  <span style={{ fontSize: "0.65rem", fontWeight: 700, padding: "2px 8px", borderRadius: "20px", background: "var(--teal-pale)", color: "var(--teal)" }}>Alumni</span>
                )}
              </div>
            </div>

            {/* Financial summary */}
            <div style={{ background: "white", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", padding: "1.5rem", marginBottom: "1.25rem" }}>
              <h3 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "0.9375rem", fontWeight: 700, color: "var(--midnight)", marginBottom: "0.75rem" }}>Financial Summary</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "0.75rem", fontSize: "0.8125rem" }}>
                {[
                  ["Total locked", `₦${(wallet?.total_locked_ngn || 0).toLocaleString()}`, "var(--midnight)"],
                  ["Available", `₦${(wallet?.balance_ngn || 0).toLocaleString()}`, "var(--teal)"],
                  ["Total deposited", `₦${totalDeposited.toLocaleString()}`, "var(--midnight)"],
                  ["Total withdrawn", `₦${totalWithdrawn.toLocaleString()}`, "var(--danger)"],
                  ["Total penalties", `₦${totalPenalties.toLocaleString()}`, totalPenalties > 0 ? "var(--danger)" : "var(--text-muted)"],
                  ["Service credits", `₦${(wallet?.total_credits_ngn || 0).toLocaleString()}`, "#6D28D9"],
                ].map(([label, value, color]) => (
                  <div key={label}>
                    <p style={{ color: "var(--text-muted)", marginBottom: "0.125rem" }}>{label}</p>
                    <p style={{ fontWeight: 800, fontSize: "1rem", color }}>{value}</p>
                  </div>
                ))}
              </div>
            </div>

            <AdminOverridePanel profile={profile} goals={goals} adminId={adminId} userId={profile?.id} />
          </div>
        );

      case "Goals":
        return (
          <div style={{ background: "white", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8125rem" }}>
              <thead>
                <tr style={{ background: "var(--gray-100)" }}>
                  {["Name", "Category", "Currency", "Target", "Balance", "Lock period", "Maturity", "Status"].map(h => (
                    <th key={h} style={{ padding: "0.625rem 1rem", textAlign: "left", fontWeight: 600, color: "var(--text-secondary)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {goals.map((g: any) => {
                  const statusColors: Record<string, string> = { active: "var(--teal)", completed: "#6D28D9", withdrawn: "var(--text-muted)", cancelled: "var(--danger)" };
                  return (
                    <tr key={g.id} style={{ borderBottom: "1px solid var(--gray-100)" }}>
                      <td style={{ padding: "0.625rem 1rem", fontWeight: 600, color: "var(--midnight)" }}>{g.goal_name}</td>
                      <td style={{ padding: "0.625rem 1rem", color: "var(--text-secondary)" }}>{g.goal_category}</td>
                      <td style={{ padding: "0.625rem 1rem", color: "var(--text-muted)" }}>{g.currency}</td>
                      <td style={{ padding: "0.625rem 1rem", fontFamily: "monospace" }}>₦{g.target_amount.toLocaleString()}</td>
                      <td style={{ padding: "0.625rem 1rem", fontFamily: "monospace", fontWeight: 700, color: "var(--teal)" }}>₦{g.current_balance.toLocaleString()}</td>
                      <td style={{ padding: "0.625rem 1rem", color: "var(--text-muted)" }}>{g.lock_period_months ? `${g.lock_period_months}m` : "Flex"}</td>
                      <td style={{ padding: "0.625rem 1rem", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        {g.maturity_date ? new Date(g.maturity_date).toLocaleDateString("en-NG") : "—"}
                      </td>
                      <td style={{ padding: "0.625rem 1rem" }}>
                        <span style={{ fontSize: "0.65rem", fontWeight: 700, padding: "2px 6px", borderRadius: "20px", background: `${statusColors[g.status]}15`, color: statusColors[g.status] }}>
                          {g.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );

      case "Deposits":
        return (
          <div style={{ background: "white", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8125rem" }}>
              <thead>
                <tr style={{ background: "var(--gray-100)" }}>
                  {["Date", "Amount", "Currency", "NGN equiv", "Reference", "Status", "Confirmed"].map(h => (
                    <th key={h} style={{ padding: "0.625rem 1rem", textAlign: "left", fontWeight: 600, color: "var(--text-secondary)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {deposits.map((d: any) => (
                  <tr key={d.id} style={{ borderBottom: "1px solid var(--gray-100)" }}>
                    <td style={{ padding: "0.625rem 1rem", fontSize: "0.75rem", color: "var(--text-muted)" }}>{new Date(d.created_at).toLocaleDateString("en-NG")}</td>
                    <td style={{ padding: "0.625rem 1rem", fontWeight: 700 }}>₦{d.amount.toLocaleString()}</td>
                    <td style={{ padding: "0.625rem 1rem", color: "var(--text-muted)" }}>{d.currency}</td>
                    <td style={{ padding: "0.625rem 1rem", fontFamily: "monospace", fontSize: "0.75rem" }}>₦{d.ngn_equivalent?.toLocaleString() || "—"}</td>
                    <td style={{ padding: "0.625rem 1rem", fontSize: "0.75rem", fontFamily: "monospace", color: "var(--teal)" }}>{d.payment_reference}</td>
                    <td style={{ padding: "0.625rem 1rem" }}>
                      <span style={{ fontSize: "0.65rem", fontWeight: 700, padding: "2px 6px", borderRadius: "20px", background: d.status === "confirmed" ? "var(--teal-pale)" : d.status === "pending" ? "#FEF3C7" : "#FEF2F2", color: d.status === "confirmed" ? "var(--teal)" : d.status === "pending" ? "#B45309" : "var(--danger)" }}>
                        {d.status}
                      </span>
                    </td>
                    <td style={{ padding: "0.625rem 1rem", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      {d.admin_confirmed_at ? new Date(d.admin_confirmed_at).toLocaleDateString("en-NG") : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case "Orders":
        return (
          <div style={{ background: "white", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8125rem" }}>
              <thead>
                <tr style={{ background: "var(--gray-100)" }}>
                  {["Order", "Package", "Amount", "Currency", "Status", "Created"].map(h => (
                    <th key={h} style={{ padding: "0.625rem 1rem", textAlign: "left", fontWeight: 600, color: "var(--text-secondary)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {orders.map((o: any) => (
                  <tr key={o.id} style={{ borderBottom: "1px solid var(--gray-100)" }}>
                    <td style={{ padding: "0.625rem 1rem", fontFamily: "monospace", fontSize: "0.75rem", color: "var(--text-secondary)" }}>{o.id?.slice(0, 8)}</td>
                    <td style={{ padding: "0.625rem 1rem", color: "var(--midnight)" }}>{o.service_packages?.name || "—"}</td>
                    <td style={{ padding: "0.625rem 1rem", fontWeight: 700 }}>₦{o.total_amount?.toLocaleString()}</td>
                    <td style={{ padding: "0.625rem 1rem", color: "var(--text-muted)" }}>{o.currency}</td>
                    <td style={{ padding: "0.625rem 1rem" }}>
                      <span style={{ fontSize: "0.65rem", fontWeight: 700, padding: "2px 6px", borderRadius: "20px", background: "#EFF6FF", color: "#1D4ED8" }}>{o.status}</span>
                    </td>
                    <td style={{ padding: "0.625rem 1rem", fontSize: "0.75rem", color: "var(--text-muted)" }}>{new Date(o.created_at).toLocaleDateString("en-NG")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case "Referrals":
        return (
          <div style={{ background: "white", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8125rem" }}>
              <thead>
                <tr style={{ background: "var(--gray-100)" }}>
                  {["Referred user", "Email", "Date"].map(h => (
                    <th key={h} style={{ padding: "0.625rem 1rem", textAlign: "left", fontWeight: 600, color: "var(--text-secondary)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {referrals.map((r: any) => (
                  <tr key={r.id} style={{ borderBottom: "1px solid var(--gray-100)" }}>
                    <td style={{ padding: "0.625rem 1rem", fontWeight: 600, color: "var(--midnight)" }}>{r.referred?.full_name || "—"}</td>
                    <td style={{ padding: "0.625rem 1rem", color: "var(--text-secondary)" }}>{r.referred?.email || "—"}</td>
                    <td style={{ padding: "0.625rem 1rem", fontSize: "0.75rem", color: "var(--text-muted)" }}>{new Date(r.created_at).toLocaleDateString("en-NG")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case "Activity":
        return (
          <div style={{ background: "white", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", overflow: "hidden" }}>
            <div style={{ maxHeight: 500, overflowY: "auto" }}>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {activityLog.map((a: any) => (
                <div key={a.id} style={{ padding: "0.75rem 1.25rem", borderBottom: "1px solid var(--gray-100)", fontSize: "0.8125rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                    <span style={{ fontWeight: 600, color: "var(--midnight)" }}>{a.event_type}</span>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{new Date(a.created_at).toLocaleDateString("en-NG", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                  {a.event_data && <pre style={{ fontSize: "0.7rem", color: "var(--text-muted)", margin: 0, whiteSpace: "pre-wrap" }}>{JSON.stringify(a.event_data, null, 2)}</pre>}
                </div>
              ))}
            </div>
          </div>
        );

      case "Audit Log":
        return (
          <div style={{ background: "white", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", overflow: "hidden" }}>
            <div style={{ maxHeight: 500, overflowY: "auto" }}>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {adminAuditLog.map((a: any) => (
                <div key={a.id} style={{ padding: "0.75rem 1.25rem", borderBottom: "1px solid var(--gray-100)", fontSize: "0.8125rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                    <span style={{ fontWeight: 600, color: "var(--midnight)" }}>{a.action}</span>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{new Date(a.created_at).toLocaleDateString("en-NG", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                  <p style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Admin: {a.admin_id?.slice(0, 8)}</p>
                  {a.previous_value && <pre style={{ fontSize: "0.7rem", color: "var(--danger)", margin: "0.125rem 0", whiteSpace: "pre-wrap" }}>Prev: {a.previous_value}</pre>}
                  {a.new_value && <pre style={{ fontSize: "0.7rem", color: "var(--teal)", margin: "0.125rem 0", whiteSpace: "pre-wrap" }}>New: {a.new_value}</pre>}
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h1 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1.5rem", fontWeight: 800, color: "var(--midnight)" }}>
          {profile?.full_name || "User Profile"}
        </h1>
        <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>{profile?.email}</span>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--border)", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "0.625rem 1rem",
              border: "none",
              borderBottom: tab === t ? "2px solid var(--teal)" : "2px solid transparent",
              background: "transparent",
              fontWeight: tab === t ? 600 : 400,
              color: tab === t ? "var(--teal)" : "var(--text-secondary)",
              fontSize: "0.8125rem",
              cursor: "pointer",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      <TabContent />
    </div>
  );
}
