"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

  interface DealRecord {
  id: string; title: string; status: string;
  total_amount_ngn: number; client_user_id: string;
  created_at: string;
  platform_fee_ngn?: number;
  partner_payout_ngn?: number;
}

export default function AdminPartnerDetail({
  partner, deals,
}: {
  partner: Record<string, unknown>;
  deals: DealRecord[];
}) {
  const router = useRouter();
  const [actioning, setActioning] = useState(false);
  const [actionResult, setActionResult] = useState<string | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [resolving, setResolving] = useState<string | null>(null);
  const [feePct, setFeePct] = useState((partner as any).platform_fee_pct || 5);
  const [savingFee, setSavingFee] = useState(false);

  const p = partner as unknown as {
    id: string; name: string; business_name: string | null;
    email: string; phone: string | null;
    partner_type: string; status: string;
    verification_documents: Array<{ name: string; url: string }>;
    cac_number: string | null;
    professional_licence_number: string | null;
    years_in_operation: number | null;
    specialisations: string[]; destinations_served: string[];
    average_rating: number; total_reviews: number;
    total_escrow_volume_ngn: number; total_escrow_transactions: number;
    platform_fee_pct: number;
    is_available: boolean;
    created_at: string;
  };

  const PARTNER_TYPE_LABELS: Record<string, string> = {
    immigration_lawyer: "Immigration Lawyer",
    visa_agent: "Visa Agent",
    relocation_consultant: "Relocation Consultant",
    trade_agent: "Trade Agent",
    recruitment_agency: "Recruitment Agency",
    education_consultant: "Education Consultant",
  };

  async function updateStatus(newStatus: string) {
    setActioning(true);
    setActionResult(null);
    try {
      const res = await fetch("/api/admin/partners/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partnerId: p.id, status: newStatus, notes: adminNote || undefined }),
      });
      const data = await res.json();
      if (res.ok) {
        setActionResult(`Partner status updated to "${newStatus}". Refreshing...`);
        setAdminNote("");
        setTimeout(() => router.refresh(), 1500);
      } else {
        setActionResult(`Error: ${data.error || "Unknown error"}`);
      }
    } catch (err) {
      setActionResult(`Error: ${(err as Error).message}`);
    }
    setActioning(false);
  }

  async function saveFee() {
    setSavingFee(true);
    setActionResult(null);
    try {
      const res = await fetch("/api/admin/partners/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partnerId: p.id, status: p.status, platformFeePct: feePct, notes: `Platform fee updated to ${feePct}%` }),
      });
      if (res.ok) {
        setActionResult(`Platform fee updated to ${feePct}%. Refreshing...`);
        setTimeout(() => router.refresh(), 1500);
      } else {
        const data = await res.json();
        setActionResult(`Error: ${data.error || "Unknown error"}`);
      }
    } catch (err) {
      setActionResult(`Error: ${(err as Error).message}`);
    }
    setSavingFee(false);
  }

  async function resolveDispute(dealId: string, resolution: string) {
    setResolving(dealId);
    setActionResult(null);
    try {
      const res = await fetch("/api/escrow/resolve-dispute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dealId, resolution, notes: adminNote || undefined }),
      });
      const data = await res.json();
      if (res.ok) {
        setActionResult(`Dispute resolved: ${resolution}. Refreshing...`);
        setAdminNote("");
        setTimeout(() => router.refresh(), 1500);
      } else {
        setActionResult(`Error: ${data.error || "Unknown error"}`);
      }
    } catch (err) {
      setActionResult(`Error: ${(err as Error).message}`);
    }
    setResolving(null);
  }

  return (
    <div>
      {/* Back link */}
      <a href="/admin/partners" style={{ fontSize: "0.8125rem", color: "var(--teal)", fontWeight: 600, textDecoration: "none", display: "inline-block", marginBottom: "1rem" }}>
        ← Back to Partners
      </a>

      {/* Profile card */}
      <div style={{ background: "white", borderRadius: "var(--radius-xl)", padding: "1.5rem", border: "1px solid var(--border)", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h1 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1.25rem", fontWeight: 800, color: "var(--midnight)", margin: "0 0 0.25rem 0" }}>
              {p.business_name || p.name}
            </h1>
            <p style={{ fontSize: "0.8125rem", color: "#6B7280", margin: "0 0 0.375rem 0" }}>{p.name} · {p.email}</p>
            <span style={{ display: "inline-block", padding: "0.125rem 0.5rem", borderRadius: "4px", fontSize: "0.6875rem", fontWeight: 600, background: p.status === "active" ? "#D1FAE5" : p.status === "pending" ? "#FEF3C7" : p.status === "suspended" ? "#FEE2E2" : "#F3F4F6", color: p.status === "active" ? "#065F46" : p.status === "pending" ? "#92400E" : p.status === "suspended" ? "#DC2626" : "#6B7280" }}>
              {p.status.toUpperCase()}
            </span>
          </div>
          {p.average_rating > 0 && (
            <div style={{ textAlign: "right" }}>
              <span style={{ fontSize: "1.25rem", fontWeight: 700 }}>★ {p.average_rating.toFixed(1)}</span>
              <span style={{ fontSize: "0.75rem", color: "#6B7280", marginLeft: "0.25rem" }}>({p.total_reviews})</span>
            </div>
          )}
        </div>

        <div style={{ marginTop: "1rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", fontSize: "0.8125rem" }}>
          <div><strong style={{ color: "#374151" }}>Type:</strong> {PARTNER_TYPE_LABELS[p.partner_type] || p.partner_type}</div>
          <div><strong style={{ color: "#374151" }}>Phone:</strong> {p.phone || "—"}</div>
          <div><strong style={{ color: "#374151" }}>CAC:</strong> {p.cac_number || "—"}</div>
          <div><strong style={{ color: "#374151" }}>Licence:</strong> {p.professional_licence_number || "—"}</div>
          <div><strong style={{ color: "#374151" }}>Experience:</strong> {p.years_in_operation ? `${p.years_in_operation} years` : "—"}</div>
          <div><strong style={{ color: "#374151" }}>Fee:</strong> {p.platform_fee_pct}%</div>
          <div><strong style={{ color: "#374151" }}>Volume:</strong> ₦{p.total_escrow_volume_ngn.toLocaleString()}</div>
          <div><strong style={{ color: "#374151" }}>Deals:</strong> {p.total_escrow_transactions}</div>
          <div><strong style={{ color: "#374151" }}>Applied:</strong> {new Date(p.created_at).toLocaleDateString()}</div>
        </div>

        {/* Commission earnings */}
        <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--border)" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#374151", marginBottom: "0.5rem" }}>Commission Earnings</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", fontSize: "0.8125rem" }}>
            <div><strong style={{ color: "#374151" }}>Volume:</strong> ₦{p.total_escrow_volume_ngn.toLocaleString()}</div>
            <div><strong style={{ color: "#374151" }}>Transactions:</strong> {p.total_escrow_transactions}</div>
            <div><strong style={{ color: "#374151" }}>Fee Rate:</strong> {p.platform_fee_pct}%</div>
            <div><strong style={{ color: "#374151" }}>Est. Commission:</strong> ₦{Math.round(p.total_escrow_volume_ngn * (p.platform_fee_pct / 100)).toLocaleString()}</div>
          </div>
        </div>

        {p.specialisations.length > 0 && (
          <div style={{ marginTop: "1rem", display: "flex", gap: "0.25rem", flexWrap: "wrap" }}>
            {p.specialisations.map((s, i) => <span key={i} style={{ padding: "0.125rem 0.5rem", background: "var(--off-white)", borderRadius: "4px", fontSize: "0.6875rem" }}>{s}</span>)}
          </div>
        )}

        {p.destinations_served.length > 0 && (
          <div style={{ marginTop: "0.5rem", display: "flex", gap: "0.25rem", flexWrap: "wrap" }}>
            {p.destinations_served.map((d, i) => <span key={i} style={{ padding: "0.125rem 0.5rem", background: "#EFF6FF", color: "#1E40AF", borderRadius: "4px", fontSize: "0.6875rem" }}>{d}</span>)}
          </div>
        )}

        {/* Verification documents */}
        {p.verification_documents && (p.verification_documents as Array<{ name: string; url: string }>).length > 0 && (
          <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--border)" }}>
            <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#374151", marginBottom: "0.5rem" }}>Verification Documents</div>
            {(p.verification_documents as Array<{ name: string; url: string }>).map((doc, i) => (
              <a key={i} href={doc.url} target="_blank" rel="noopener noreferrer" style={{ display: "block", fontSize: "0.75rem", color: "var(--teal)", fontWeight: 600, textDecoration: "underline", marginBottom: "0.25rem" }}>
                {doc.name}
              </a>
            ))}
          </div>
        )}

        {/* Commission rate setting */}
        <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--border)" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#374151", marginBottom: "0.5rem" }}>Commission Rate</div>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <input
              type="number"
              min={0}
              max={100}
              step={0.5}
              value={feePct}
              onChange={(e) => setFeePct(Number(e.target.value))}
              style={{ width: "4rem", padding: "0.375rem 0.5rem", fontSize: "0.8125rem", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", outline: "none" }}
            />
            <span style={{ fontSize: "0.8125rem", color: "#6B7280" }}>%</span>
            <button
              onClick={saveFee}
              disabled={savingFee || feePct === p.platform_fee_pct}
              style={{ padding: "0.375rem 0.75rem", background: feePct === p.platform_fee_pct ? "#E5E7EB" : "var(--teal)", color: feePct === p.platform_fee_pct ? "#9CA3AF" : "var(--midnight)", fontWeight: 600, fontSize: "0.75rem", border: "none", borderRadius: "var(--radius-sm)", cursor: feePct === p.platform_fee_pct ? "not-allowed" : "pointer" }}
            >
              {savingFee ? "Saving..." : "Update"}
            </button>
          </div>
        </div>

        {/* Availability toggle */}
        {p.status === "active" && (
          <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--border)" }}>
            <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#374151", marginBottom: "0.5rem" }}>Availability for New Deals</div>
            <button
              onClick={async () => {
                setActioning(true);
                try {
                  const res = await fetch("/api/admin/partners/update-status", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ partnerId: p.id, status: p.status, isAvailable: !p.is_available, notes: `Availability toggled to ${!p.is_available ? "available" : "paused"}` }),
                  });
                  if (res.ok) {
                    setActionResult(`Agent now ${!p.is_available ? "available" : "paused"} for new deals. Refreshing...`);
                    setTimeout(() => router.refresh(), 1500);
                  }
                } catch {}
                setActioning(false);
              }}
              disabled={actioning}
              style={{ padding: "0.5rem 1.25rem", background: p.is_available ? "#F59E0B" : "var(--teal)", color: "white", fontWeight: 700, fontSize: "0.8125rem", border: "none", borderRadius: "var(--radius-sm)", cursor: actioning ? "not-allowed" : "pointer" }}
            >
              {actioning ? "Updating..." : p.is_available ? "Pause Availability" : "Resume Availability"}
            </button>
            <span style={{ marginLeft: "0.75rem", fontSize: "0.75rem", fontWeight: 600, color: p.is_available ? "var(--teal)" : "#DC2626" }}>
              {p.is_available ? "● Accepting deals" : "● Paused"}
            </span>
          </div>
        )}

        {/* Admin notes */}
        <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--border)" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#374151", marginBottom: "0.375rem" }}>Admin Note (logged to audit trail)</div>
          <textarea
            value={adminNote}
            onChange={(e) => setAdminNote(e.target.value)}
            placeholder="Reason for status change..."
            rows={2}
            style={{ width: "100%", padding: "0.375rem 0.5rem", fontSize: "0.8125rem", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", outline: "none", resize: "vertical", fontFamily: "inherit", boxSizing: "border-box" }}
          />
        </div>

        {/* Actions */}
        {p.status !== "active" && p.status !== "suspended" && (
          <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--border)", display: "flex", gap: "0.75rem" }}>
            <button
              onClick={() => updateStatus("active")}
              disabled={actioning}
              style={{ padding: "0.5rem 1.25rem", background: "#059669", color: "white", fontWeight: 700, fontSize: "0.8125rem", border: "none", borderRadius: "var(--radius-sm)", cursor: actioning ? "not-allowed" : "pointer" }}
            >
              {actioning ? "Processing..." : "✓ Approve"}
            </button>
            <button
              onClick={() => updateStatus("rejected")}
              disabled={actioning}
              style={{ padding: "0.5rem 1.25rem", background: "#DC2626", color: "white", fontWeight: 700, fontSize: "0.8125rem", border: "none", borderRadius: "var(--radius-sm)", cursor: actioning ? "not-allowed" : "pointer" }}
            >
              ✕ Reject
            </button>
          </div>
        )}

        {p.status === "active" && (
          <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--border)" }}>
            <button
              onClick={() => updateStatus("suspended")}
              disabled={actioning}
              style={{ padding: "0.5rem 1.25rem", background: "#F59E0B", color: "white", fontWeight: 700, fontSize: "0.8125rem", border: "none", borderRadius: "var(--radius-sm)", cursor: actioning ? "not-allowed" : "pointer" }}
            >
              Suspend
            </button>
          </div>
        )}

        {actionResult && (
          <div style={{ marginTop: "0.75rem", padding: "0.5rem", borderRadius: "var(--radius-sm)", fontSize: "0.75rem", fontWeight: 600, background: actionResult.startsWith("Error") ? "#FEE2E2" : "#D1FAE5", color: actionResult.startsWith("Error") ? "#DC2626" : "#065F46" }}>
            {actionResult}
          </div>
        )}
      </div>

      {/* Escrow deals */}
      <div style={{ background: "white", borderRadius: "var(--radius-xl)", padding: "1.25rem", border: "1px solid var(--border)" }}>
        <h2 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1rem", fontWeight: 700, color: "var(--midnight)", margin: "0 0 1rem 0" }}>
          Escrow Deals ({deals.length})
        </h2>
        {deals.length === 0 ? (
          <p style={{ fontSize: "0.8125rem", color: "#6B7280", margin: 0 }}>No deals yet.</p>
        ) : (
          <div>
            {deals.map((deal) => (
              <div key={deal.id} style={{ padding: "0.5rem 0", borderBottom: "1px solid var(--border)", fontSize: "0.8125rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 600, color: "var(--midnight)" }}>{deal.title}</div>
                    <div style={{ fontSize: "0.6875rem", color: "#6B7280" }}>{new Date(deal.created_at).toLocaleDateString()}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ padding: "0.125rem 0.5rem", borderRadius: "4px", fontSize: "0.6875rem", fontWeight: 600, background: deal.status === "active" ? "#FEF3C7" : deal.status === "completed" ? "#D1FAE5" : deal.status === "disputed" ? "#FEE2E2" : "#F3F4F6", color: deal.status === "active" ? "#92400E" : deal.status === "completed" ? "#065F46" : deal.status === "disputed" ? "#DC2626" : "#6B7280" }}>
                      {deal.status}
                    </span>
                    <div style={{ fontSize: "0.6875rem", color: "#6B7280", marginTop: "0.125rem" }}>₦{deal.total_amount_ngn.toLocaleString()}</div>
                  </div>
                </div>
                {deal.status === "disputed" && (
                  <div style={{ marginTop: "0.5rem", display: "flex", gap: "0.5rem" }}>
                    <button
                      onClick={() => resolveDispute(deal.id, "active")}
                      disabled={resolving === deal.id}
                      style={{ padding: "0.25rem 0.75rem", background: "var(--teal)", color: "var(--midnight)", fontWeight: 600, fontSize: "0.6875rem", border: "none", borderRadius: "var(--radius-sm)", cursor: resolving === deal.id ? "not-allowed" : "pointer" }}
                    >
                      {resolving === deal.id ? "..." : "Dismiss (reactivate)"}
                    </button>
                    <button
                      onClick={() => resolveDispute(deal.id, "refunded")}
                      disabled={resolving === deal.id}
                      style={{ padding: "0.25rem 0.75rem", background: "#F59E0B", color: "white", fontWeight: 600, fontSize: "0.6875rem", border: "none", borderRadius: "var(--radius-sm)", cursor: resolving === deal.id ? "not-allowed" : "pointer" }}
                    >
                      Refund
                    </button>
                    <button
                      onClick={() => resolveDispute(deal.id, "cancelled")}
                      disabled={resolving === deal.id}
                      style={{ padding: "0.25rem 0.75rem", background: "#DC2626", color: "white", fontWeight: 600, fontSize: "0.6875rem", border: "none", borderRadius: "var(--radius-sm)", cursor: resolving === deal.id ? "not-allowed" : "pointer" }}
                    >
                      Cancel deal
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
