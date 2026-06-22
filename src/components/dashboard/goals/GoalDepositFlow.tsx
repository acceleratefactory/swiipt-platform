"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { X } from "lucide-react";

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.875rem",
  fontWeight: 600,
  color: "var(--text-primary)",
  marginBottom: "0.375rem",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.75rem 1rem",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-md)",
  fontSize: "0.9375rem",
  color: "var(--text-primary)",
  outline: "none",
  transition: "border-color 0.15s",
};

type DepositStep = "amount" | "instructions" | "pending" | "resume";

export default function GoalDepositFlow({
  goal,
  onClose,
}: {
  goal: { id: string; currency: string };
  onClose: () => void;
}) {
  const [step, setStep] = useState<DepositStep>("amount");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState(goal.currency);
  const [depositData, setDepositData] = useState<{
    depositId: string;
    reference: string;
    amount: number;
    currency: string;
    bankDetails: Record<string, string>;
    resumed?: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Check for existing pending deposits on mount
  useEffect(() => {
    async function checkPending() {
      try {
        const res = await fetch(`/api/goals/deposit/initiate?goalId=${goal.id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.hasPending) {
            setDepositData({
              depositId: data.depositId,
              reference: data.reference,
              amount: data.amount,
              currency: data.currency,
              bankDetails: data.bankDetails,
              resumed: true,
            });
            setStep("resume");
          }
        }
      } catch {
        // Silently fail — user can initiate new deposit
      }
    }
    checkPending();
  }, [goal.id]);

  return (
    <>
      {step === "resume" && depositData && (
        <div
          style={{
            background: "white",
            borderRadius: "var(--radius-lg)",
            padding: "1.5rem",
            border: "1px solid var(--border)",
            marginBottom: "1rem",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1.5rem",
            }}
          >
            <h3
              style={{
                fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif",
                fontSize: "1rem",
                fontWeight: 700,
                color: "var(--midnight)",
              }}
            >
              Resume pending deposit
            </h3>
            <button
              onClick={onClose}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--text-muted)",
              }}
            >
              <X size={20} />
            </button>
          </div>

          <div
            style={{
              background: "var(--teal-pale)",
              border: "1px solid var(--teal)",
              borderRadius: "var(--radius-md)",
              padding: "0.875rem",
              marginBottom: "1.25rem",
              display: "flex",
              gap: "0.625rem",
            }}
          >
            <span>&#x2139;&#xFE0F;</span>
            <p style={{ fontSize: "0.8125rem", color: "var(--midnight)", lineHeight: 1.5 }}>
              You have a pending deposit that was not yet confirmed. You can continue where you
              left off or cancel it to start a new deposit.
            </p>
          </div>

          <div
            style={{
              background: "var(--off-white)",
              borderRadius: "var(--radius-md)",
              padding: "1.25rem",
              marginBottom: "1rem",
            }}
          >
            {[
              { label: "Amount", value: `${depositData.currency} ${Number(depositData.amount).toLocaleString()}` },
              { label: "Reference", value: depositData.reference },
              { label: "Bank", value: depositData.bankDetails.bank_name || "Swiipt Bank Account" },
              { label: "Account number", value: depositData.bankDetails.bank_account_number || "\u2014" },
              { label: "Account name", value: depositData.bankDetails.bank_account_name || "\u2014" },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "0.5rem 0",
                  borderBottom: "1px solid var(--gray-100)",
                }}
              >
                <span style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>{item.label}</span>
                <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--midnight)" }}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button
              onClick={async () => {
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
              }}
              style={{
                flex: 1,
                padding: "0.875rem",
                background: "var(--teal)",
                color: "var(--midnight)",
                fontWeight: 700,
                fontSize: "1rem",
                borderRadius: "var(--radius-md)",
                border: "none",
                cursor: "pointer",
              }}
            >
              I Have Sent the Money \u2713
            </button>
            <button
              onClick={async () => {
                // Cancel the old pending deposit and start fresh
                const supabase = createClient();
                await supabase
                  .from("deposits")
                  .update({ status: "cancelled" })
                  .eq("id", depositData.depositId);
                setDepositData(null);
                setStep("amount");
              }}
              style={{
                padding: "0.875rem",
                background: "none",
                color: "var(--danger)",
                fontWeight: 600,
                fontSize: "0.875rem",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--danger)",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              Cancel & start new
            </button>
          </div>
        </div>
      )}

      {step === "amount" && (
        <div
          style={{
            background: "white",
            borderRadius: "var(--radius-lg)",
            padding: "1.5rem",
            border: "1px solid var(--border)",
            marginBottom: "1rem",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1.5rem",
            }}
          >
            <h3
              style={{
                fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif",
                fontSize: "1rem",
                fontWeight: 700,
                color: "var(--midnight)",
              }}
            >
              Add funds
            </h3>
            <button
              onClick={onClose}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--text-muted)",
              }}
            >
              <X size={20} />
            </button>
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label style={labelStyle}>Currency</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              style={{ ...inputStyle, cursor: "pointer" }}
            >
              {["NGN", "USD", "AED", "QAR", "GBP", "CAD", "EUR"].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <label style={labelStyle}>Amount</label>
            <div style={{ position: "relative" }}>
              <span
                style={{
                  position: "absolute",
                  left: "1rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-muted)",
                  fontSize: "0.9375rem",
                }}
              >
                {currency}
              </span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                min="1000"
                style={{ ...inputStyle, paddingLeft: currency.length > 3 ? "3.5rem" : "3rem" }}
              />
            </div>
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.375rem" }}>
              Minimum: {currency} 1,000
            </p>
          </div>

          {error && (
            <div
              style={{
                background: "#FEF2F2",
                border: "1px solid #FECACA",
                borderRadius: "var(--radius-md)",
                padding: "0.75rem",
                fontSize: "0.875rem",
                color: "var(--danger)",
                marginBottom: "1rem",
              }}
            >
              {error}
            </div>
          )}

          <button
            disabled={!amount || Number(amount) < 1000 || loading}
            onClick={async () => {
              setLoading(true);
              setError("");
              const res = await fetch("/api/goals/deposit/initiate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  goalId: goal.id,
                  amount: Number(amount),
                  currency,
                }),
              });
              const data = await res.json();
              if (!res.ok) {
                setError(data.error);
                setLoading(false);
                return;
              }
              setDepositData(data);
              setStep(data.resumed ? "resume" : "instructions");
              setLoading(false);
            }}
            style={{
              width: "100%",
              padding: "0.875rem",
              background: !amount || Number(amount) < 1000 ? "var(--gray-100)" : "var(--teal)",
              color: !amount || Number(amount) < 1000 ? "var(--text-muted)" : "var(--midnight)",
              fontWeight: 700,
              fontSize: "1rem",
              borderRadius: "var(--radius-md)",
              border: "none",
              cursor: !amount || Number(amount) < 1000 ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Generating reference..." : "Get payment details \u2192"}
          </button>
        </div>
      )}

      {step === "instructions" && depositData && (
        <div
          style={{
            background: "white",
            borderRadius: "var(--radius-lg)",
            padding: "1.5rem",
            border: "1px solid var(--border)",
            marginBottom: "1rem",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1.5rem" }}>
            <h3
              style={{
                fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif",
                fontSize: "1rem",
                fontWeight: 700,
                color: "var(--midnight)",
              }}
            >
              Transfer details
            </h3>
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
              <X size={20} />
            </button>
          </div>

          <div
            style={{
              background: "var(--off-white)",
              borderRadius: "var(--radius-md)",
              padding: "1.25rem",
              marginBottom: "1rem",
            }}
          >
            {[
              { label: "Amount", value: `${depositData.currency} ${Number(amount).toLocaleString()}` },
              { label: "Bank", value: depositData.bankDetails.bank_name || "Swiipt Bank Account" },
              { label: "Account number", value: depositData.bankDetails.bank_account_number || "\u2014" },
              { label: "Account name", value: depositData.bankDetails.bank_account_name || "\u2014" },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "0.5rem 0",
                  borderBottom: "1px solid var(--gray-100)",
                }}
              >
                <span style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>{item.label}</span>
                <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--midnight)" }}>{item.value}</span>
              </div>
            ))}
          </div>

          <div
            style={{
              background: "var(--midnight)",
              borderRadius: "var(--radius-md)",
              padding: "1.25rem",
              marginBottom: "1.25rem",
            }}
          >
            <p style={{ fontSize: "0.75rem", color: "var(--gray-500)", marginBottom: "0.375rem" }}>
              Payment reference
            </p>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem" }}>
              <p
                style={{
                  fontSize: "1.25rem",
                  fontWeight: 800,
                  color: "var(--teal)",
                  fontFamily: "monospace",
                  letterSpacing: "0.05em",
                }}
              >
                {depositData.reference}
              </p>
              <button
                onClick={() => navigator.clipboard.writeText(depositData.reference)}
                style={{
                  padding: "0.375rem 0.75rem",
                  background: "rgba(255,255,255,0.1)",
                  color: "white",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  fontSize: "0.75rem",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                Copy
              </button>
            </div>
          </div>

          <div
            style={{
              background: "#FEF3C7",
              border: "1px solid #FDE68A",
              borderRadius: "var(--radius-md)",
              padding: "0.875rem",
              marginBottom: "1.25rem",
              display: "flex",
              gap: "0.625rem",
            }}
          >
            <span>&#x26A0;&#xFE0F;</span>
            <p style={{ fontSize: "0.8125rem", color: "#92400E", lineHeight: 1.5 }}>
              You MUST include the reference <strong>{depositData.reference}</strong> in your transfer
              narration. Transfers without this reference cannot be matched to your account.
            </p>
          </div>

          <button
            onClick={async () => {
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
            }}
            style={{
              width: "100%",
              padding: "0.875rem",
              background: "var(--teal)",
              color: "var(--midnight)",
              fontWeight: 700,
              fontSize: "1rem",
              borderRadius: "var(--radius-md)",
              border: "none",
              cursor: "pointer",
            }}
          >
            I Have Sent the Money \u2713
          </button>

          <button
            onClick={() => setStep("amount")}
            style={{
              width: "100%",
              padding: "0.75rem",
              background: "none",
              border: "none",
              color: "var(--text-muted)",
              fontSize: "0.875rem",
              cursor: "pointer",
              marginTop: "0.5rem",
            }}
          >
            &#x2190; Change amount
          </button>
        </div>
      )}

      {step === "pending" && (
        <div
          style={{
            background: "white",
            borderRadius: "var(--radius-lg)",
            padding: "2rem",
            border: "1px solid var(--border)",
            marginBottom: "1rem",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "var(--teal-pale)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1rem",
              fontSize: "2rem",
            }}
          >
            &#x23F1;
          </div>
          <h3
            style={{
              fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif",
              fontSize: "1.125rem",
              fontWeight: 700,
              color: "var(--midnight)",
              marginBottom: "0.5rem",
            }}
          >
            Payment pending confirmation
          </h3>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", lineHeight: 1.6, marginBottom: "1rem" }}>
            We will confirm your transfer and update your balance within 1\u20134 business hours
            (9am\u20136pm WAT, Monday\u2013Saturday). If not confirmed within 24 hours, the deposit
            will expire automatically. Contact <strong>support@swiipt.com</strong> if you
            have transferred and are waiting more than 4 hours.
          </p>
          <p
            style={{
              fontSize: "0.8125rem",
              color: "var(--text-muted)",
              background: "var(--off-white)",
              borderRadius: "var(--radius-md)",
              padding: "0.625rem 1rem",
              display: "inline-block",
              marginBottom: "1.5rem",
            }}
          >
            Reference: <strong style={{ color: "var(--midnight)" }}>{depositData?.reference}</strong>
          </p>
          <button
            onClick={onClose}
            style={{
              width: "100%",
              padding: "0.875rem",
              background: "var(--midnight)",
              color: "white",
              fontWeight: 700,
              borderRadius: "var(--radius-md)",
              border: "none",
              cursor: "pointer",
            }}
          >
            Back to goal
          </button>
        </div>
      )}
    </>
  );
}
