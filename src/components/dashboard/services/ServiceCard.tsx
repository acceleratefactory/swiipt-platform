"use client";

interface ServicePackage {
  id: string;
  category: string;
  destination: string;
  name: string;
  short_description: string;
  price_ngn: number;
  price_usd: number;
  price_aed: number;
  price_qar: number;
  price_gbp: number;
  processing_weeks_min: number | null;
  processing_weeks_max: number | null;
  is_featured: boolean;
  badge_text: string | null;
}

interface ActiveGoal {
  id: string;
  milestone_100_unlocked: boolean;
}

interface ExistingOrder {
  status: string;
}

interface ServiceCardProps {
  pkg: ServicePackage;
  preferredCurrency: string;
  existingOrder?: ExistingOrder;
  activeGoals: ActiveGoal[];
  onSelect: () => void;
}

const currencySymbols: Record<string, string> = {
  NGN: '₦', USD: '$', AED: 'AED ', QAR: 'QAR ', GBP: '£', CAD: 'CA$', EUR: '€',
};

const categoryColors: Record<string, string> = {
  residency_permit: '#1D4ED8',
  work_visa: '#065F46',
  remote_work_visa: '#6D28D9',
  second_citizenship: '#B45309',
  company_registration: '#0E7490',
  relocation_concierge: '#BE185D',
  landing_package: '#7C3AED',
  diaspora_services: '#374151',
};

export default function ServiceCard({ pkg, preferredCurrency, existingOrder, activeGoals, onSelect }: ServiceCardProps) {
  const currencyKey = `price_${preferredCurrency.toLowerCase()}`;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const price = (pkg as any)[currencyKey] || pkg.price_ngn;
  const symbol = currencySymbols[preferredCurrency] || '₦';

  const hasDiscount = activeGoals.some(g => g.milestone_100_unlocked);
  const discountedPrice = hasDiscount ? price * 0.85 : price;

  const color = categoryColors[pkg.category] || 'var(--midnight)';

  return (
    <div style={{
      background: 'white',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--border)',
      overflow: 'hidden',
      cursor: existingOrder ? 'default' : 'pointer',
    }}
    onClick={existingOrder ? undefined : onSelect}
    onMouseEnter={e => { if (!existingOrder) { (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-md)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}}
    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'none'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
    >
      <div style={{ height: '4px', background: color }} />

      <div style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.875rem', flexWrap: 'wrap' }}>
          {pkg.badge_text && (
            <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '3px 8px', borderRadius: '20px', background: `${color}15`, color }}>
              {pkg.badge_text}
            </span>
          )}
          {pkg.is_featured && (
            <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '3px 8px', borderRadius: '20px', background: 'var(--teal-pale)', color: 'var(--teal)' }}>
              ⭐ Featured
            </span>
          )}
          {existingOrder && (
            <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '3px 8px', borderRadius: '20px', background: '#DBEAFE', color: '#1D4ED8' }}>
              {existingOrder.status.replace(/_/g, ' ')}
            </span>
          )}
        </div>

        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
          🌍 {pkg.destination}
        </p>
        <h3 style={{ fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', fontSize: '1rem', fontWeight: 700, color: 'var(--midnight)', marginBottom: '0.625rem', lineHeight: 1.3 }}>
          {pkg.name}
        </h3>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1rem' }}>
          {pkg.short_description}
        </p>

        {(pkg.processing_weeks_min || pkg.processing_weeks_max) && (
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
            ⏱ {pkg.processing_weeks_min === pkg.processing_weeks_max
              ? `${pkg.processing_weeks_min} weeks`
              : pkg.processing_weeks_min && pkg.processing_weeks_max
              ? `${pkg.processing_weeks_min}–${pkg.processing_weeks_max} weeks`
              : pkg.processing_weeks_min
              ? `${pkg.processing_weeks_min}+ weeks`
              : 'Fast turnaround'}
          </p>
        )}

        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '1rem' }}>
          {hasDiscount ? (
            <>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                {symbol}{price.toLocaleString()}
              </span>
              <span style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--teal)' }}>
                {symbol}{Math.round(discountedPrice).toLocaleString()}
              </span>
              <span style={{ fontSize: '0.7rem', background: 'var(--teal-pale)', color: 'var(--teal)', fontWeight: 700, padding: '2px 6px', borderRadius: '20px' }}>
                15% off
              </span>
            </>
          ) : (
            <span style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--midnight)' }}>
              From {symbol}{price.toLocaleString()}
            </span>
          )}
        </div>

        {existingOrder ? (
          <a href="/dashboard/services" style={{ display: 'block', padding: '0.625rem', background: 'var(--gray-100)', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.875rem', borderRadius: 'var(--radius-md)', textAlign: 'center', textDecoration: 'none' }}>
            View order status →
          </a>
        ) : (
          <button
            onClick={onSelect}
            style={{ width: '100%', padding: '0.625rem', background: color, color: 'white', fontWeight: 700, fontSize: '0.875rem', borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer' }}
          >
            Order this service →
          </button>
        )}
      </div>
    </div>
  );
}
