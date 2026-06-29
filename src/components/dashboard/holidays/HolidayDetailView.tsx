"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import HolidayBookingFlow from "./HolidayBookingFlow";

function getGradient(destination: string): string {
  const gradients: Record<string, string> = {
    "Maldives": "linear-gradient(135deg, #00b4d8, #0077b6)",
    "Dubai, UAE": "linear-gradient(135deg, #f7971e, #ffd200)",
    "Cape Town, South Africa": "linear-gradient(135deg, #27ae60, #2980b9)",
    "UK & France": "linear-gradient(135deg, #2c3e50, #4ca1af)",
    "Qatar": "linear-gradient(135deg, #8B4513, #D4A017)",
    "Turkey": "linear-gradient(135deg, #e74c3c, #f39c12)",
    "Kenya": "linear-gradient(135deg, #2ecc71, #e67e22)",
    "Portugal": "linear-gradient(135deg, #e74c3c, #3498db)",
  };
  return gradients[destination] || "linear-gradient(135deg, var(--midnight), var(--midnight-muted))";
}

const _currencySymbols: Record<string, string> = {
  NGN: '₦', USD: '$', AED: 'AED ', GBP: '£', EUR: '€', QAR: 'QAR ', CAD: 'CA$',
};

export default function HolidayDetailView({ pkg, preferredCurrency, activeGoals, userId, existingBooking, existingGoal }: { pkg: any; preferredCurrency: string; activeGoals: any[]; userId: string; existingBooking: any; existingGoal: any }) {
  const router = useRouter();
  const [showBooking, setShowBooking] = useState(false);
  const [initialAction, setInitialAction] = useState<"book" | null>(null);
  const [bookingPending, setBookingPending] = useState(false);
  const [currentBookingId, setCurrentBookingId] = useState<string | null>(null);

  // Realtime: auto-refresh when admin confirms booking
  useEffect(() => {
    if (!existingBooking) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`holiday_booking:${existingBooking.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "holiday_bookings",
          filter: `id=eq.${existingBooking.id}`,
        },
        (payload) => {
          if ((payload.new as any).status === "payment_confirmed") {
            router.refresh();
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [existingBooking?.id, router]);

  // Realtime: catch admin confirmation for newly created bookings
  useEffect(() => {
    if (!currentBookingId) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`holiday_booking_live:${currentBookingId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "holiday_bookings",
          filter: `id=eq.${currentBookingId}`,
        },
        (payload) => {
          if ((payload.new as any).status === "payment_confirmed") {
            router.refresh();
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [currentBookingId, router]);

  const prices = [
    { currency: 'NGN', value: pkg.price_per_person_ngn, symbol: '₦' },
    { currency: 'USD', value: pkg.price_per_person_usd, symbol: '$' },
    { currency: 'AED', value: pkg.price_per_person_aed, symbol: 'AED ' },
  ];

  return (
    <div style={{ background: 'white', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)', overflow: 'hidden' }}>
      <div style={{ height: '240px', background: getGradient(pkg.destination), position: 'relative' }}>
        {pkg.is_featured && (
          <span style={{ position: 'absolute', top: '1rem', left: '1rem', background: 'var(--teal)', color: 'var(--midnight)', fontSize: '0.75rem', fontWeight: 700, padding: '4px 12px', borderRadius: '20px' }}>
            Featured
          </span>
        )}
        {pkg.slots_available <= 6 && (
          <span style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(239,68,68,0.9)', color: 'white', fontSize: '0.75rem', fontWeight: 700, padding: '4px 12px', borderRadius: '20px' }}>
            {pkg.slots_available} spots left
          </span>
        )}
      </div>

      <div style={{ padding: '1.5rem' }}>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '0.375rem' }}>
          🌍 {pkg.destination} · {pkg.duration_nights} nights
        </p>
        <h1 style={{ fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', fontSize: '1.5rem', fontWeight: 800, color: 'var(--midnight)', marginBottom: '1rem' }}>
          {pkg.title}
        </h1>

        <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
          {pkg.description}
        </p>

        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', fontSize: '0.9375rem', fontWeight: 700, color: 'var(--midnight)', marginBottom: '0.75rem' }}>Inclusions</h3>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {(pkg.inclusions || []).map((inc: string) => (
              <span key={inc} style={{ fontSize: '0.8125rem', background: 'var(--teal-pale)', color: 'var(--teal)', padding: '4px 10px', borderRadius: '20px', fontWeight: 600 }}>
                ✓ {inc}
              </span>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', fontSize: '0.9375rem', fontWeight: 700, color: 'var(--midnight)', marginBottom: '0.75rem' }}>Pricing</h3>
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            {prices.map(({ currency, value, symbol }) => value && (
              <div key={currency} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', background: 'var(--off-white)', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{currency}</span>
                <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--midnight)' }}>{symbol}{Number(value).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {existingBooking && (
          <div style={{ marginBottom: '1.5rem', padding: '1rem', background: existingBooking.status === 'payment_submitted' ? 'var(--teal-pale)' : '#FEF3C7', borderRadius: 'var(--radius-md)', border: `1px solid ${existingBooking.status === 'payment_submitted' ? 'var(--teal)' : '#FDE68A'}` }}>
            <p style={{ fontWeight: 700, color: existingBooking.status === 'payment_submitted' ? 'var(--teal)' : '#92400E', fontSize: '0.9375rem', marginBottom: '0.25rem' }}>
              {existingBooking.status === 'payment_submitted' ? '✓ Payment submitted' : 'Payment pending'}
            </p>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              {existingBooking.status === 'payment_submitted'
                ? 'Awaiting admin confirmation. This usually takes 24–48 hours.'
                : 'Complete your payment to proceed.'}
            </p>
          </div>
        )}

        {existingGoal && (
          <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'var(--teal-pale)', borderRadius: 'var(--radius-md)', border: '1px solid var(--teal)' }}>
            <p style={{ fontWeight: 700, color: 'var(--teal)', fontSize: '0.9375rem', marginBottom: '0.25rem' }}>
              🎯 Saving for this trip
            </p>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>
              {existingGoal.goal_name}
            </p>
            <p style={{ fontSize: '0.875rem', color: 'var(--midnight)', fontWeight: 600 }}>
              ₦{Number(existingGoal.current_balance).toLocaleString()} / ₦{Number(existingGoal.target_amount).toLocaleString()}
            </p>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: existingBooking ? '1fr' : '1fr 1fr', gap: '0.75rem' }}>
          {existingGoal && existingGoal.current_balance >= (pkg.price_per_person_ngn || 0) ? (
            <button
              onClick={() => { setShowBooking(true); setInitialAction("book"); }}
              style={{ padding: '0.75rem', background: 'var(--teal)', color: 'var(--midnight)', fontWeight: 700, fontSize: '0.9375rem', borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer' }}
            >
              🎯 Pay with savings — ₦{Number(existingGoal.current_balance).toLocaleString()}
            </button>
          ) : existingGoal ? (
            <a
              href={`/dashboard/goals/${existingGoal.id}`}
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0.75rem', background: 'var(--teal-pale)', color: 'var(--teal)', fontWeight: 700, fontSize: '0.9375rem', borderRadius: 'var(--radius-md)', textDecoration: 'none' }}
            >
              Continue saving →
            </a>
          ) : (
            <button
              onClick={() => { setShowBooking(true); setInitialAction(null); }}
              style={{ padding: '0.75rem', background: 'var(--teal-pale)', color: 'var(--teal)', fontWeight: 700, fontSize: '0.9375rem', borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer' }}
            >
              Save toward this
            </button>
          )}
          {!existingBooking && (
            <button
              onClick={() => { setShowBooking(true); setInitialAction(null); }}
              style={{ padding: '0.75rem', background: 'var(--midnight)', color: 'white', fontWeight: 700, fontSize: '0.9375rem', borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer' }}
            >
              Book directly
            </button>
          )}
        </div>
      </div>

      {showBooking && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem', cursor: bookingPending ? 'default' : 'pointer' }}
          onClick={bookingPending ? undefined : () => setShowBooking(false)}>
          <div style={{ background: 'white', borderRadius: 'var(--radius-xl)', maxWidth: '600px', width: '100%', maxHeight: '90vh', overflow: 'auto' }}
            onClick={e => e.stopPropagation()}>
            <HolidayBookingFlow
              pkg={pkg}
              preferredCurrency={preferredCurrency}
              activeGoals={activeGoals}
              userId={userId}
              existingGoal={existingGoal}
              initialAction={initialAction}
              onClose={() => { setShowBooking(false); setInitialAction(null); setCurrentBookingId(null); }}
              onPendingChange={setBookingPending}
              onAdminConfirmed={() => { setShowBooking(false); router.refresh(); }}
              onBookingCreated={setCurrentBookingId}
            />
          </div>
        </div>
      )}
    </div>
  );
}
/* eslint-enable @typescript-eslint/no-explicit-any */
