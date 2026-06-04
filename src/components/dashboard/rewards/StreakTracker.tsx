export default function StreakTracker({ streak30Weeks, streak90Weeks }: { streak30Weeks: number; streak90Weeks: number }) {
  const streaks = [
    {
      title: "30-day streak",
      current: streak30Weeks,
      target: 4,
      prize: "Free Visa Photographs",
      description: "Deposit at least once per week for 4 consecutive weeks",
      color: '#F59E0B',
    },
    {
      title: "90-day streak",
      current: streak90Weeks,
      target: 12,
      prize: "Free Qatar Tourist Visa Processing",
      description: "Consistent deposits across 12 consecutive weeks",
      color: 'var(--teal)',
      headline: true,
    },
  ];

  return (
    <div style={{ marginBottom: '1rem' }}>
      <h2 style={{ fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', fontSize: '1rem', fontWeight: 700, color: 'var(--midnight)', marginBottom: '1rem' }}>
        Saving streaks
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.75rem' }}>
        {streaks.map(streak => (
          <div key={streak.title} style={{ background: 'white', borderRadius: 'var(--radius-lg)', border: streak.headline ? `2px solid ${streak.color}` : '1px solid var(--border)', padding: '1.25rem', position: 'relative', overflow: 'hidden' }}>
            {streak.headline && (
              <div style={{ position: 'absolute', top: 0, right: 0, background: streak.color, color: 'white', fontSize: '0.65rem', fontWeight: 700, padding: '3px 10px', borderBottomLeftRadius: 'var(--radius-sm)' }}>
                HEADLINE PRIZE
              </div>
            )}
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.375rem' }}>
              {streak.title}
            </p>
            <p style={{ fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', fontSize: '1.75rem', fontWeight: 800, color: 'var(--midnight)', marginBottom: '0.25rem' }}>
              {streak.current} <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 400 }}>/ {streak.target} weeks</span>
            </p>

            <div style={{ height: '6px', background: 'var(--gray-100)', borderRadius: '3px', overflow: 'hidden', margin: '0.75rem 0' }}>
              <div style={{ height: '100%', width: `${(streak.current / streak.target) * 100}%`, background: streak.color, borderRadius: '3px', transition: 'width 0.5s ease' }} />
            </div>

            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '0.625rem', lineHeight: 1.4 }}>
              {streak.description}
            </p>

            <div style={{ padding: '0.5rem 0.75rem', background: `${streak.color}15`, borderRadius: 'var(--radius-sm)' }}>
              <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: streak.color }}>
                Prize: {streak.prize}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
