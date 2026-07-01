"use client";
import { useState } from "react";

interface Milestone {
  id: string;
  title: string;
  description: string;
  pctOfTotal: number;
}

interface PartnerData {
  id: string; name: string; business_name: string | null;
  email: string; phone: string | null;
  partner_type: string; status: string;
  specialisations: string[]; destinations_served: string[];
  average_rating: number; total_reviews: number;
  total_escrow_volume_ngn: number; total_escrow_transactions: number;
  platform_fee_pct: number;
  years_in_operation: number | null;
  cac_number: string | null;
  professional_licence_number: string | null;
  created_at: string;
}

export default function AgentDetail({ partner, typeLabel }: { partner: PartnerData; typeLabel: string }) {
  const [showDealForm, setShowDealForm] = useState(false);
  const [dealTitle, setDealTitle] = useState("");
  const [dealDesc, setDealDesc] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [milestones, setMilestones] = useState<Milestone[]>([
    { id: "1", title: "Initial deposit", description: "Funds held in escrow", pctOfTotal: 100 },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message?: string; dealId?: string } | null>(null);

  function addMilestone() {
    const remaining = 100 - milestones.reduce((sum, m) => sum + m.pctOfTotal, 0);
    if (remaining <= 0) return;
    setMilestones([...milestones, { id: String(Date.now()), title: "", description: "", pctOfTotal: remaining }]);
  }

  function updateMilestone(id: string, field: keyof Milestone, value: string | number) {
    setMilestones(milestones.map((m) => (m.id === id ? { ...m, [field]: value } : m)));
  }

  function removeMilestone(id: string) {
    if (milestones.length <= 1) return;
    setMilestones(milestones.filter((m) => m.id !== id));
  }

  const totalPct = milestones.reduce((sum, m) => sum + m.pctOfTotal, 0);

  async function handleCreateDeal() {
    if (!dealTitle || !totalAmount || totalPct !== 100) return;
    setSubmitting(true);
    setResult(null);
    try {
      const res = await fetch("/api/escrow/create-deal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partnerId: partner.id,
          title: dealTitle,
          description: dealDesc,
          totalAmountNgn: parseInt(totalAmount),
          milestones: milestones.map((m) => ({
            title: m.title,
            description: m.description,
            pctOfTotal: m.pctOfTotal,
          })),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult({ success: true, message: "Deal created! Start depositing into your savings goal.", dealId: data.dealId });
      } else {
        setResult({ success: false, message: data.error || "Failed to create deal" });
      }
    } catch {
      setResult({ success: false, message: "Network error" });
    }
    setSubmitting(false);
  }

  return (
    <div>
      {/* Partner profile */}
      <div style={{ background: "white", borderRadius: "var(--radius-xl)", padding: "1.5rem", border: "1px solid var(--border)", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h1 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1.25rem", fontWeight: 800, color: "var(--midnight)", margin: "0 0 0.25rem 0" }}>
              {partner.business_name || partner.name}
            </h1>
            {partner.business_name && <p style={{ fontSize: "0.8125rem", color: "#6B7280", margin: "0 0 0.375rem 0" }}>{partner.name}</p>}
            <span style={{ display: "inline-block", padding: "0.125rem 0.5rem", background: "#D1FAE5", color: "#065F46", borderRadius: "4px", fontSize: "0.6875rem", fontWeight: 600 }}>
              {typeLabel}
            </span>
            <span style={{ display: "inline-block", marginLeft: "0.5rem", padding: "0.125rem 0.5rem", background: "#EFF6FF", color: "#1E40AF", borderRadius: "4px", fontSize: "0.6875rem", fontWeight: 600 }}>
              {partner.status === "active" ? "Verified ✓" : partner.status}
            </span>
          </div>
          {partner.average_rating > 0 && (
            <div style={{ textAlign: "right", fontSize: "0.8125rem", color: "#6B7280" }}>
              <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--midnight)" }}>★ {partner.average_rating.toFixed(1)}</div>
              <div>{partner.total_reviews} review{partner.total_reviews !== 1 ? "s" : ""}</div>
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: "1.5rem", marginTop: "1rem", flexWrap: "wrap", fontSize: "0.8125rem", color: "#6B7280" }}>
          <div><strong style={{ color: "#374151" }}>Email:</strong> {partner.email}</div>
          {partner.phone && <div><strong style={{ color: "#374151" }}>Phone:</strong> {partner.phone}</div>}
          {partner.years_in_operation && <div><strong style={{ color: "#374151" }}>Experience:</strong> {partner.years_in_operation} year{partner.years_in_operation !== 1 ? "s" : ""}</div>}
          <div><strong style={{ color: "#374151" }}>Deals:</strong> {partner.total_escrow_transactions}</div>
          <div><strong style={{ color: "#374151" }}>Volume:</strong> ₦{partner.total_escrow_volume_ngn.toLocaleString()}</div>
          <div><strong style={{ color: "#374151" }}>Fee:</strong> {partner.platform_fee_pct}%</div>
        </div>

        {partner.specialisations.length > 0 && (
          <div style={{ marginTop: "1rem" }}>
            <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#374151", marginBottom: "0.375rem" }}>Specialisations</div>
            <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap" }}>
              {partner.specialisations.map((s, i) => (
                <span key={i} style={{ padding: "0.25rem 0.5rem", background: "var(--off-white)", borderRadius: "4px", fontSize: "0.75rem", color: "#374151" }}>{s}</span>
              ))}
            </div>
          </div>
        )}

        {partner.destinations_served.length > 0 && (
          <div style={{ marginTop: "0.75rem" }}>
            <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#374151", marginBottom: "0.375rem" }}>Destinations Served</div>
            <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap" }}>
              {partner.destinations_served.map((d, i) => (
                <span key={i} style={{ padding: "0.25rem 0.5rem", background: "#EFF6FF", color: "#1E40AF", borderRadius: "4px", fontSize: "0.75rem", fontWeight: 600 }}>{d}</span>
              ))}
            </div>
          </div>
        )}

        {partner.cac_number && (
          <div style={{ marginTop: "0.5rem", fontSize: "0.75rem", color: "#9CA3AF" }}>
            CAC: {partner.cac_number}
            {partner.professional_licence_number && ` · Licence: ${partner.professional_licence_number}`}
          </div>
        )}
      </div>

      {/* Escrow deal form */}
      {!showDealForm ? (
        <button onClick={() => setShowDealForm(true)} style={{ width: "100%", padding: "0.875rem", background: "var(--teal)", color: "var(--midnight)", fontWeight: 700, fontSize: "0.9375rem", border: "none", borderRadius: "var(--radius-md)", cursor: "pointer" }}>
          Work with this agent — Create Escrow Deal
        </button>
      ) : (
        <div style={{ background: "white", borderRadius: "var(--radius-xl)", padding: "1.5rem", border: "1px solid var(--border)" }}>
          <h2 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1.125rem", fontWeight: 700, color: "var(--midnight)", margin: "0 0 1rem 0" }}>
            Create Escrow Deal with {partner.business_name || partner.name}
          </h2>

          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "#374151", marginBottom: "0.375rem" }}>Deal Title *</label>
            <input value={dealTitle} onChange={(e) => setDealTitle(e.target.value)} placeholder="e.g. UK Skilled Worker Visa Processing" style={{ width: "100%", padding: "0.5rem 0.625rem", fontSize: "0.8125rem", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", outline: "none", boxSizing: "border-box" }} />
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "#374151", marginBottom: "0.375rem" }}>Description</label>
            <textarea value={dealDesc} onChange={(e) => setDealDesc(e.target.value)} rows={3} placeholder="Describe the scope of work..." style={{ width: "100%", padding: "0.5rem 0.625rem", fontSize: "0.8125rem", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", outline: "none", resize: "vertical", boxSizing: "border-box" }} />
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "#374151", marginBottom: "0.375rem" }}>Total Amount (₦) *</label>
            <input type="number" min="1000" value={totalAmount} onChange={(e) => setTotalAmount(e.target.value)} placeholder="e.g. 500000" style={{ width: "100%", padding: "0.5rem 0.625rem", fontSize: "0.8125rem", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", outline: "none", boxSizing: "border-box" }} />
          </div>

          {/* Milestones */}
          <div style={{ marginBottom: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
              <label style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#374151" }}>Milestones</label>
              <button type="button" onClick={addMilestone} disabled={totalPct >= 100} style={{ padding: "0.25rem 0.75rem", background: totalPct >= 100 ? "#9CA3AF" : "var(--teal)", color: "var(--midnight)", fontWeight: 600, fontSize: "0.75rem", border: "none", borderRadius: "var(--radius-sm)", cursor: totalPct >= 100 ? "not-allowed" : "pointer" }}>
                + Add milestone
              </button>
            </div>
            <div style={{ fontSize: "0.75rem", color: totalPct === 100 ? "var(--teal)" : "#DC2626", marginBottom: "0.5rem" }}>
              Allocation: {totalPct}% {totalPct !== 100 ? `— must equal 100%` : "✓"}
            </div>

            {milestones.map((m, idx) => {
              const amountNgn = Math.round((m.pctOfTotal / 100) * (parseInt(totalAmount) || 0));
              return (
                <div key={m.id} style={{ padding: "0.75rem", background: "var(--off-white)", borderRadius: "var(--radius-md)", marginBottom: "0.5rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.375rem" }}>
                    <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--midnight)" }}>Milestone {idx + 1}</span>
                    {milestones.length > 1 && (
                      <button type="button" onClick={() => removeMilestone(m.id)} style={{ background: "none", border: "none", color: "#DC2626", fontSize: "0.75rem", cursor: "pointer", fontWeight: 600 }}>
                        Remove
                      </button>
                    )}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "0.375rem" }}>
                    <div>
                      <input value={m.title} onChange={(e) => updateMilestone(m.id, "title", e.target.value)} placeholder="Title" style={{ width: "100%", padding: "0.375rem 0.5rem", fontSize: "0.75rem", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", outline: "none", boxSizing: "border-box" }} />
                    </div>
                    <div>
                      <div style={{ display: "flex", gap: "0.375rem", alignItems: "center" }}>
                        <input type="number" min="1" max={100 - (milestones.reduce((s, m2) => s + (m2.id !== m.id ? m2.pctOfTotal : 0), 0))} value={m.pctOfTotal} onChange={(e) => updateMilestone(m.id, "pctOfTotal", parseInt(e.target.value) || 0)} style={{ width: "60px", padding: "0.375rem 0.5rem", fontSize: "0.75rem", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", outline: "none" }} />
                        <span style={{ fontSize: "0.75rem", color: "#6B7280" }}>% = ₦{amountNgn.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  <input value={m.description} onChange={(e) => updateMilestone(m.id, "description", e.target.value)} placeholder="Description (what defines completion)" style={{ width: "100%", padding: "0.375rem 0.5rem", fontSize: "0.75rem", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", outline: "none", boxSizing: "border-box" }} />
                </div>
              );
            })}
          </div>

          {result && (
            <div style={{ padding: "0.75rem", borderRadius: "var(--radius-md)", marginBottom: "1rem", fontSize: "0.8125rem", fontWeight: 600, background: result.success ? "#D1FAE5" : "#FEE2E2", color: result.success ? "#065F46" : "#DC2626" }}>
              {result.success ? (
                <>
                  {result.message}
                  {result.dealId && (
                    <a href={`/dashboard/goals`} style={{ display: "inline-block", marginLeft: "0.5rem", color: "var(--teal)", fontWeight: 700, textDecoration: "underline" }}>
                      View my goals →
                    </a>
                  )}
                </>
              ) : result.message}
            </div>
          )}

          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button onClick={handleCreateDeal} disabled={!dealTitle || !totalAmount || totalPct !== 100 || submitting} style={{ flex: 1, padding: "0.625rem 1.25rem", background: !dealTitle || !totalAmount || totalPct !== 100 ? "#9CA3AF" : "var(--teal)", color: "var(--midnight)", fontWeight: 700, fontSize: "0.8125rem", borderRadius: "var(--radius-md)", border: "none", cursor: !dealTitle || !totalAmount || totalPct !== 100 ? "not-allowed" : "pointer" }}>
              {submitting ? "Creating..." : "Create Escrow Deal"}
            </button>
            <button onClick={() => { setShowDealForm(false); setResult(null); }} style={{ padding: "0.625rem 1.25rem", background: "var(--off-white)", color: "#374151", fontWeight: 600, fontSize: "0.8125rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", cursor: "pointer" }}>
              Cancel
            </button>
          </div>

          <div style={{ marginTop: "1rem", padding: "0.75rem", background: "#FFF7ED", borderRadius: "var(--radius-md)", fontSize: "0.75rem", color: "#9A3412" }}>
            <strong>How it works:</strong> Your funds are held in a locked savings goal. Milestone payments are released to the agent as each stage is completed and confirmed.
          </div>
        </div>
      )}
    </div>
  );
}
