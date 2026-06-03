interface RecentDeposit {
  id: string;
  payment_reference: string;
  currency: string;
  amount: number;
  users?: { full_name: string; email: string } | null;
}

interface RecentSignup {
  id: string;
  full_name: string;
  email: string;
  created_at: string;
}

interface RecentActivityFeedProps {
  recentDeposits: RecentDeposit[];
  recentSignups: RecentSignup[];
}

export default function RecentActivityFeed({ recentDeposits, recentSignups }: RecentActivityFeedProps) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>

      <div style={{ background: 'white', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', overflow: 'hidden' }}>
        <div style={{ padding: '0.875rem 1rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--midnight)' }}>Pending deposits</h3>
          <a href="/admin/deposits" style={{ fontSize: '0.75rem', color: 'var(--teal)', fontWeight: 600, textDecoration: 'none' }}>View all →</a>
        </div>
        {recentDeposits.length === 0 ? (
          <p style={{ padding: '1rem', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>No pending deposits.</p>
        ) : (
          recentDeposits.map(d => (
            <div key={d.id} style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--gray-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--midnight)' }}>{d.users?.full_name}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{d.payment_reference}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--midnight)' }}>{d.currency} {d.amount.toLocaleString()}</p>
                <a href="/admin/deposits" style={{ fontSize: '0.7rem', color: 'var(--teal)', fontWeight: 600, textDecoration: 'none' }}>Confirm →</a>
              </div>
            </div>
          ))
        )}
      </div>

      <div style={{ background: 'white', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', overflow: 'hidden' }}>
        <div style={{ padding: '0.875rem 1rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--midnight)' }}>Recent signups</h3>
          <a href="/admin/users" style={{ fontSize: '0.75rem', color: 'var(--teal)', fontWeight: 600, textDecoration: 'none' }}>View all →</a>
        </div>
        {recentSignups.map(u => (
          <div key={u.id} style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--gray-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--midnight)' }}>{u.full_name}</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.email}</p>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {new Date(u.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}
            </p>
          </div>
        ))}
      </div>

    </div>
  );
}
