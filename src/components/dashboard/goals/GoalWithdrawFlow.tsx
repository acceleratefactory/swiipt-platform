"use client";

import { useState } from "react";
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

export default function GoalWithdrawFlow({
  goal,
  onClose,
}: {
  goal: {
    id: string;
    currency: string;
    current_balance: number;
    is_locked: boolean;
    maturity_date: string | null;
    early_exit_penalty_rate: number;
  };
  onClose: () => void;
}) {
  const isEarlyExit =
    goal.is_locked &&
    goal.maturity_date &&
    new Date(goal.maturity_date) > new Date();
  const penaltyAmount = isEarlyExit
    ? goal.current_balance * goal.early_exit_penalty_rate
    : 0;
  const netAmount = goal.current_balance - penaltyAmount;

  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  return (
    <>
      {!submitted ? (
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
              Withdraw funds
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

          {isEarlyExit && (
            <div
              style={{
                background: "#FEF2F2",
                border: "1px solid #FECACA",
                borderRadius: "var(--radius-md)",
                padding: "1rem",
                marginBottom: "1.25rem",
              }}
            >
              <p
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 700,
                  color: "var(--danger)",
                  marginBottom: "0.5rem",
                }}
              >
                ⚠️ Early withdrawal penalty applies
              </p>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "0.875rem",
                  color: "var(--text-secondary)",
                  marginBottom: "0.25rem",
                }}
              >
                <span>Your balance</span>
                <span>
                  {goal.currency} {goal.current_balance.toLocaleString()}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "0.875rem",
                  color: "var(--danger)",
                  marginBottom: "0.25rem",
                }}
              >
                <span>
                  Penalty ({(goal.early_exit_penalty_rate * 100).toFixed(0)}%)
                </span>
                <span>
                  - {goal.currency} {penaltyAmount.toLocaleString()}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "0.9375rem",
                  fontWeight: 700,
                  color: "var(--midnight)",
                  borderTop: "1px solid #FECACA",
                  paddingTop: "0.5rem",
                  marginTop: "0.25rem",
                }}
              >
                <span>You will receive</span>
                <span>
                  {goal.currency} {netAmount.toLocaleString()}
                </span>
              </div>
            </div>
          )}

          {[
            {
              label: "Bank name",
              value: bankName,
              setter: setBankName,
              placeholder: "e.g. First Bank Nigeria",
            },
            {
              label: "Account number",
              value: accountNumber,
              setter: setAccountNumber,
              placeholder: "10-digit account number",
            },
            {
              label: "Account name",
              value: accountName,
              setter: setAccountName,
              placeholder: "As it appears on your account",
            },
          ].map((field) => (
            <div key={field.label} style={{ marginBottom: "1rem" }}>
              <label style={labelStyle}>{field.label}</label>
              <input
                type="text"
                value={field.value}
                onChange={(e) => field.setter(e.target.value)}
                placeholder={field.placeholder}
                style={inputStyle}
              />
            </div>
          ))}

          <div
            style={{
              display: "flex",
              gap: "0.75rem",
              alignItems: "flex-start",
              marginBottom: "1.5rem",
            }}
          >
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              style={{
                marginTop: "2px",
                accentColor: "var(--teal)",
                width: 16,
                height: 16,
                flexShrink: 0,
              }}
            />
            <label
              style={{
                fontSize: "0.8125rem",
                color: "var(--text-secondary)",
                lineHeight: 1.5,
                cursor: "pointer",
              }}
            >
              I understand{" "}
              {isEarlyExit
                ? `I will lose ${goal.currency} ${penaltyAmount.toLocaleString()} as an early exit penalty and receive ${goal.currency} ${netAmount.toLocaleString()}.`
                : "this will close my savings goal."}
            </label>
          </div>

          <button
            disabled={
              !confirmed || !bankName || !accountNumber || !accountName || loading
            }
            onClick={async () => {
              setLoading(true);
              const res = await fetch("/api/goals/withdraw/request", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  goalId: goal.id,
                  bankName,
                  accountNumber,
                  accountName,
                }),
              });
              if (res.ok) setSubmitted(true);
              setLoading(false);
            }}
            style={{
              width: "100%",
              padding: "0.875rem",
              background:
                !confirmed || !bankName || !accountNumber || !accountName
                  ? "var(--gray-100)"
                  : "var(--danger)",
              color:
                !confirmed || !bankName || !accountNumber || !accountName
                  ? "var(--text-muted)"
                  : "white",
              fontWeight: 700,
              fontSize: "1rem",
              borderRadius: "var(--radius-md)",
              border: "none",
              cursor:
                !confirmed || !bankName || !accountNumber || !accountName
                  ? "not-allowed"
                  : "pointer",
            }}
          >
            {loading ? "Submitting..." : "Request withdrawal"}
          </button>
        </div>
      ) : (
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
          <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>✓</div>
          <h3
            style={{
              fontWeight: 700,
              color: "var(--midnight)",
              marginBottom: "0.5rem",
            }}
          >
            Withdrawal requested
          </h3>
          <p
            style={{
              color: "var(--text-muted)",
              fontSize: "0.875rem",
              marginBottom: "1.5rem",
            }}
          >
            We will process your withdrawal within 1–2 business days and send a
            confirmation.
          </p>
          <button
            onClick={onClose}
            style={{
              padding: "0.75rem 1.5rem",
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
