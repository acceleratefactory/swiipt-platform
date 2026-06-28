"use client";
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const currencySymbols: Record<string, string> = {
  NGN: '₦', USD: '$', AED: 'AED ', GBP: '£', EUR: '€',
};

export default function HolidayBookingFlow({ pkg, preferredCurrency, activeGoals, userId, existingGoal, onClose }: { pkg: any; preferredCurrency: string; activeGoals: any[]; userId: string; existingGoal?: any; onClose: () => void }) {
  const supabase = createClient();
  const router = useRouter();
  const [action, setAction] = useState<"save" | "book" | null>(null);
  const [travellers, setTravellers] = useState(1);
  const [currency, setCurrency] = useState(preferredCurrency);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [adminConfirmed, setAdminConfirmed] = useState(false);
  const [confirmError, setConfirmError] = useState("");
  const [detectedGoal, setDetectedGoal] = useState<any>(null);

  useEffect(() => {
    if (!confirmed || !result?.bookingId) return;
    const channel = supabase
      .channel(`holiday_booking:${result.bookingId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "holiday_bookings",
          filter: `id=eq.${result.bookingId}`,
        },
        (payload: any) => {
          if (payload.new?.status === "payment_confirmed") {
            setAdminConfirmed(true);
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [confirmed, result?.bookingId, supabase]);

  const currencyKey = `price_per_person_${currency.toLowerCase()}`;
  const pricePerPerson = (pkg as any)[currencyKey] || pkg.price_per_person_ngn;
  const totalPrice = pricePerPerson * travellers;
  const symbol = currencySymbols[currency] || '₦';

  async function handleSave() {
    setLoading(true);
    setError("");
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: existingGoal } = await (supabase as any)
        .from("savings_goals")
        .select("id, goal_name, current_balance, target_amount")
        .eq("linked_holiday_package_id", pkg.id)
        .eq("user_id", userId)
        .eq("status", "active")
        .maybeSingle();

      if (existingGoal) {
        setDetectedGoal(existingGoal);
        setResult({
          type: "existing_goal",
          goalId: existingGoal.id,
          goalName: existingGoal.goal_name,
          message: `You already have a savings goal "${existingGoal.goal_name}" for this trip. Continue saving or book directly.`,
        });
        setLoading(false);
        return;
      }

      const { error: insertError } = await (supabase as any).from("savings_goals").insert({
        user_id: userId,
        goal_name: pkg.title,
        goal_category: "holiday_package",
        destination: pkg.destination,
        currency,
        target_amount: totalPrice,
        status: "active",
        is_locked: false,
        linked_holiday_package_id: pkg.id,
      });
      if (insertError) throw insertError;
      setResult({ type: "save", message: `Savings goal "${pkg.title}" created! Start saving toward your trip.` });
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to create savings goal");
    } finally {
      setLoading(false);
    }
  }

  async function handleBook() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/holidays/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId: pkg.id, travellers, currency }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Booking failed");
      setResult({ type: "book", ...data });
    } catch (err: any) {
      setError(err.message || "Booking failed");
    } finally {
      setLoading(false);
    }
  }

  async function handlePayFromGoal() {
    const activeGoal = existingGoal || detectedGoal;
    if (!activeGoal) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/holidays/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageId: pkg.id,
          travellers,
          currency,
          goalId: activeGoal.id,
          paymentMethod: "goal_redemption",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Payment failed");
      setResult({ type: "goal_payment", ...data });
      setConfirmed(true);
      setAdminConfirmed(true);
    } catch (err: any) {
      setError(err.message || "Payment failed");
    } finally {
      setLoading(false);
    }
  }

  if (result) {
    if (confirmed) {
      return (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <p style={{ fontSize: '2rem', marginBottom: '1rem' }}>{adminConfirmed ? '✅' : '🎉'}</p>
          <h3 style={{ fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', fontWeight: 700, color: 'var(--midnight)', marginBottom: '0.75rem' }}>
            {adminConfirmed ? 'Payment confirmed!' : 'Payment submitted!'}
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem', marginBottom: '1.5rem' }}>
            {adminConfirmed ? (
              <>Your booking reference <strong>{result.reference}</strong> has been confirmed. Get ready for your trip!</>
            ) : (
              <>Thank you. Your booking reference <strong>{result.reference}</strong> has been submitted for verification. We will confirm within 24 hours.</>
            )}
          </p>
          <button onClick={onClose} style={{ padding: '0.75rem 1.5rem', background: 'var(--midnight)', color: 'white', fontWeight: 700, borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer' }}>
            Close
          </button>
        </div>
      );
    }

      return (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <p style={{ fontSize: '2rem', marginBottom: '1rem' }}>{result.type === "save" ? "🎯" : result.type === "existing_goal" ? "💡" : "🎉"}</p>
          <h3 style={{ fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', fontWeight: 700, color: 'var(--midnight)', marginBottom: '0.75rem' }}>
            {result.type === "save" ? "Goal created!" : result.type === "existing_goal" ? "Goal already exists" : "Booking initiated!"}
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem', marginBottom: '1.5rem' }}>{result.message}</p>

          {result.type === "existing_goal" && (
            <>
              <a href={`/dashboard/goals/${result.goalId}`} style={{ display: 'inline-block', padding: '0.75rem 1.5rem', background: 'var(--teal)', color: 'var(--midnight)', fontWeight: 700, borderRadius: 'var(--radius-md)', textDecoration: 'none', marginBottom: '0.75rem' }}>
                View goal →
              </a>
              <button onClick={() => { setResult(null); setAction("book"); }} style={{ display: 'block', width: '100%', padding: '0.75rem 1.5rem', background: 'var(--midnight)', color: 'white', fontWeight: 700, fontSize: '0.9375rem', borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer' }}>
                ✈️ Book directly from this goal
              </button>
            </>
          )}

        {result.type === "book" && (
          <div style={{ background: 'var(--off-white)', borderRadius: 'var(--radius-md)', padding: '1.25rem', marginBottom: '1.5rem', textAlign: 'left' }}>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Transfer the total amount to the bank details below and your booking will be confirmed within 24 hours.
            </p>
            <div style={{ display: 'grid', gap: '0.625rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.375rem 0', borderBottom: '1px solid var(--gray-100)' }}>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Reference</span>
                <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--midnight)' }}>{result.reference}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.375rem 0', borderBottom: '1px solid var(--gray-100)' }}>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Total</span>
                <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--midnight)' }}>{symbol}{result.totalPrice?.toLocaleString()}</span>
              </div>
              {result.bankDetails?.bank_name && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.375rem 0', borderBottom: '1px solid var(--gray-100)' }}>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Bank</span>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--midnight)' }}>{result.bankDetails.bank_name}</span>
                </div>
              )}
              {result.bankDetails?.bank_account_name && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.375rem 0', borderBottom: '1px solid var(--gray-100)' }}>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Account name</span>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--midnight)' }}>{result.bankDetails.bank_account_name}</span>
                </div>
              )}
              {result.bankDetails?.bank_account_number && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.375rem 0', borderBottom: '1px solid var(--gray-100)' }}>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Account number</span>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--midnight)' }}>{result.bankDetails.bank_account_number}</span>
                </div>
              )}
            </div>

            <button
              onClick={async () => {
                setConfirming(true);
                setConfirmError("");
                try {
                  const res = await fetch("/api/holidays/confirm-payment", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ bookingId: result.bookingId }),
                  });
                  if (!res.ok) throw new Error("Failed to confirm payment");
                  setConfirmed(true);
                } catch (err: any) {
                  setConfirmError(err.message || "Something went wrong");
                } finally {
                  setConfirming(false);
                }
              }}
              disabled={confirming}
              style={{ width: '100%', marginTop: '1rem', padding: '0.75rem', background: 'var(--teal)', color: 'var(--midnight)', fontWeight: 700, borderRadius: 'var(--radius-md)', border: 'none', cursor: confirming ? 'not-allowed' : 'pointer', opacity: confirming ? 0.6 : 1 }}
            >
              {confirming ? "Submitting..." : "I Have Transferred the Payment ✓"}
            </button>
            {confirmError && (
              <p style={{ fontSize: '0.8125rem', color: '#EF4444', marginTop: '0.75rem' }}>{confirmError}</p>
            )}
          </div>
        )}

        <button onClick={onClose} style={{ padding: '0.75rem 1.5rem', background: 'var(--midnight)', color: 'white', fontWeight: 700, borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer' }}>
          Close
        </button>
      </div>
    );
  }

  if (!action) {
    return (
      <div style={{ padding: '2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>🌍 {pkg.destination} · {pkg.duration_nights} nights</p>
          <h3 style={{ fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', fontSize: '1.125rem', fontWeight: 700, color: 'var(--midnight)' }}>{pkg.title}</h3>
        </div>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', marginBottom: '1.5rem', textAlign: 'center' }}>
          From ₦{pkg.price_per_person_ngn?.toLocaleString()}/person
        </p>

        <div style={{ display: 'grid', gap: '0.75rem' }}>
          <button onClick={() => setAction("save")} style={{ padding: '1rem', background: 'var(--teal-pale)', color: 'var(--teal)', fontWeight: 700, fontSize: '0.9375rem', borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer' }}>
            🎯 Save toward this trip
          </button>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', textAlign: 'center' }}>
            Create a flexible savings goal to save at your own pace. No lock-in.
          </p>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: '0.5rem' }}>
            <button onClick={() => setAction("book")} style={{ width: '100%', padding: '1rem', background: 'var(--midnight)', color: 'white', fontWeight: 700, fontSize: '0.9375rem', borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer' }}>
              ✈️ Book directly
            </button>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '0.5rem' }}>
              Pay now via bank transfer. Booking confirmed within 24 hours.
            </p>
          </div>
        </div>

        <button onClick={onClose} style={{ width: '100%', marginTop: '1rem', padding: '0.75rem', background: 'transparent', color: 'var(--text-muted)', fontWeight: 600, borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', cursor: 'pointer' }}>
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>🌍 {pkg.destination} · {pkg.duration_nights} nights</p>
        <h3 style={{ fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', fontSize: '1.125rem', fontWeight: 700, color: 'var(--midnight)' }}>{pkg.title}</h3>
      </div>

      <div style={{ marginBottom: '1.25rem' }}>
        <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--midnight)', display: 'block', marginBottom: '0.5rem' }}>
          Number of travellers
        </label>
        <select value={travellers} onChange={e => setTravellers(Number(e.target.value))} style={{ width: '100%', padding: '0.625rem 1rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', background: 'white', color: 'var(--midnight)' }}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
            <option key={n} value={n}>{n} {n === 1 ? 'traveller' : 'travellers'}</option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--midnight)', display: 'block', marginBottom: '0.5rem' }}>
          Currency
        </label>
        <select value={currency} onChange={e => setCurrency(e.target.value)} style={{ width: '100%', padding: '0.625rem 1rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', background: 'white', color: 'var(--midnight)' }}>
          <option value="NGN">₦ NGN</option>
          <option value="USD">$ USD</option>
          <option value="AED">AED</option>
        </select>
      </div>

      <div style={{ background: 'var(--off-white)', borderRadius: 'var(--radius-md)', padding: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{symbol}{pricePerPerson?.toLocaleString()} × {travellers} traveller(s)</span>
          <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--midnight)' }}>{symbol}{totalPrice?.toLocaleString()}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.5rem', borderTop: '1px solid var(--border)' }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--midnight)' }}>Total</span>
          <span style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--midnight)' }}>{symbol}{totalPrice?.toLocaleString()}</span>
        </div>
      </div>

      {error && (
        <p style={{ fontSize: '0.8125rem', color: '#EF4444', marginBottom: '1rem' }}>{error}</p>
      )}

      {action === "save" ? (
        <button
          onClick={handleSave}
          disabled={loading}
          style={{ width: '100%', padding: '0.75rem', background: 'var(--teal)', color: 'var(--midnight)', fontWeight: 700, fontSize: '0.9375rem', borderRadius: 'var(--radius-md)', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}
        >
          {loading ? "Creating goal..." : `🎯 Save ₦${totalPrice?.toLocaleString()} toward this trip`}
        </button>
      ) : (() => {
        const activeGoal = existingGoal || detectedGoal;
        const hasFundedGoal = activeGoal && activeGoal.current_balance >= totalPrice;
        return hasFundedGoal ? (
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)', textAlign: 'center', margin: 0 }}>Choose payment method</p>
            <button
              onClick={handlePayFromGoal}
              disabled={loading}
              style={{ width: '100%', padding: '0.75rem', background: 'var(--teal)', color: 'var(--midnight)', fontWeight: 700, fontSize: '0.9375rem', borderRadius: 'var(--radius-md)', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}
            >
              {loading ? "Processing..." : `🎯 Pay from ${activeGoal.goal_name} — ${symbol}${Number(activeGoal.current_balance).toLocaleString()}`}
            </button>
            <button
              onClick={handleBook}
              disabled={loading}
              style={{ width: '100%', padding: '0.75rem', background: 'var(--midnight)', color: 'white', fontWeight: 700, fontSize: '0.9375rem', borderRadius: 'var(--radius-md)', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}
            >
              {loading ? "Processing..." : `✈️ Pay ${symbol}${totalPrice?.toLocaleString()} via bank transfer`}
            </button>
          </div>
        ) : (
          <button
            onClick={handleBook}
            disabled={loading}
            style={{ width: '100%', padding: '0.75rem', background: 'var(--midnight)', color: 'white', fontWeight: 700, fontSize: '0.9375rem', borderRadius: 'var(--radius-md)', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}
          >
            {loading ? "Processing..." : `✈️ Pay ${symbol}${totalPrice?.toLocaleString()} via bank transfer`}
          </button>
        );
      })()}

      <button onClick={onClose} style={{ width: '100%', marginTop: '0.75rem', padding: '0.75rem', background: 'transparent', color: 'var(--text-muted)', fontWeight: 600, borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', cursor: 'pointer' }}>
        Cancel
      </button>
    </div>
  );
}
/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
