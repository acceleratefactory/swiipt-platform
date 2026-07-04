"use client";

const tierColors: Record<string, { bg: string; color: string; label: string }> = {
  starter: { bg: "#E5E7EB", color: "#6B7280", label: "Starter" },
  bronze: { bg: "#FEF3C7", color: "#D97706", label: "Bronze" },
  silver: { bg: "#E5E7EB", color: "#6B7280", label: "Silver" },
  gold: { bg: "#FEF3C7", color: "#D97706", label: "Gold" },
  platinum: { bg: "#E5E7EB", color: "#6B7280", label: "Platinum" },
};

const tierProgress: Record<string, { current: number; next: string; nextThreshold: number }> = {
  starter: { current: 0, next: "Bronze", nextThreshold: 10 },
  bronze: { current: 10, next: "Silver", nextThreshold: 25 },
  silver: { current: 25, next: "Gold", nextThreshold: 50 },
  gold: { current: 50, next: "Platinum", nextThreshold: 100 },
  platinum: { current: 100, next: "", nextThreshold: 100 },
};

export default function AffiliateTierBadge({ tier, referrals }: { tier: string; referrals: number }) {
  const info = tierColors[tier] || tierColors.starter;
  const progress = tierProgress[tier] || tierProgress.starter;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <span style={{ padding: '0.375rem 1rem', borderRadius: '20px', fontWeight: 700, fontSize: '0.875rem', background: info.bg, color: info.color }}>
          {info.label}
        </span>
        <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
          {referrals} referral{referrals !== 1 ? 's' : ''}
        </span>
      </div>

      {tier !== "platinum" && (
        <div style={{ marginTop: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.375rem' }}>
            <span>{referrals} / {progress.nextThreshold} → {progress.next}</span>
            <span>{Math.min(100, Math.round((referrals / progress.nextThreshold) * 100))}%</span>
          </div>
          <div style={{ height: '8px', background: 'var(--gray-100)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${Math.min(100, Math.round((referrals / progress.nextThreshold) * 100))}%`, background: 'var(--teal)', borderRadius: '4px', transition: 'width 0.3s ease' }} />
          </div>
        </div>
      )}

      {tier === "platinum" && (
        <p style={{ fontSize: '0.75rem', color: 'var(--teal)', fontWeight: 700, marginTop: '0.5rem' }}>Maximum tier reached</p>
      )}
    </div>
  );
}
