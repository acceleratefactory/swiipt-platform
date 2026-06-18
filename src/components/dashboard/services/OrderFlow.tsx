"use client";

import { useState } from "react";
import DirectPaymentFlow from "./DirectPaymentFlow";

interface ServicePackage {
  id: string;
  category: string;
  destination: string;
  name: string;
  full_description: string;
  price_ngn: number;
  price_usd: number;
  price_aed: number;
  price_qar: number;
  price_gbp: number;
  processing_weeks_min: number | null;
  processing_weeks_max: number | null;
  badge_text: string | null;
}

interface ActiveGoal {
  id: string;
  goal_name: string;
  current_balance: number;
  currency: string;
  milestone_100_unlocked: boolean;
  status: string;
}

interface OrderFlowProps {
  pkg: ServicePackage;
  preferredCurrency: string;
  activeGoals: ActiveGoal[];
  userId: string;
  walletCredits?: number;
  onClose: () => void;
  onOrderPlaced: () => void;
}

const currencySymbols: Record<string, string> = {
  NGN: '₦', USD: '$', AED: 'AED ', QAR: 'QAR ', GBP: '£', CAD: 'CA$', EUR: '€',
};

type OrderStep = "choose_payment" | "goal_select" | "direct_payment" | "confirmation";

export default function OrderFlow({ pkg, preferredCurrency, activeGoals, userId: _userId, walletCredits = 0, onClose, onOrderPlaced }: OrderFlowProps) {
  const [step, setStep] = useState<OrderStep>("choose_payment");
  const [selectedGoalId, setSelectedGoalId] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [orderResult, setOrderResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const currencyKey = `price_${preferredCurrency.toLowerCase()}`;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const price = (pkg as any)[currencyKey] || pkg.price_ngn;
  const symbol = currencySymbols[preferredCurrency] || '₦';

  const eligibleGoals = activeGoals.filter(g =>
    g.current_balance >= price * 0.5
  );

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 50 }} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        background: 'white', borderRadius: 'var(--radius-xl)',
        padding: '2rem', width: '520px', maxWidth: '95vw',
        zIndex: 51, boxShadow: 'var(--shadow-lg)',
        maxHeight: '90vh', overflowY: 'auto',
      }}>
        <div style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border)' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>{pkg.destination}</p>
          <h2 style={{ fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', fontSize: '1.125rem', fontWeight: 700, color: 'var(--midnight)' }}>
            {pkg.name}
          </h2>
        </div>

        {step === "choose_payment" && (
          <div>
            <h3 style={{ fontWeight: 700, color: 'var(--midnight)', marginBottom: '0.5rem' }}>How would you like to pay?</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
              Service fee: <strong>{symbol}{price.toLocaleString()}</strong>
            </p>

            {walletCredits > 0 && (
              <>
                <div style={{ background: 'var(--teal-pale)', border: '1px solid var(--teal)', borderRadius: 'var(--radius-md)', padding: '0.875rem 1rem', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ fontWeight: 700, color: 'var(--teal)', fontSize: '0.875rem' }}>
                        ✓ Travel credit available: ₦{walletCredits.toLocaleString()}
                      </p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>
                        Applied automatically to your order
                      </p>
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--teal)' }}>
                      -{walletCredits >= price ? '100%' : `₦${Math.min(walletCredits, price).toLocaleString()}`}
                    </span>
                  </div>
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                    <span>Service price</span>
                    <span>₦{price.toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--teal)', marginBottom: '0.25rem' }}>
                    <span>Travel credit applied</span>
                    <span>-₦{Math.min(walletCredits, price).toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 800, color: 'var(--midnight)', borderTop: '1px solid var(--border)', paddingTop: '0.5rem' }}>
                    <span>You pay</span>
                    <span>₦{Math.max(0, price - walletCredits).toLocaleString()}</span>
                  </div>
                </div>
              </>
            )}

            {walletCredits >= price ? (
              <button
                disabled={loading}
                onClick={async () => {
                  setLoading(true);
                  const res = await fetch("/api/services/order", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      packageId: pkg.id,
                      paymentMethod: "direct_payment",
                      currency: preferredCurrency,
                    }),
                  });
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const data: any = await res.json();
                  if (!res.ok) { setError(data.error); setLoading(false); return; }
                  setOrderResult(data);
                  setStep("confirmation");
                  setLoading(false);
                }}
                style={{ width: '100%', marginBottom: '0.75rem', padding: '0.875rem', background: 'var(--teal)', color: 'var(--midnight)', fontWeight: 700, fontSize: '1rem', borderRadius: 'var(--radius-md)', border: 'none', cursor: loading ? 'not-allowed' : 'pointer' }}
              >
                {loading ? 'Processing...' : `Confirm order — ₦0 to pay →`}
              </button>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <button
                  onClick={() => eligibleGoals.length > 0 ? setStep("goal_select") : setError("No goal with sufficient balance.")}
                  style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', background: 'white', textAlign: 'left', cursor: 'pointer' }}
                >
                  <div style={{ fontWeight: 700, color: 'var(--midnight)', marginBottom: '0.25rem' }}>🎯 Pay from savings goal</div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                    {eligibleGoals.length > 0
                      ? `${eligibleGoals.length} goal${eligibleGoals.length > 1 ? 's' : ''} available`
                      : 'No goals with sufficient balance'}
                  </div>
                  {activeGoals.some(g => g.milestone_100_unlocked) && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--teal)', fontWeight: 600, marginTop: '0.375rem' }}>
                      ✓ 15% milestone discount applies
                    </div>
                  )}
                </button>

                <button
                  onClick={() => setStep("direct_payment")}
                  style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', background: 'white', textAlign: 'left', cursor: 'pointer' }}
                >
                  <div style={{ fontWeight: 700, color: 'var(--midnight)', marginBottom: '0.25rem' }}>💳 Pay directly via bank transfer</div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Pay now without a savings goal</div>
                </button>
              </div>
            )}

            {error && (
              <p style={{ color: 'var(--danger)', fontSize: '0.8125rem', marginTop: '0.75rem' }}>{error}</p>
            )}

            <button onClick={onClose} style={{ width: '100%', marginTop: '1rem', padding: '0.75rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.875rem' }}>
              Cancel
            </button>
          </div>
        )}

        {step === "goal_select" && (
          <div>
            <h3 style={{ fontWeight: 700, color: 'var(--midnight)', marginBottom: '1rem' }}>Select a goal to pay from</h3>

            {eligibleGoals.map(goal => {
              const hasDiscount = goal.milestone_100_unlocked;
              const _finalPrice = hasDiscount ? price * 0.85 : price;
              return (
                <button
                  key={goal.id}
                  onClick={() => setSelectedGoalId(goal.id)}
                  style={{
                    width: '100%', marginBottom: '0.5rem', padding: '0.875rem',
                    border: selectedGoalId === goal.id ? '2px solid var(--teal)' : '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)', background: selectedGoalId === goal.id ? 'var(--teal-pale)' : 'white',
                    textAlign: 'left', cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ fontWeight: 600, color: 'var(--midnight)', fontSize: '0.9375rem' }}>{goal.goal_name}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        Balance: {goal.currency} {goal.current_balance.toLocaleString()}
                      </p>
                    </div>
                    {hasDiscount && (
                      <span style={{ fontSize: '0.7rem', background: 'var(--teal-pale)', color: 'var(--teal)', fontWeight: 700, padding: '2px 8px', borderRadius: '20px' }}>
                        15% off
                      </span>
                    )}
                  </div>
                </button>
              );
            })}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '1rem' }}>
              <button onClick={() => setStep("choose_payment")} style={{ padding: '0.75rem', background: 'var(--gray-100)', color: 'var(--text-secondary)', fontWeight: 600, borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer' }}>
                Back
              </button>
              <button
                disabled={!selectedGoalId || loading}
                onClick={async () => {
                  setLoading(true);
                  const res = await fetch("/api/services/order", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      packageId: pkg.id,
                      paymentMethod: "goal_redemption",
                      goalId: selectedGoalId,
                      currency: preferredCurrency,
                    }),
                  });
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const data: any = await res.json();
                  if (!res.ok) { setError(data.error); setLoading(false); return; }
                  setOrderResult(data);
                  setStep("confirmation");
                  setLoading(false);
                }}
                style={{ padding: '0.75rem', background: !selectedGoalId ? 'var(--gray-100)' : 'var(--teal)', color: !selectedGoalId ? 'var(--text-muted)' : 'var(--midnight)', fontWeight: 700, borderRadius: 'var(--radius-md)', border: 'none', cursor: !selectedGoalId ? 'not-allowed' : 'pointer' }}
              >
                {loading ? "Processing..." : "Confirm order →"}
              </button>
            </div>
          </div>
        )}

        {step === "direct_payment" && (
          <DirectPaymentFlow
            pkg={pkg}
            preferredCurrency={preferredCurrency}
            onComplete={(result) => {
              setOrderResult(result);
              setStep("confirmation");
            }}
          />
        )}

        {step === "confirmation" && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
            <h3 style={{ fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', fontSize: '1.25rem', fontWeight: 700, color: 'var(--midnight)', marginBottom: '0.5rem' }}>
              Order placed!
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              {orderResult?.paymentMethod === "goal_redemption"
                ? "Payment deducted from your goal. Our team will be in touch within 24 hours."
                : "Payment received. Our team will confirm and begin processing within 1–4 hours."}
            </p>
            {orderResult?.creditApplied > 0 && (
              <div style={{ background: 'var(--teal-pale)', borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem', marginBottom: '1rem' }}>
                <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--teal)' }}>
                  ✓ ₦{orderResult.creditApplied.toLocaleString()} travel credit applied to this order
                </p>
              </div>
            )}
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', background: 'var(--off-white)', borderRadius: 'var(--radius-md)', padding: '0.625rem 1rem', display: 'inline-block', marginBottom: '1.5rem' }}>
              {pkg.processing_weeks_min && pkg.processing_weeks_max && `Estimated processing: ${pkg.processing_weeks_min}–${pkg.processing_weeks_max} weeks`}
            </p>
            <button
              onClick={onOrderPlaced}
              style={{ width: '100%', padding: '0.875rem', background: 'var(--teal)', color: 'var(--midnight)', fontWeight: 700, borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer' }}
            >
              View my orders →
            </button>
          </div>
        )}
      </div>
    </>
  );
}
