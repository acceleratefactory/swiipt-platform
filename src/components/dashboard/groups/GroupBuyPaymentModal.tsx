"use client";

import { useEffect, useState } from "react";

interface GroupBuyPaymentModalProps {
  group: {
    id: string;
    item_type: "holiday_package" | "service";
    group_price_ngn: number;
    original_price_ngn: number;
    title: string;
    status: string;
  };
  activeGoals: Array<{
    id: string;
    goal_name: string;
    current_balance: number;
    currency: string;
    milestone_100_unlocked: boolean;
    status: string;
  }>;
  walletCredits: number;
  preferredCurrency: string;
  userId: string;
  isResuming?: boolean;
  onClose: () => void;
  onPaymentComplete: () => void;
}

const currencySymbols: Record<string, string> = {
  NGN: '\u20A6', USD: '$', AED: 'AED ', QAR: 'QAR ', GBP: '\u00A3', CAD: 'CA$', EUR: '\u20AC',
};

type PaymentStep = "choose_payment" | "goal_select" | "direct_payment" | "direct_payment_resume" | "confirmation";

export default function GroupBuyPaymentModal({
  group,
  activeGoals,
  walletCredits = 0,
  preferredCurrency,
  userId,
  isResuming,
  onClose,
  onPaymentComplete,
}: GroupBuyPaymentModalProps) {
  const [step, setStep] = useState<PaymentStep>("choose_payment");
  const [selectedGoalId, setSelectedGoalId] = useState("");
  const [orderResult, setOrderResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isResuming) return;
    async function checkPending() {
      const res = await fetch(`/api/group-buy/payment-status?groupBuyId=${group.id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.hasPending) {
          setOrderResult(data);
          setStep("direct_payment_resume");
        }
      }
    }
    checkPending();
  }, [group.id, isResuming]);

  const price = group.group_price_ngn;
  const symbol = currencySymbols[preferredCurrency] || "\u20A6";

  const eligibleGoals = activeGoals.filter(g =>
    g.current_balance >= price * 0.5
  );

  const hasUnlockedMilestoneGoal = activeGoals.some(g => g.milestone_100_unlocked);

  return (
    <>
      <div onClick={step === "confirmation" ? undefined : onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 50, cursor: step === "confirmation" ? "default" : "pointer" }} />
      <div style={{
        position: "fixed", top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        background: "white", borderRadius: "var(--radius-xl)",
        padding: "2rem", width: "520px", maxWidth: "95vw",
        zIndex: 51, boxShadow: "var(--shadow-lg)",
        maxHeight: "90vh", overflowY: "auto",
      }}>
        <div style={{ marginBottom: "1.5rem", paddingBottom: "1.5rem", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1.125rem", fontWeight: 700, color: "var(--midnight)" }}>
            {group.title}
          </h2>
          {step !== "confirmation" && (
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "1.25rem", lineHeight: 1 }}>
              &times;
            </button>
          )}
        </div>

        {error && (
          <p style={{ color: "var(--danger)", fontSize: "0.8125rem", marginBottom: "0.75rem" }}>{error}</p>
        )}

        {step === "choose_payment" && (
          <div>
            <h3 style={{ fontWeight: 700, color: "var(--midnight)", marginBottom: "0.5rem" }}>How would you like to pay?</h3>
            <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
              Group price: <strong>{symbol}{price.toLocaleString()}</strong>
            </p>

            {walletCredits > 0 && (
              <>
                <div style={{ background: "var(--teal-pale)", border: "1px solid var(--teal)", borderRadius: "var(--radius-md)", padding: "0.875rem 1rem", marginBottom: "1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <p style={{ fontWeight: 700, color: "var(--teal)", fontSize: "0.875rem" }}>
                        ✓ Travel credit available: {symbol}{walletCredits.toLocaleString()}
                      </p>
                      <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.125rem" }}>
                        Applied automatically to your order
                      </p>
                    </div>
                    <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--teal)" }}>
                      -{walletCredits >= price ? "100%" : `${symbol}${Math.min(walletCredits, price).toLocaleString()}`}
                    </span>
                  </div>
                </div>
                <div style={{ marginBottom: "1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>
                    <span>Group price</span>
                    <span>{symbol}{price.toLocaleString()}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem", color: "var(--teal)", marginBottom: "0.25rem" }}>
                    <span>Travel credit applied</span>
                    <span>-{symbol}{Math.min(walletCredits, price).toLocaleString()}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1rem", fontWeight: 800, color: "var(--midnight)", borderTop: "1px solid var(--border)", paddingTop: "0.5rem" }}>
                    <span>You pay</span>
                    <span>{symbol}{Math.max(0, price - walletCredits).toLocaleString()}</span>
                  </div>
                </div>
              </>
            )}

            {walletCredits >= price ? (
              <button
                disabled={loading}
                onClick={async () => {
                  setLoading(true);
                  const res = await fetch("/api/group-buy/pay", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ groupBuyId: group.id, paymentMethod: "direct_payment" }),
                  });
                  const data: any = await res.json();
                  if (!res.ok) { setError(data.error); setLoading(false); return; }
                  setOrderResult(data);
                  setStep("confirmation");
                  setLoading(false);
                }}
                style={{ width: "100%", marginBottom: "0.75rem", padding: "0.875rem", background: "var(--teal)", color: "var(--midnight)", fontWeight: 700, fontSize: "1rem", borderRadius: "var(--radius-md)", border: "none", cursor: loading ? "not-allowed" : "pointer" }}
              >
                {loading ? "Processing..." : `Confirm order — ${symbol}0 to pay →`}
              </button>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <button
                  onClick={() => eligibleGoals.length > 0 ? setStep("goal_select") : setError("No goal with sufficient balance.")}
                  style={{ padding: "1rem", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", background: "white", textAlign: "left", cursor: "pointer" }}
                >
                  <div style={{ fontWeight: 700, color: "var(--midnight)", marginBottom: "0.25rem" }}>🎯 Pay from savings goal</div>
                  <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                    {eligibleGoals.length > 0
                      ? `${eligibleGoals.length} goal${eligibleGoals.length > 1 ? "s" : ""} available`
                      : "No goals with sufficient balance"}
                  </div>
                  {hasUnlockedMilestoneGoal && (
                    <div style={{ fontSize: "0.75rem", color: "var(--teal)", fontWeight: 600, marginTop: "0.375rem" }}>
                      ✓ 15% milestone discount applies
                    </div>
                  )}
                </button>

                <button
                  onClick={() => setStep("direct_payment")}
                  style={{ padding: "1rem", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", background: "white", textAlign: "left", cursor: "pointer" }}
                >
                  <div style={{ fontWeight: 700, color: "var(--midnight)", marginBottom: "0.25rem" }}>💳 Pay directly via bank transfer</div>
                  <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>Pay now without a savings goal</div>
                </button>
              </div>
            )}

            <button onClick={onClose} style={{ width: "100%", marginTop: "1rem", padding: "0.75rem", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "0.875rem" }}>
              Cancel
            </button>
          </div>
        )}

        {step === "goal_select" && (
          <div>
            <h3 style={{ fontWeight: 700, color: "var(--midnight)", marginBottom: "1rem" }}>Select a goal to pay from</h3>

            {eligibleGoals.map(goal => {
              const hasDiscount = goal.milestone_100_unlocked;
              return (
                <button
                  key={goal.id}
                  onClick={() => setSelectedGoalId(goal.id)}
                  style={{
                    width: "100%", marginBottom: "0.5rem", padding: "0.875rem",
                    border: selectedGoalId === goal.id ? "2px solid var(--teal)" : "1px solid var(--border)",
                    borderRadius: "var(--radius-md)", background: selectedGoalId === goal.id ? "var(--teal-pale)" : "white",
                    textAlign: "left", cursor: "pointer",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <p style={{ fontWeight: 600, color: "var(--midnight)", fontSize: "0.9375rem" }}>{goal.goal_name}</p>
                      <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                        Balance: {goal.currency} {goal.current_balance.toLocaleString()}
                      </p>
                    </div>
                    {hasDiscount && (
                      <span style={{ fontSize: "0.7rem", background: "var(--teal-pale)", color: "var(--teal)", fontWeight: 700, padding: "2px 8px", borderRadius: "20px" }}>
                        15% off
                      </span>
                    )}
                  </div>
                </button>
              );
            })}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginTop: "1rem" }}>
              <button onClick={() => setStep("choose_payment")} style={{ padding: "0.75rem", background: "var(--gray-100)", color: "var(--text-secondary)", fontWeight: 600, borderRadius: "var(--radius-md)", border: "none", cursor: "pointer" }}>
                Back
              </button>
              <button
                disabled={!selectedGoalId || loading}
                onClick={async () => {
                  setLoading(true);
                  const res = await fetch("/api/group-buy/pay", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ groupBuyId: group.id, paymentMethod: "goal_redemption", goalId: selectedGoalId }),
                  });
                  const data: any = await res.json();
                  if (!res.ok) { setError(data.error); setLoading(false); return; }
                  setOrderResult(data);
                  setStep("confirmation");
                  setLoading(false);
                }}
                style={{ padding: "0.75rem", background: !selectedGoalId ? "var(--gray-100)" : "var(--teal)", color: !selectedGoalId ? "var(--text-muted)" : "var(--midnight)", fontWeight: 700, borderRadius: "var(--radius-md)", border: "none", cursor: !selectedGoalId ? "not-allowed" : "pointer" }}
              >
                {loading ? "Processing..." : "Confirm order →"}
              </button>
            </div>
          </div>
        )}

        {step === "direct_payment" && (
          <DirectPaymentStep
            groupId={group.id}
            price={price}
            preferredCurrency={preferredCurrency}
            onComplete={(result) => {
              setOrderResult(result);
              setStep("confirmation");
            }}
            onError={(msg) => setError(msg)}
          />
        )}

        {step === "direct_payment_resume" && orderResult && (
          <ResumeDirectPaymentStep
            orderData={orderResult}
            groupId={group.id}
            price={price}
            preferredCurrency={preferredCurrency}
            onComplete={(result) => {
              setError("");
              setOrderResult(result);
              setStep("confirmation");
            }}
            onCancel={async () => {
              setError("");
              const res = await fetch("/api/group-buy/cancel-payment", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ groupBuyId: group.id }),
              });
              if (res.ok) onClose();
              else { const d = await res.json(); setError(d.error); }
            }}
            onSwitchToGoal={async () => {
              setError("");
              const res = await fetch("/api/group-buy/cancel-payment", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ groupBuyId: group.id }),
              });
              if (res.ok) { setOrderResult(null); setStep("choose_payment"); }
              else { const d = await res.json(); setError(d.error); }
            }}
            onError={(msg) => setError(msg)}
          />
        )}

        {step === "confirmation" && (
          <ConfirmationStep
            orderResult={orderResult}
            symbol={symbol}
            onDone={onPaymentComplete}
          />
        )}
      </div>
    </>
  );
}

function DirectPaymentStep({
  groupId,
  price,
  preferredCurrency,
  onComplete,
  onError,
}: {
  groupId: string;
  price: number;
  preferredCurrency: string;
  onComplete: (result: any) => void;
  onError: (msg: string) => void;
}) {
  const [orderData, setOrderData] = useState<any>(null);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    async function initiate() {
      const res = await fetch("/api/group-buy/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupBuyId: groupId, paymentMethod: "direct_payment" }),
      });
      const data: any = await res.json();
      if (res.ok) setOrderData(data);
      else onError(data.error || "Failed to initiate payment");
    }
    initiate();
  }, []);

  if (!orderData) return <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>Generating payment details...</div>;

  return (
    <div>
      <h3 style={{ fontWeight: 700, color: "var(--midnight)", marginBottom: "1rem" }}>Transfer details</h3>

      <div style={{ background: "var(--off-white)", borderRadius: "var(--radius-md)", padding: "1.25rem", marginBottom: "1rem" }}>
        {[
          { label: "Amount", value: `${preferredCurrency} ${orderData.finalPrice?.toLocaleString() || price.toLocaleString()}` },
          { label: "Bank", value: orderData.bankDetails?.bank_name || "\u2014" },
          { label: "Account number", value: orderData.bankDetails?.bank_account_number || "\u2014" },
          { label: "Account name", value: orderData.bankDetails?.bank_account_name || "\u2014" },
        ].map(item => (
          <div key={item.label} style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0", borderBottom: "1px solid var(--gray-100)", fontSize: "0.875rem" }}>
            <span style={{ color: "var(--text-muted)" }}>{item.label}</span>
            <span style={{ fontWeight: 600, color: "var(--midnight)" }}>{item.value}</span>
          </div>
        ))}
      </div>

      <div style={{ background: "var(--midnight)", borderRadius: "var(--radius-md)", padding: "1rem", marginBottom: "1rem" }}>
        <p style={{ fontSize: "0.75rem", color: "var(--gray-500)", marginBottom: "0.25rem" }}>Order reference</p>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "1rem", fontWeight: 700, color: "var(--teal)", fontFamily: "monospace" }}>
            {orderData.reference}
          </span>
          <button onClick={() => navigator.clipboard.writeText(orderData.reference)} style={{ fontSize: "0.75rem", padding: "0.25rem 0.625rem", background: "rgba(255,255,255,0.1)", color: "white", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "var(--radius-sm)", cursor: "pointer" }}>
            Copy
          </button>
        </div>
      </div>

      <div style={{ background: "#FEF3C7", border: "1px solid #FDE68A", borderRadius: "var(--radius-md)", padding: "0.875rem", marginBottom: "1.25rem", fontSize: "0.8125rem", color: "#92400E" }}>
        ⚠️ Include reference <strong>{orderData.reference}</strong> in your transfer narration.
      </div>

      <button
        onClick={async () => {
          setConfirming(true);
          const res = await fetch("/api/group-buy/confirm-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ groupBuyId: groupId }),
          });
          if (res.ok) onComplete(orderData);
          else { const d = await res.json(); onError(d.error || "Failed to confirm payment"); }
          setConfirming(false);
        }}
        disabled={confirming}
        style={{ width: "100%", padding: "0.875rem", background: "var(--teal)", color: "var(--midnight)", fontWeight: 700, borderRadius: "var(--radius-md)", border: "none", cursor: "pointer" }}
      >
        {confirming ? "Submitting..." : "I Have Transferred the Payment ✓"}
      </button>
    </div>
  );
}

function ResumeDirectPaymentStep({
  orderData,
  groupId,
  price,
  preferredCurrency,
  onComplete,
  onCancel,
  onSwitchToGoal,
  onError,
}: {
  orderData: any;
  groupId: string;
  price: number;
  preferredCurrency: string;
  onComplete: (result: any) => void;
  onCancel: () => void;
  onSwitchToGoal: () => void;
  onError: (msg: string) => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [switching, setSwitching] = useState(false);

  return (
    <div>
      <div style={{ background: "var(--teal-pale)", border: "1px solid var(--teal)", borderRadius: "var(--radius-md)", padding: "0.875rem", marginBottom: "1.25rem", display: "flex", gap: "0.625rem" }}>
        <span>&#x2139;&#xFE0F;</span>
        <p style={{ fontSize: "0.8125rem", color: "var(--midnight)", lineHeight: 1.5 }}>
          You have a pending payment that was not yet submitted. Continue where you left off, switch to goal payment, or cancel it.
        </p>
      </div>

      <h3 style={{ fontWeight: 700, color: "var(--midnight)", marginBottom: "1rem" }}>Saved payment details</h3>

      <div style={{ background: "var(--off-white)", borderRadius: "var(--radius-md)", padding: "1.25rem", marginBottom: "1rem" }}>
        {[
          { label: "Amount", value: `${preferredCurrency} ${orderData.finalPrice?.toLocaleString() || price.toLocaleString()}` },
          { label: "Reference", value: orderData.reference || "\u2014" },
          { label: "Bank", value: orderData.bankDetails?.bank_name || "\u2014" },
          { label: "Account number", value: orderData.bankDetails?.bank_account_number || "\u2014" },
          { label: "Account name", value: orderData.bankDetails?.bank_account_name || "\u2014" },
        ].map(item => (
          <div key={item.label} style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0", borderBottom: "1px solid var(--gray-100)", fontSize: "0.875rem" }}>
            <span style={{ color: "var(--text-muted)" }}>{item.label}</span>
            <span style={{ fontWeight: 600, color: "var(--midnight)" }}>{item.value}</span>
          </div>
        ))}
      </div>

      <div style={{ background: "var(--midnight)", borderRadius: "var(--radius-md)", padding: "1rem", marginBottom: "1rem" }}>
        <p style={{ fontSize: "0.75rem", color: "var(--gray-500)", marginBottom: "0.25rem" }}>Order reference</p>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "1rem", fontWeight: 700, color: "var(--teal)", fontFamily: "monospace" }}>
            {orderData.reference}
          </span>
          <button onClick={() => navigator.clipboard.writeText(orderData.reference)} style={{ fontSize: "0.75rem", padding: "0.25rem 0.625rem", background: "rgba(255,255,255,0.1)", color: "white", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "var(--radius-sm)", cursor: "pointer" }}>
            Copy
          </button>
        </div>
      </div>

      <div style={{ background: "#FEF3C7", border: "1px solid #FDE68A", borderRadius: "var(--radius-md)", padding: "0.875rem", marginBottom: "1.25rem", fontSize: "0.8125rem", color: "#92400E" }}>
        &#x26A0;&#xFE0F; Include reference <strong>{orderData.reference}</strong> in your transfer narration.
      </div>

      <button
        onClick={async () => {
          setConfirming(true);
          const res = await fetch("/api/group-buy/confirm-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ groupBuyId: groupId }),
          });
          if (res.ok) onComplete(orderData);
          else { const d = await res.json(); onError(d.error || "Failed to confirm payment"); }
          setConfirming(false);
        }}
        disabled={confirming}
        style={{ width: "100%", padding: "0.875rem", background: "var(--teal)", color: "var(--midnight)", fontWeight: 700, fontSize: "1rem", borderRadius: "var(--radius-md)", border: "none", cursor: confirming ? "not-allowed" : "pointer", marginBottom: "0.75rem" }}
      >
        {confirming ? "Submitting..." : "I Have Transferred the Payment \u2713"}
      </button>

      <button
        onClick={async () => {
          setSwitching(true);
          await onSwitchToGoal();
          setSwitching(false);
        }}
        disabled={switching}
        style={{ width: "100%", padding: "0.875rem", background: "var(--teal-pale)", color: "var(--teal)", fontWeight: 700, fontSize: "0.9375rem", borderRadius: "var(--radius-md)", border: "1px solid var(--teal)", cursor: switching ? "not-allowed" : "pointer", marginBottom: "0.5rem" }}
      >
        {switching ? "Switching..." : "\uD83C\uDFAF Switch to goal payment"}
      </button>

      <button
        onClick={onCancel}
        style={{ width: "100%", padding: "0.75rem", background: "none", border: "none", color: "var(--danger)", fontWeight: 600, fontSize: "0.875rem", cursor: "pointer" }}
      >
        Cancel payment
      </button>
    </div>
  );
}

function ConfirmationStep({
  orderResult,
  symbol,
  onDone,
}: {
  orderResult: any;
  symbol: string;
  onDone: () => void;
}) {
  const isGoalRedemption = orderResult?.paymentMethod === "goal_redemption";

  if (isGoalRedemption) {
    return (
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>&#x1F389;</div>
        <h3 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1.25rem", fontWeight: 700, color: "var(--midnight)", marginBottom: "0.5rem" }}>
          Payment successful!
        </h3>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9375rem", marginBottom: "1.5rem", lineHeight: 1.5 }}>
          Payment deducted from your goal.
        </p>
        {orderResult?.creditApplied > 0 && (
          <div style={{ background: "var(--teal-pale)", borderRadius: "var(--radius-md)", padding: "0.75rem 1rem", marginBottom: "1rem" }}>
            <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--teal)" }}>
              &#x2713; {symbol}{orderResult.creditApplied.toLocaleString()} travel credit applied to this order
            </p>
          </div>
        )}
        <button
          onClick={onDone}
          style={{ width: "100%", padding: "0.875rem", background: "var(--teal)", color: "var(--midnight)", fontWeight: 700, borderRadius: "var(--radius-md)", border: "none", cursor: "pointer" }}
        >
          Back to groups &#x2192;
        </button>
      </div>
    );
  }

  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--teal-pale)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem", fontSize: "2rem" }}>
        &#x23F1;
      </div>
      <h3 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1.125rem", fontWeight: 700, color: "var(--midnight)", marginBottom: "0.5rem" }}>
        Payment pending confirmation
      </h3>
      <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", lineHeight: 1.6, marginBottom: "1rem" }}>
        We will confirm your transfer and update your order within 1&#x2013;4 business hours
        (9am&#x2013;6pm WAT, Monday&#x2013;Saturday). If not confirmed within 24 hours, contact <strong>support@swiipt.com</strong>.
      </p>
      {orderResult?.creditApplied > 0 && (
        <div style={{ background: "var(--teal-pale)", borderRadius: "var(--radius-md)", padding: "0.75rem 1rem", marginBottom: "1rem" }}>
          <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--teal)" }}>
            &#x2713; {symbol}{orderResult.creditApplied.toLocaleString()} travel credit applied to this order
          </p>
        </div>
      )}
      <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", background: "var(--off-white)", borderRadius: "var(--radius-md)", padding: "0.625rem 1rem", display: "inline-block", marginBottom: "1.5rem" }}>
        Reference: <strong style={{ color: "var(--midnight)" }}>{orderResult?.reference}</strong>
      </p>
      <button
        onClick={onDone}
        style={{ width: "100%", padding: "0.875rem", background: "var(--midnight)", color: "white", fontWeight: 700, borderRadius: "var(--radius-md)", border: "none", cursor: "pointer" }}
      >
        Back to groups &#x2192;
      </button>
    </div>
  );
}
