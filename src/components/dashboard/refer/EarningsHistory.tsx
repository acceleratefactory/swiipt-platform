// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function EarningsHistory({ referrals }: { referrals: any[] }) {
  if (referrals.length === 0) {
    return (
      <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: '2rem', border: '1px solid var(--border)', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No referrals yet. Share your code to start earning.</p>
      </div>
    );
  }

  const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    pending: { label: 'Pending', color: '#B45309', bg: '#FEF3C7' },
    earned: { label: 'Earned', color: 'var(--teal)', bg: 'var(--teal-pale)' },
    paid: { label: 'Paid', color: '#065F46', bg: 'var(--teal-pale)' },
  };

  return (
    <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', overflow: 'hidden' }}>
      <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
        <h3 style={{ fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', fontSize: '1rem', fontWeight: 700, color: 'var(--midnight)' }}>Referral history</h3>
      </div>
      {// eslint-disable-next-line @typescript-eslint/no-explicit-any
        referrals.map((r: any) => {
        const status = statusConfig[r.commission_status] || statusConfig.pending;
        return (
          <div key={r.id} style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid var(--gray-100)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 600, color: 'var(--midnight)', fontSize: '0.875rem' }}>
                {r.referred?.full_name || "Anonymous user"}
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>
                Joined {new Date(r.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              {r.commission_amount_ngn ? (
                <p style={{ fontWeight: 700, color: 'var(--midnight)', fontSize: '0.9375rem' }}>
                  ₦{r.commission_amount_ngn.toLocaleString()}
                </p>
              ) : (
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Awaiting order</p>
              )}
              <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 7px', borderRadius: '20px', background: status.bg, color: status.color }}>
                {status.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
