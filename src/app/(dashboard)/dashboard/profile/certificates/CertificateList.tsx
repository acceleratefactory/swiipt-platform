"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface Certificate {
  id: string; certificate_type: string; certificate_number: string;
  data_snapshot: Record<string, unknown>; is_valid: boolean;
  expires_at: string; issued_at: string; verification_url: string;
  fee_deposit_id: string | null;
}

interface Goal {
  id: string; goal_name: string; current_balance: number;
  target_amount: number; destination: string | null;
}

interface Deposit {
  id: string; amount: number; created_at: string;
}

export default function CertificateList({
  certificates, eligibleGoals, confirmedDeposits, userId,
}: {
  certificates: Certificate[];
  eligibleGoals: Goal[];
  confirmedDeposits: Deposit[];
  userId: string;
}) {
  const [showRequest, setShowRequest] = useState(false);
  const [liveCerts, setLiveCerts] = useState(certificates);

  useEffect(() => {
    setLiveCerts(certificates);
  }, [certificates]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("certificates_live")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "platform_certificates",
        filter: `user_id=eq.${userId}`,
      }, () => {
        window.location.reload();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId]);
  const [certType, setCertType] = useState<"proof_of_funds" | "trust_certificate">("proof_of_funds");
  const [selectedGoalId, setSelectedGoalId] = useState("");
  const [selectedDepositId, setSelectedDepositId] = useState("");
  const [requesting, setRequesting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const feeAmount = certType === "proof_of_funds" ? 15000 : 10000;

  async function handleRequest() {
    if (certType === "proof_of_funds" && !selectedGoalId) return;
    if (!selectedDepositId) return;
    setRequesting(true);
    setResult(null);
    try {
      const endpoint = certType === "proof_of_funds"
        ? "/api/certificates/proof-of-funds"
        : "/api/certificates/trust";
      const body: Record<string, string> = { feeDepositId: selectedDepositId };
      if (certType === "proof_of_funds") body.goalId = selectedGoalId;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        setResult({ success: true, message: `Certificate issued: ${data.certificate.certificate_number}` });
        setShowRequest(false);
      } else {
        setResult({ success: false, message: data.error || "Request failed" });
      }
    } catch {
      setResult({ success: false, message: "Network error" });
    }
    setRequesting(false);
  }

  return (
    <div>
      {/* Existing certificates */}
      {liveCerts.length === 0 ? (
        <div style={{ padding: "2rem", background: "white", borderRadius: "var(--radius-xl)", border: "1px solid var(--border)", textAlign: "center", marginBottom: "1.5rem" }}>
          <p style={{ fontSize: "0.875rem", color: "#6B7280", margin: 0 }}>No certificates yet.</p>
        </div>
      ) : (
        <div style={{ marginBottom: "1.5rem" }}>
          {liveCerts.map((cert) => {
            const isExpired = !cert.is_valid || new Date(cert.expires_at) < new Date();
            const data = cert.data_snapshot as Record<string, unknown>;
            return (
              <div key={cert.id} style={{ background: "white", borderRadius: "var(--radius-xl)", padding: "1.25rem", border: "1px solid var(--border)", marginBottom: "0.75rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.75rem" }}>
                  <div>
                    <h3 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1rem", fontWeight: 700, color: "var(--midnight)", margin: "0 0 0.25rem 0" }}>
                      {cert.certificate_type === "proof_of_funds" ? "Proof of Funds" : "Trust Certificate"}
                    </h3>
                    <p style={{ fontSize: "0.75rem", color: "#6B7280", margin: "0 0 0.5rem 0", fontFamily: "monospace" }}>
                      {cert.certificate_number}
                    </p>
                    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", fontSize: "0.75rem", color: "#374151" }}>
                      <span>Issued: {new Date(cert.issued_at).toLocaleDateString()}</span>
                      <span>Expires: {new Date(cert.expires_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                    <span style={{
                      padding: "2px 8px", borderRadius: "4px", fontSize: "0.6875rem", fontWeight: 600,
                      background: isExpired ? "#FEE2E2" : "var(--teal)",
                      color: isExpired ? "#DC2626" : "white",
                    }}>
                      {isExpired ? "Expired" : "Valid"}
                    </span>
                    <a href={cert.verification_url} target="_blank" rel="noopener noreferrer" style={{ padding: "0.375rem 0.75rem", background: "var(--off-white)", color: "var(--midnight)", fontWeight: 600, fontSize: "0.75rem", borderRadius: "var(--radius-sm)", textDecoration: "none", border: "1px solid var(--border)" }}>
                      Verify
                    </a>
                    <a href={`/api/certificates/${cert.certificate_number}/download`} style={{ padding: "0.375rem 0.75rem", background: "var(--teal)", color: "var(--midnight)", fontWeight: 600, fontSize: "0.75rem", borderRadius: "var(--radius-sm)", textDecoration: "none" }}>
                      Download PDF
                    </a>
                  </div>
                </div>
                {cert.certificate_type === "proof_of_funds" && (
                  <div style={{ marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px solid var(--border)", fontSize: "0.75rem", color: "#6B7280" }}>
                    Goal: {data.goal_name as string} · Balance: ₦{(data.current_balance_ngn as number || 0).toLocaleString()}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Request new certificate */}
      {!showRequest ? (
        <button
          onClick={() => setShowRequest(true)}
          style={{ padding: "0.75rem 1.5rem", background: "var(--teal)", color: "var(--midnight)", fontWeight: 700, fontSize: "0.875rem", borderRadius: "var(--radius-md)", border: "none", cursor: "pointer" }}
        >
          + Request New Certificate
        </button>
      ) : (
        <div style={{ background: "white", borderRadius: "var(--radius-xl)", padding: "1.5rem", border: "1px solid var(--border)", marginBottom: "1.5rem" }}>
          <h3 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1rem", fontWeight: 700, color: "var(--midnight)", margin: "0 0 1rem 0" }}>Request Certificate</h3>

          {/* Certificate type selector */}
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "#374151", marginBottom: "0.375rem" }}>Certificate Type</label>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                onClick={() => { setCertType("proof_of_funds"); setSelectedGoalId(""); }}
                style={{
                  flex: 1, padding: "0.5rem", fontSize: "0.8125rem", fontWeight: 700, cursor: "pointer",
                  border: certType === "proof_of_funds" ? "2px solid var(--teal)" : "1px solid var(--border)",
                  borderRadius: "var(--radius-sm)", background: certType === "proof_of_funds" ? "#D1FAE5" : "white",
                  color: "var(--midnight)",
                }}
              >
                Proof of Funds
                <div style={{ fontSize: "0.6875rem", fontWeight: 400, color: "#6B7280", marginTop: "0.125rem" }}>₦15,000 · 30-day validity</div>
              </button>
              <button
                onClick={() => { setCertType("trust_certificate"); setSelectedGoalId(""); }}
                style={{
                  flex: 1, padding: "0.5rem", fontSize: "0.8125rem", fontWeight: 700, cursor: "pointer",
                  border: certType === "trust_certificate" ? "2px solid var(--teal)" : "1px solid var(--border)",
                  borderRadius: "var(--radius-sm)", background: certType === "trust_certificate" ? "#D1FAE5" : "white",
                  color: "var(--midnight)",
                }}
              >
                Trust Certificate
                <div style={{ fontSize: "0.6875rem", fontWeight: 400, color: "#6B7280", marginTop: "0.125rem" }}>₦10,000 · 90-day validity</div>
              </button>
            </div>
          </div>

          {certType === "proof_of_funds" && eligibleGoals.length === 0 ? (
            <p style={{ fontSize: "0.8125rem", color: "#DC2626", marginBottom: "1rem" }}>
              No eligible goals found. You need an active goal with at least ₦50,000 balance.
            </p>
          ) : (
            <>
              {certType === "proof_of_funds" && (
                <div style={{ marginBottom: "1rem" }}>
                  <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "#374151", marginBottom: "0.375rem" }}>Select Goal</label>
                  <select
                    value={selectedGoalId}
                    onChange={(e) => setSelectedGoalId(e.target.value)}
                    style={{ width: "100%", padding: "0.5rem 0.625rem", fontSize: "0.8125rem", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", background: "white", outline: "none" }}
                  >
                    <option value="">Select a goal...</option>
                    {eligibleGoals.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.goal_name} — ₦{g.current_balance.toLocaleString()} {g.destination ? `(${g.destination})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "#374151", marginBottom: "0.375rem" }}>
                  Fee Payment (₦{feeAmount.toLocaleString()}) — Select a confirmed deposit
                </label>
                {confirmedDeposits.length === 0 ? (
                  <p style={{ fontSize: "0.75rem", color: "#6B7280" }}>
                    No confirmed deposits found. Make a deposit of ₦{feeAmount.toLocaleString()}+ from your goal page first.
                  </p>
                ) : (
                  <select
                    value={selectedDepositId}
                    onChange={(e) => setSelectedDepositId(e.target.value)}
                    style={{ width: "100%", padding: "0.5rem 0.625rem", fontSize: "0.8125rem", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", background: "white", outline: "none" }}
                  >
                    <option value="">Select a deposit...</option>
                    {confirmedDeposits.filter((d) => d.amount >= feeAmount).map((d) => (
                      <option key={d.id} value={d.id}>
                        ₦{d.amount.toLocaleString()} — {new Date(d.created_at).toLocaleDateString()}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {result && (
                <div style={{ padding: "0.75rem", borderRadius: "var(--radius-md)", marginBottom: "1rem", fontSize: "0.8125rem", fontWeight: 600, background: result.success ? "#D1FAE5" : "#FEE2E2", color: result.success ? "#065F46" : "#DC2626" }}>
                  {result.message}
                </div>
              )}

              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button
                  onClick={handleRequest}
                  disabled={(certType === "proof_of_funds" && !selectedGoalId) || !selectedDepositId || requesting}
                  style={{ padding: "0.625rem 1.25rem", background: (certType === "proof_of_funds" && !selectedGoalId) || !selectedDepositId ? "#9CA3AF" : "var(--teal)", color: "var(--midnight)", fontWeight: 700, fontSize: "0.8125rem", borderRadius: "var(--radius-md)", border: "none", cursor: (certType === "proof_of_funds" && !selectedGoalId) || !selectedDepositId ? "not-allowed" : "pointer" }}
                >
                  {requesting ? "Requesting..." : "Issue Certificate"}
                </button>
                <button onClick={() => { setShowRequest(false); setResult(null); }} style={{ padding: "0.625rem 1.25rem", background: "var(--off-white)", color: "#374151", fontWeight: 600, fontSize: "0.8125rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", cursor: "pointer" }}>
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Info box */}
      <div style={{ padding: "1rem", background: "#EFF6FF", borderRadius: "var(--radius-md)", marginTop: "1.5rem", fontSize: "0.8125rem", color: "#1E40AF", lineHeight: 1.6 }}>
        <strong>About Certificates</strong><br />
        Proof of Funds certificates (₦15,000) require an active goal with ≥₦50K balance and are valid for 30 days. Trust Certificates (₦10,000) use your platform financial profile and are valid for 90 days. All fees must be paid via a confirmed deposit.
      </div>
    </div>
  );
}
