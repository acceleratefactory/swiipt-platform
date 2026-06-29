"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface Props {
  goalId: string;
  targetAmount: number;
  currentBalance: number;
}

type Step = "amount" | "instructions" | "pending";

export default function TradeShowGroupPaymentModal({ goalId, targetAmount, currentBalance }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState<Step>("amount");
  const [amount, setAmount] = useState(String(targetAmount - currentBalance));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [depositData, setDepositData] = useState<{
    depositId: string;
    reference: string;
    amount: number;
    currency: string;
    bankDetails: Record<string, string>;
  } | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const remaining = Math.max(0, targetAmount - currentBalance);

  useEffect(() => {
    if (!showModal) return;
    async function checkPending() {
      const res = await fetch(`/api/goals/deposit/initiate?goalId=${goalId}`);
      const data = await res.json();
      if (data?.hasPending) {
        setDepositData({
          depositId: data.depositId,
          reference: data.reference,
          amount: data.amount,
          currency: data.currency || "NGN",
          bankDetails: data.bankDetails,
        });
        setAmount(data.amount?.toString() || "0");
        setStep("instructions");
      }
    }
    checkPending();
  }, [showModal, goalId]);

  useEffect(() => {
    if (!showModal || step !== "pending" || !depositData || confirmed) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`ts-deposit-${depositData.depositId}`)
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "deposits",
        filter: `id=eq.${depositData.depositId}`,
      }, (payload: any) => {
        if (payload.new?.status === "confirmed" && !confirmed) {
          setConfirmed(true);
          setTimeout(() => window.location.reload(), 800);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [showModal, step, depositData?.depositId, confirmed]);

  useEffect(() => {
    if (!showModal || step !== "pending" || !depositData || confirmed) return;
    const supabase = createClient();
    const interval = setInterval(async () => {
      const { data } = await supabase
        .from("deposits")
        .select("status")
        .eq("id", depositData.depositId)
        .single();
      if (data?.status === "confirmed" && !confirmed) {
        setConfirmed(true);
        setTimeout(() => window.location.reload(), 800);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [showModal, step, depositData?.depositId, confirmed]);

  async function handleGetDetails() {
    setLoading(true);
    setError("");
    const amt = parseFloat(amount);
    if (!amt || amt < 1000) {
      setError("Minimum deposit is ₦1,000");
      setLoading(false);
      return;
    }
    const res = await fetch("/api/goals/deposit/initiate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ goalId, amount: amt, currency: "NGN" }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error || "Failed"); setLoading(false); return; }
    setDepositData({
      depositId: data.depositId,
      reference: data.reference,
      amount: data.amount,
      currency: data.currency || "NGN",
      bankDetails: data.bankDetails,
    });
    setStep(data.resumed ? "instructions" : "instructions");
    setLoading(false);
  }

  async function handleConfirmSent() {
    if (!depositData) return;
    setLoading(true);
    try {
      const supabase = createClient();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      await supabase
        .from("deposits")
        .update({
          user_confirmed_at: new Date().toISOString(),
          expires_at: expiresAt,
        })
        .eq("id", depositData.depositId);
      setStep("pending");
    } catch {
      setError("Failed to confirm. Please try again.");
    }
    setLoading(false);
  }

  function handleClose() {
    if (step === "pending" && !confirmed) return;
    setShowModal(false);
    setTimeout(() => {
      setStep("amount");
      setAmount(String(remaining));
      setDepositData(null);
      setConfirmed(false);
      setError("");
    }, 200);
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        style={{
          display: "inline-block",
          padding: "0.5rem 1rem",
          background: "var(--teal)",
          color: "var(--midnight)",
          fontWeight: 700,
          fontSize: "0.8125rem",
          borderRadius: "var(--radius-sm)",
          border: "none",
          cursor: "pointer",
        }}
      >
        Start saving my share →
      </button>

      {showModal && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 1000,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(0,0,0,0.5)",
          }}
          onClick={() => { if (step !== "pending") handleClose(); }}
        >
          <div
            style={{
              background: "white",
              borderRadius: "var(--radius-xl)",
              padding: "2rem",
              width: "100%",
              maxWidth: "480px",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h2 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1.125rem", fontWeight: 800, color: "var(--midnight)" }}>
                {step === "pending" ? "Payment pending" : "Deposit to savings goal"}
              </h2>
              {step !== "pending" && (
                <button onClick={handleClose} style={{ background: "none", border: "none", fontSize: "1.25rem", cursor: "pointer", color: "var(--text-muted)", padding: "0.25rem" }}>
                  ✕
                </button>
              )}
            </div>

            {step === "amount" && (
              <div>
                <div style={{ background: "var(--off-white)", borderRadius: "var(--radius-lg)", padding: "1rem", marginBottom: "1rem" }}>
                  <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>Your savings progress</p>
                  <p style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--midnight)" }}>
                    ₦{currentBalance.toLocaleString()} / ₦{targetAmount.toLocaleString()}
                  </p>
                  {remaining > 0 && (
                    <p style={{ fontSize: "0.75rem", color: "var(--teal)", fontWeight: 600, marginTop: "0.25rem" }}>
                      ₦{remaining.toLocaleString()} remaining to fully fund
                    </p>
                  )}
                </div>

                <div style={{ marginBottom: "1rem" }}>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.375rem" }}>
                    Amount to deposit (NGN)
                  </label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    min={1000}
                    placeholder="Minimum ₦1,000"
                    style={{ width: "100%", padding: "0.625rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", fontSize: "0.875rem" }}
                  />
                  <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>Minimum ₦1,000</p>
                </div>

                {error && <p style={{ color: "var(--danger)", fontSize: "0.8125rem", marginBottom: "1rem" }}>{error}</p>}

                <button
                  onClick={handleGetDetails}
                  disabled={loading}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    background: "var(--midnight)",
                    color: "white",
                    fontWeight: 700,
                    fontSize: "0.9375rem",
                    borderRadius: "var(--radius-md)",
                    border: "none",
                    cursor: loading ? "not-allowed" : "pointer",
                    opacity: loading ? 0.6 : 1,
                  }}
                >
                  {loading ? "Loading..." : "Get payment details →"}
                </button>
              </div>
            )}

            {step === "instructions" && depositData && (
              <div>
                <div style={{ background: "var(--off-white)", borderRadius: "var(--radius-lg)", padding: "1rem", marginBottom: "1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Amount to transfer</span>
                    <span style={{ fontSize: "1rem", fontWeight: 800, color: "var(--teal)" }}>
                      ₦{depositData.amount.toLocaleString()}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Bank</span>
                    <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--midnight)" }}>
                      {depositData.bankDetails.bank_name || "Swiipt Bank Account"}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Account number</span>
                    <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--midnight)" }}>
                      {depositData.bankDetails.bank_account_number || "—"}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Account name</span>
                    <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--midnight)" }}>
                      {depositData.bankDetails.bank_account_name || "—"}
                    </span>
                  </div>
                </div>

                <div style={{ background: "var(--midnight)", borderRadius: "var(--radius-lg)", padding: "1rem", marginBottom: "0.75rem" }}>
                  <p style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.5)", marginBottom: "0.25rem" }}>Your payment reference</p>
                  <p style={{ fontSize: "1rem", fontWeight: 800, color: "var(--teal)", fontFamily: "monospace", letterSpacing: 1 }}>
                    {depositData.reference}
                  </p>
                  <button
                    onClick={() => navigator.clipboard.writeText(depositData.reference)}
                    style={{ marginTop: "0.375rem", padding: "0.25rem 0.75rem", background: "rgba(255,255,255,0.1)", color: "white", fontWeight: 600, fontSize: "0.7rem", borderRadius: "var(--radius-sm)", border: "none", cursor: "pointer" }}
                  >
                    Copy reference
                  </button>
                </div>

                <div style={{ background: "rgba(255,183,0,0.12)", border: "1px solid rgba(255,183,0,0.3)", borderRadius: "var(--radius-lg)", padding: "0.75rem", marginBottom: "1rem" }}>
                  <p style={{ fontSize: "0.75rem", color: "var(--midnight)", fontWeight: 600 }}>
                    ⚠️ You MUST include this reference in your transfer narration. Without it, we cannot identify your payment.
                  </p>
                </div>

                {error && <p style={{ color: "var(--danger)", fontSize: "0.8125rem", marginBottom: "1rem" }}>{error}</p>}

                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  <button
                    onClick={handleConfirmSent}
                    disabled={loading}
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      background: "var(--teal)",
                      color: "var(--midnight)",
                      fontWeight: 700,
                      fontSize: "0.9375rem",
                      borderRadius: "var(--radius-md)",
                      border: "none",
                      cursor: loading ? "not-allowed" : "pointer",
                      opacity: loading ? 0.6 : 1,
                    }}
                  >
                    {loading ? "Confirming..." : "I Have Sent the Money ✓"}
                  </button>
                  <button
                    onClick={() => { setStep("amount"); setError(""); }}
                    disabled={loading}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--text-muted)",
                      fontWeight: 600,
                      fontSize: "0.8125rem",
                      cursor: loading ? "not-allowed" : "pointer",
                      textDecoration: "underline",
                    }}
                  >
                    ← Change amount
                  </button>
                </div>
              </div>
            )}

            {step === "pending" && (
              <div style={{ textAlign: "center", padding: "1rem 0" }}>
                <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>⏱</div>
                <h3 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1rem", fontWeight: 700, color: "var(--midnight)", marginBottom: "0.5rem" }}>
                  Payment pending confirmation
                </h3>
                <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", lineHeight: 1.5, marginBottom: "1rem" }}>
                  We will confirm your transfer and update your balance within 1–4 business hours.
                  You will receive a notification once confirmed.
                </p>
                {depositData && (
                  <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    Reference: <strong style={{ color: "var(--midnight)" }}>{depositData.reference}</strong>
                  </p>
                )}
                {confirmed && (
                  <p style={{ fontSize: "0.875rem", color: "var(--teal)", fontWeight: 700, marginTop: "0.75rem" }}>
                    ✅ Confirmed! Refreshing...
                  </p>
                )}
                {!confirmed && (
                  <button
                    onClick={handleClose}
                    style={{
                      marginTop: "1rem",
                      padding: "0.5rem 1.5rem",
                      background: "var(--gray-100)",
                      color: "var(--text-secondary)",
                      fontWeight: 600,
                      fontSize: "0.875rem",
                      borderRadius: "var(--radius-md)",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    Back to group
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
