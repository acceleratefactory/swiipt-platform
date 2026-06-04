// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function WinWithSwiipt({ prizes }: { prizes: any[] }) {
  const topPrize = prizes.find(p => p.rank_position === 1);

  return (
    <div style={{ background: 'linear-gradient(135deg, var(--midnight), var(--midnight-muted))', borderRadius: 'var(--radius-xl)', padding: '1.75rem', marginBottom: '1rem', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, borderRadius: '50%', background: 'rgba(0,200,150,0.1)' }} />
      <div style={{ position: 'absolute', bottom: -30, right: 40, width: 80, height: 80, borderRadius: '50%', background: 'rgba(0,200,150,0.08)' }} />

      <p style={{ fontSize: '0.75rem', color: 'var(--teal)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
        This month&apos;s top prize
      </p>
      <h2 style={{ fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', fontSize: '1.5rem', fontWeight: 800, color: 'white', marginBottom: '0.5rem', lineHeight: 1.2 }}>
        🏆 {topPrize?.prize_label || "Free Qatar Residence Permit"}
      </h2>
      <p style={{ fontSize: '0.875rem', color: 'var(--gray-300)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
        {topPrize?.prize_description || "Full residence permit processing — we handle everything."}
      </p>

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <a href="/dashboard/refer" style={{ padding: '0.625rem 1.25rem', background: 'var(--teal)', color: 'var(--midnight)', fontWeight: 700, fontSize: '0.875rem', borderRadius: 'var(--radius-md)', textDecoration: 'none' }}>
          Refer to win →
        </a>
        <span style={{ padding: '0.625rem 1rem', background: 'rgba(255,255,255,0.1)', color: 'white', fontSize: '0.8125rem', borderRadius: 'var(--radius-md)' }}>
          Refer 2+ people to qualify
        </span>
      </div>

      {prizes.filter(p => p.rank_position > 1).length > 0 && (
        <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {prizes.filter(p => p.rank_position > 1).map(p => (
            <span key={p.id} style={{ fontSize: '0.8125rem', color: 'var(--gray-300)' }}>
              {p.rank_position === 2 ? '🥈' : p.rank_position === 3 ? '🥉' : `${p.rank_position}th`} {p.prize_label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
