"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface Milestone {
  id: string; title: string; description: string;
  pctOfTotal: number; amount_ngn: number;
  status: string; completed_at: string | null;
}

export default function AgentDashboard({
  partner, deals, stats,
}: {
  partner: Record<string, unknown>;
  deals: Array<Record<string, unknown>>;
  stats: { totalVolume: number; activeDeals: number; completedDeals: number };
}) {
  const router = useRouter();
  const p = partner as unknown as {
    id: string; name: string; business_name: string | null;
    email: string; status: string; partner_type: string;
    platform_fee_pct: number; is_available: boolean;
    total_escrow_volume_ngn: number; total_escrow_transactions: number;
    average_rating: number; total_reviews: number;
  };
  const [actioning, setActioning] = useState(false);
  const [flagging, setFlagging] = useState<string | null>(null);
  const [disputeReason, setDisputeReason] = useState("");
  const [showDisputeInput, setShowDisputeInput] = useState<string | null>(null);

  async function toggleAvailability() {
    setActioning(true);
    await fetch("/api/admin/partners/update-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ partnerId: p.id, status: p.status, isAvailable: !p.is_available, notes: "Agent self-toggled availability" }),
    });
    router.refresh();
    setActioning(false);
  }

  const statusColors: Record<string, { bg: string; color: string }> = {
    active: { bg: "#FEF3C7", color: "#92400E" },
    completed: { bg: "#D1FAE5", color: "#065F46" },
    disputed: { bg: "#FEE2E2", color: "#DC2626" },
    refunded: { bg: "#F3F4F6", color: "#6B7280" },
    cancelled: { bg: "#F3F4F6", color: "#6B7280" },
  };

  const milestoneStatusColors: Record<string, { bg: string; color: string }> = {
    pending: { bg: "#F3F4F6", color: "#6B7280" },
    completed_pending_admin: { bg: "#FEF3C7", color: "#92400E" },
    completed: { bg: "#D1FAE5", color: "#065F46" },
    disputed: { bg: "#FEE2E2", color: "#DC2626" },
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <div>
          <h1 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1.5rem", fontWeight: 800, color: "var(--midnight)", margin: "0 0 0.25rem 0" }}>
            Partner Dashboard
          </h1>
          <p style={{ fontSize: "0.875rem", color: "#6B7280", margin: 0 }}>
            {p.business_name || p.name} · {p.email}
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ fontSize: "0.75rem", fontWeight: 600, color: p.is_available ? "var(--teal)" : "#DC2626" }}>
            {p.is_available ? "● Accepting deals" : "● Paused"}
          </span>
          <button
            onClick={toggleAvailability}
            disabled={actioning}
            style={{ padding: "0.5rem 1rem", background: p.is_available ? "#F59E0B" : "var(--teal)", color: "white", fontWeight: 700, fontSize: "0.75rem", border: "none", borderRadius: "var(--radius-sm)", cursor: actioning ? "not-allowed" : "pointer" }}
          >
            {actioning ? "..." : p.is_available ? "Pause" : "Resume"}
          </button>
        </div>
      </div>

      {/* Stats cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.75rem", marginBottom: "1.5rem" }}>
        <div style={{ background: "white", padding: "1rem", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)" }}>
          <div style={{ fontSize: "0.75rem", color: "#6B7280", fontWeight: 600 }}>Total Volume</div>
          <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--midnight)", marginTop: "0.25rem" }}>₦{stats.totalVolume.toLocaleString()}</div>
        </div>
        <div style={{ background: "white", padding: "1rem", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)" }}>
          <div style={{ fontSize: "0.75rem", color: "#6B7280", fontWeight: 600 }}>Active Deals</div>
          <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--midnight)", marginTop: "0.25rem" }}>{stats.activeDeals}</div>
        </div>
        <div style={{ background: "white", padding: "1rem", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)" }}>
          <div style={{ fontSize: "0.75rem", color: "#6B7280", fontWeight: 600 }}>Completed Deals</div>
          <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--midnight)", marginTop: "0.25rem" }}>{stats.completedDeals}</div>
        </div>
        <div style={{ background: "white", padding: "1rem", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)" }}>
          <div style={{ fontSize: "0.75rem", color: "#6B7280", fontWeight: 600 }}>Commission Rate</div>
          <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--midnight)", marginTop: "0.25rem" }}>{p.platform_fee_pct}%</div>
        </div>
      </div>

      {/* Earnings summary */}
      <div style={{ background: "#F0FDF4", borderRadius: "var(--radius-xl)", padding: "1rem 1.25rem", border: "1px solid #BBF7D0", marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
        <div>
          <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#065F46" }}>Estimated Lifetime Earnings</div>
          <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#065F46" }}>₦{Math.round(stats.totalVolume * (p.platform_fee_pct / 100)).toLocaleString()}</div>
        </div>
        <div style={{ fontSize: "0.75rem", color: "#065F46" }}>
          Based on {deals.length} deal{deals.length !== 1 ? "s" : ""} at {p.platform_fee_pct}% fee
        </div>
      </div>

      {/* Deals list */}
      <div style={{ background: "white", borderRadius: "var(--radius-xl)", border: "1px solid var(--border)", overflow: "hidden" }}>
        <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--border)", fontWeight: 700, fontSize: "0.875rem", color: "var(--midnight)" }}>
          Your Deals ({deals.length})
        </div>
        {deals.length === 0 ? (
          <p style={{ padding: "2rem", fontSize: "0.875rem", color: "#6B7280", textAlign: "center", margin: 0 }}>No deals yet.</p>
        ) : (
          <div>
            {deals.map((deal) => {
              const d = deal as unknown as {
                id: string; title: string; description: string | null;
                total_amount_ngn: number; platform_fee_ngn: number; partner_payout_ngn: number;
                status: string; milestones: Milestone[]; created_at: string;
              };
              const sc = statusColors[d.status] || { bg: "#F3F4F6", color: "#6B7280" };
              const completedMss = d.milestones.filter((m) => m.status === "completed").length;
              return (
                <div key={d.id} style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--gray-100)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.5rem" }}>
                    <div>
                      <div style={{ fontWeight: 700, color: "var(--midnight)", fontSize: "0.875rem" }}>{d.title}</div>
                      <div style={{ fontSize: "0.75rem", color: "#6B7280", marginTop: "0.125rem" }}>
                        ₦{d.total_amount_ngn.toLocaleString()} · Fee: ₦{d.platform_fee_ngn.toLocaleString()} · Payout: ₦{d.partner_payout_ngn.toLocaleString()}
                      </div>
                    </div>
                    <span style={{ padding: "0.125rem 0.5rem", borderRadius: "4px", fontSize: "0.6875rem", fontWeight: 600, background: sc.bg, color: sc.color, whiteSpace: "nowrap" }}>
                      {d.status.toUpperCase()}
                    </span>
                  </div>

                  {/* Milestone progress */}
                  <div style={{ marginTop: "0.625rem", display: "flex", gap: "0.375rem", flexWrap: "wrap", alignItems: "center" }}>
                    {d.milestones.map((m) => {
                      const mc = milestoneStatusColors[m.status] || { bg: "#F3F4F6", color: "#6B7280" };
                      return (
                        <span key={m.id} style={{ padding: "0.125rem 0.5rem", borderRadius: "4px", fontSize: "0.65rem", fontWeight: 600, background: mc.bg, color: mc.color }}>
                          {m.title || "Milestone"}: {m.status === "completed" ? "✓" : m.status === "completed_pending_admin" ? "⏱" : m.status === "disputed" ? "⚠" : "○"}
                        </span>
                      );
                    })}
                    <span style={{ fontSize: "0.6875rem", color: "#6B7280" }}>({completedMss}/{d.milestones.length})</span>
                  </div>

                  <div style={{ fontSize: "0.6875rem", color: "#9CA3AF", marginTop: "0.375rem" }}>
                    Created {new Date(d.created_at).toLocaleDateString()}
                  </div>
                  {d.status === "active" && (
                    <div style={{ marginTop: "0.375rem" }}>
                      {showDisputeInput === d.id ? (
                        <div style={{ display: "flex", gap: "0.375rem", alignItems: "center" }}>
                          <input
                            value={disputeReason}
                            onChange={(e) => setDisputeReason(e.target.value)}
                            placeholder="Reason for dispute..."
                            style={{ flex: 1, padding: "0.25rem 0.5rem", fontSize: "0.75rem", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", outline: "none" }}
                          />
                          <button
                            onClick={async () => {
                              if (!disputeReason.trim()) return;
                              setFlagging(d.id);
                              await fetch("/api/escrow/flag-dispute", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ dealId: d.id, reason: disputeReason.trim() }),
                              });
                              setFlagging(null);
                              setShowDisputeInput(null);
                              setDisputeReason("");
                              router.refresh();
                            }}
                            disabled={flagging === d.id || !disputeReason.trim()}
                            style={{ padding: "0.25rem 0.625rem", background: "#DC2626", color: "white", fontWeight: 600, fontSize: "0.6875rem", border: "none", borderRadius: "var(--radius-sm)", cursor: "pointer" }}
                          >
                            {flagging === d.id ? "..." : "Confirm"}
                          </button>
                          <button onClick={() => { setShowDisputeInput(null); setDisputeReason(""); }} style={{ padding: "0.25rem 0.5rem", background: "none", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", fontSize: "0.6875rem", cursor: "pointer" }}>
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setShowDisputeInput(d.id)}
                          style={{ padding: "0.25rem 0.625rem", background: "#FEE2E2", color: "#DC2626", fontWeight: 600, fontSize: "0.6875rem", border: "1px solid #FECACA", borderRadius: "var(--radius-sm)", cursor: "pointer" }}
                        >
                          Flag as disputed
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
