"use client";

export default function EarningsDashboard({
  status,
  referrals,
  withdrawals,
}: {
  status: any;
  referrals: any[];
  withdrawals?: any[];
}) {
  return (
    <div>
      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', padding: '1.25rem' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Total Earned</p>
          <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--midnight)' }}>₦{(status.total_earned_ngn || 0).toLocaleString()}</p>
        </div>
        <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', padding: '1.25rem' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Pending</p>
          <p style={{ fontSize: '1.5rem', fontWeight: 800, color: '#D97706' }}>₦{(status.pending_earnings_ngn || 0).toLocaleString()}</p>
        </div>
        <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', padding: '1.25rem' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Withdrawn</p>
          <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--teal)' }}>₦{(status.withdrawn_earnings_ngn || 0).toLocaleString()}</p>
        </div>
        <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', padding: '1.25rem' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Conversion Rate</p>
          <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--midnight)' }}>{status.conversion_rate_pct || 0}%</p>
        </div>
      </div>

      {/* Referral table */}
      <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', fontSize: '0.9375rem', fontWeight: 700, color: 'var(--midnight)' }}>
            Referral History
          </h3>
        </div>
        {referrals.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>No referrals yet. Share your link to start earning.</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--off-white)' }}>
                <th style={{ textAlign: 'left', padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--midnight)' }}>Referred User</th>
                <th style={{ textAlign: 'left', padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--midnight)' }}>Date</th>
                <th style={{ textAlign: 'center', padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--midnight)' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {referrals.map((r: any) => (
                <tr key={r.id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                  <td style={{ padding: '0.75rem 1rem', color: 'var(--midnight)', fontWeight: 600 }}>{r.referred_id?.slice(0, 8)}...</td>
                  <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)' }}>
                    {new Date(r.created_at).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: '20px', background: r.commission_status === "completed" ? 'var(--teal-pale)' : '#FEF3C7', color: r.commission_status === "completed" ? 'var(--teal)' : '#D97706' }}>
                      {r.commission_status === "completed" ? "Paid" : r.commission_status === "pending" ? "Pending" : "Pending"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Withdrawal History */}
      {withdrawals && withdrawals.length > 0 && (
        <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', overflow: 'hidden', marginTop: '1.5rem' }}>
          <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', fontSize: '0.9375rem', fontWeight: 700, color: 'var(--midnight)' }}>
              Withdrawal History
            </h3>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--off-white)' }}>
                <th style={{ textAlign: 'left', padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--midnight)' }}>Requested</th>
                <th style={{ textAlign: 'left', padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--midnight)' }}>Amount</th>
                <th style={{ textAlign: 'center', padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--midnight)' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {withdrawals.map((w: any) => (
                <tr key={w.id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                  <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)' }}>
                    {new Date(w.requested_at).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--midnight)' }}>₦{(w.amount_ngn || 0).toLocaleString()}</td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                    <span style={{
                      fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: '20px',
                      background: w.status === 'approved' ? 'var(--teal-pale)' : w.status === 'rejected' ? '#FEF2F2' : '#FEF3C7',
                      color: w.status === 'approved' ? 'var(--teal)' : w.status === 'rejected' ? 'var(--danger)' : '#B45309',
                    }}>
                      {w.status === 'approved' ? 'Approved' : w.status === 'rejected' ? 'Rejected' : 'Pending'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
