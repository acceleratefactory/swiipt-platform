"use client";

interface DepositHistoryItem {
  id: string;
  status: string;
  currency: string;
  amount: number;
  payment_reference: string;
  admin_confirmed_at: string | null;
  users?: { full_name: string } | null;
}

interface DepositHistoryTableProps {
  deposits: DepositHistoryItem[];
}

export default function DepositHistoryTable({ deposits }: DepositHistoryTableProps) {
  return (
    <div style={{ background: 'white', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', overflow: 'hidden' }}>
      <div style={{ padding: '0.875rem 1rem', borderBottom: '1px solid var(--border)' }}>
        <h2 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--midnight)' }}>Recent history</h2>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
        <thead>
          <tr style={{ background: 'var(--gray-100)' }}>
            {["User", "Amount", "Reference", "Status", "Confirmed at"].map(h => (
              <th key={h} style={{ padding: '0.625rem 1rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)' }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {deposits.map(d => (
            <tr key={d.id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
              <td style={{ padding: '0.625rem 1rem', color: 'var(--midnight)', fontWeight: 500 }}>{d.users?.full_name}</td>
              <td style={{ padding: '0.625rem 1rem', fontWeight: 700 }}>{d.currency} {d.amount.toLocaleString()}</td>
              <td style={{ padding: '0.625rem 1rem', fontFamily: 'monospace', color: 'var(--text-muted)', fontSize: '0.75rem' }}>{d.payment_reference}</td>
              <td style={{ padding: '0.625rem 1rem' }}>
                <span style={{
                  fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: '20px',
                  background: d.status === 'confirmed' ? 'var(--teal-pale)' : '#FEF2F2',
                  color: d.status === 'confirmed' ? 'var(--teal)' : 'var(--danger)',
                }}>
                  {d.status}
                </span>
              </td>
              <td style={{ padding: '0.625rem 1rem', color: 'var(--text-muted)' }}>
                {d.admin_confirmed_at ? new Date(d.admin_confirmed_at).toLocaleString('en-NG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
