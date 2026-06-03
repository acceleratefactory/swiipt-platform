export default function DocumentReadinessScore({ verifiedCount, totalRequested, mobilityScore }: { verifiedCount: number; totalRequested: number; mobilityScore: number }) {
  const pct = totalRequested > 0 ? Math.round((verifiedCount / totalRequested) * 100) : 0;

  return (
    <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: '1.25rem', border: '1px solid var(--border)', marginBottom: '1.5rem', display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
      <div style={{ flex: 1, minWidth: 200 }}>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.375rem' }}>Document readiness</p>
        <div style={{ height: '8px', background: 'var(--gray-100)', borderRadius: '4px', overflow: 'hidden', marginBottom: '0.5rem' }}>
          <div style={{ height: '100%', background: 'var(--teal)', width: `${pct}%`, transition: 'width 0.5s ease', borderRadius: '4px' }} />
        </div>
        <p style={{ fontSize: '0.875rem', color: 'var(--midnight)' }}>
          <strong>{verifiedCount}</strong> of <strong>{totalRequested}</strong> documents verified
        </p>
      </div>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Mobility score</p>
        <p style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--midnight)', fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif' }}>
          {mobilityScore}
        </p>
        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>of 1000</p>
      </div>
      <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', maxWidth: 200 }}>
        Upload and verify all requested documents to earn Mobility Score points and keep your application on track.
      </div>
    </div>
  );
}
