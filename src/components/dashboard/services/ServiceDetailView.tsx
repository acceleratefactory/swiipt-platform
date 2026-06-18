"use client";

import { useState } from "react";
import OrderFlow from "./OrderFlow";
import ActiveOrderTracker from "./ActiveOrderTracker";

interface ServicePackage {
  id: string;
  category: string;
  destination: string;
  name: string;
  short_description: string;
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

interface ExistingOrder {
  id: string;
  status: string;
  created_at: string;
  case_manager_notes: string | null;
}

interface ServiceDetailViewProps {
  pkg: ServicePackage;
  preferredCurrency: string;
  activeGoals: ActiveGoal[];
  existingOrder: ExistingOrder | null;
  userId: string;
  walletCredits?: number;
}

const currencySymbols: Record<string, string> = {
  NGN: '₦', USD: '$', AED: 'AED ', QAR: 'QAR ', GBP: '£', CAD: 'CA$', EUR: '€',
};

const pricingFields = [
  { key: 'price_ngn', label: 'NGN', symbol: '₦' },
  { key: 'price_usd', label: 'USD', symbol: '$' },
  { key: 'price_aed', label: 'AED', symbol: 'AED ' },
  { key: 'price_qar', label: 'QAR', symbol: 'QAR ' },
  { key: 'price_gbp', label: 'GBP', symbol: '£' },
];

export default function ServiceDetailView({ pkg, preferredCurrency, activeGoals, existingOrder, userId, walletCredits = 0 }: ServiceDetailViewProps) {
  const [showOrder, setShowOrder] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const price = (pkg as any)[`price_${preferredCurrency.toLowerCase()}`] || pkg.price_ngn;
  const symbol = currencySymbols[preferredCurrency] || '₦';

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      {existingOrder ? (
        <ActiveOrderTracker order={existingOrder} />
      ) : (
        <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', overflow: 'hidden' }}>
          <div style={{ padding: '2rem' }}>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '0.375rem' }}>
              🌍 {pkg.destination}
            </p>
            <h1 style={{ fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', fontSize: '1.5rem', fontWeight: 800, color: 'var(--midnight)', marginBottom: '0.75rem' }}>
              {pkg.name}
            </h1>

            {pkg.badge_text && (
              <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '3px 10px', borderRadius: '20px', background: 'var(--teal-pale)', color: 'var(--teal)', marginBottom: '1rem', display: 'inline-block' }}>
                {pkg.badge_text}
              </span>
            )}

            <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '1.5rem', whiteSpace: 'pre-line' }}>
              {pkg.full_description}
            </p>

            <div style={{ background: 'var(--off-white)', borderRadius: 'var(--radius-md)', padding: '1.25rem', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--midnight)', marginBottom: '0.75rem' }}>Pricing</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.75rem' }}>
                {pricingFields.map(f => {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const val = (pkg as any)[f.key];
                  if (!val) return null;
                  return (
                    <div key={f.key} style={{ background: 'white', borderRadius: 'var(--radius-sm)', padding: '0.625rem 0.875rem' }}>
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.125rem' }}>{f.label}</p>
                      <p style={{ fontSize: '1rem', fontWeight: 700, color: f.key === `price_${preferredCurrency.toLowerCase()}` ? 'var(--teal)' : 'var(--midnight)' }}>
                        {f.symbol}{val.toLocaleString()}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {(pkg.processing_weeks_min || pkg.processing_weeks_max) && (
              <div style={{ background: 'var(--off-white)', borderRadius: 'var(--radius-md)', padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '1.25rem' }}>⏱</span>
                <div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.125rem' }}>Processing time</p>
                  <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--midnight)' }}>
                    {pkg.processing_weeks_min === pkg.processing_weeks_max
                      ? `${pkg.processing_weeks_min} weeks`
                      : pkg.processing_weeks_min && pkg.processing_weeks_max
                      ? `${pkg.processing_weeks_min}–${pkg.processing_weeks_max} weeks`
                      : pkg.processing_weeks_min
                      ? `${pkg.processing_weeks_min}+ weeks`
                      : 'Fast turnaround'}
                  </p>
                </div>
              </div>
            )}

            <button
              onClick={() => setShowOrder(true)}
              style={{ width: '100%', padding: '0.875rem', background: 'var(--teal)', color: 'var(--midnight)', fontWeight: 700, fontSize: '1rem', borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer' }}
            >
              Order this service — {symbol}{price.toLocaleString()}
            </button>
          </div>
        </div>
      )}

      {showOrder && (
        <OrderFlow
          pkg={pkg}
          preferredCurrency={preferredCurrency}
          activeGoals={activeGoals}
          userId={userId}
          walletCredits={walletCredits}
          onClose={() => setShowOrder(false)}
          onOrderPlaced={() => window.location.reload()}
        />
      )}
    </div>
  );
}
