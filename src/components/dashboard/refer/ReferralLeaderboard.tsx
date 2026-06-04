// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function ReferralLeaderboard({ entry }: { entry: any }) {
  if (!entry) {
    return (
      <div style={{ background: 'white', borderRadius: 'var(--radius-md)', padding: '1rem', border: '1px solid var(--border)' }}>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.375rem' }}>Your rank</p>
        <p style={{ fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', fontSize: '1.375rem', fontWeight: 800, color: 'var(--text-muted)' }}>—</p>
        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Refer 2+ to appear</p>
      </div>
    );
  }

  return (
    <div style={{ background: 'white', borderRadius: 'var(--radius-md)', padding: '1rem', border: '1px solid var(--border)' }}>
      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.375rem' }}>Your leaderboard rank</p>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
        <span style={{ fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', fontSize: '1.75rem', fontWeight: 800, color: '#F59E0B' }}>
          #{entry.rank}
        </span>
        <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
          {entry.referral_count} referral{entry.referral_count !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  );
}
