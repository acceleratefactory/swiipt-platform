export default function MobilityScoreCard({ score }: { score: number }) {
  const maxScore = 1000;
  const pct = (score / maxScore) * 100;

  const tiers = [
    { min: 0, max: 199, label: "Explorer", color: '#6B7280' },
    { min: 200, max: 399, label: "Mover", color: '#3B82F6' },
    { min: 400, max: 599, label: "Pathfinder", color: '#8B5CF6' },
    { min: 600, max: 799, label: "Global", color: '#F59E0B' },
    { min: 800, max: 999, label: "Elite", color: 'var(--teal)' },
    { min: 1000, max: 1000, label: "Legend", color: '#EF4444' },
  ];

  const currentTier = tiers.find(t => score >= t.min && score <= t.max) || tiers[0];
  const nextTier = tiers[tiers.indexOf(currentTier) + 1];

  const tierUnlocks: Record<string, string> = {
    "200": "Destination community access",
    "400": "Monthly case manager check-in",
    "600": "Early access to new services",
    "800": "VIP processing — same-week submissions",
    "1000": "Lifetime legend status",
  };

  return (
    <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: '1.5rem', border: '1px solid var(--border)', marginBottom: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
        <div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.25rem' }}>
            Mobility Score
          </p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            <span style={{ fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', fontSize: '2.5rem', fontWeight: 800, color: 'var(--midnight)' }}>
              {score}
            </span>
            <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/ {maxScore}</span>
          </div>
        </div>
        <span style={{ padding: '4px 12px', borderRadius: '20px', background: `${currentTier.color}20`, color: currentTier.color, fontWeight: 700, fontSize: '0.8125rem' }}>
          {currentTier.label}
        </span>
      </div>

      <div style={{ height: '8px', background: 'var(--gray-100)', borderRadius: '4px', overflow: 'hidden', marginBottom: '0.75rem' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: currentTier.color, borderRadius: '4px', transition: 'width 0.8s ease' }} />
      </div>

      {nextTier && (
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
          {nextTier.min - score} points to <strong style={{ color: nextTier.color }}>{nextTier.label}</strong>
          {tierUnlocks[String(nextTier.min)] && ` — unlocks ${tierUnlocks[String(nextTier.min)]}`}
        </p>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.5rem', marginTop: '1rem' }}>
        {Object.entries(tierUnlocks).map(([threshold, benefit]) => {
          const unlocked = score >= Number(threshold);
          return (
            <div key={threshold} style={{ padding: '0.625rem 0.75rem', borderRadius: 'var(--radius-sm)', background: unlocked ? 'var(--teal-pale)' : 'var(--gray-100)', border: `1px solid ${unlocked ? 'var(--teal)' : 'transparent'}` }}>
              <p style={{ fontSize: '0.7rem', fontWeight: 700, color: unlocked ? 'var(--teal)' : 'var(--text-muted)' }}>
                {unlocked ? '✓' : '🔒'} {threshold}+ points
              </p>
              <p style={{ fontSize: '0.75rem', color: unlocked ? 'var(--text-secondary)' : 'var(--text-muted)', marginTop: '0.125rem', lineHeight: 1.3 }}>
                {benefit}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
