"use client";

import { useState } from "react";

interface WithdrawalRecord {
  id: string;
  status: string;
  currency: string;
  gross_amount: number;
  net_amount: number;
  penalty_amount: number;
  is_early_exit: boolean;
  bank_name: string;
  account_number: string;
  account_name: string;
  requested_at: string;
  processed_at: string | null;
  users?: { full_name: string; email: string } | null;
  savings_goals?: { goal_name: string } | null;
}

interface WithdrawalRequestsTableProps {
  pendingWithdrawals: WithdrawalRecord[];
  recentProcessed: WithdrawalRecord[];
}

export default function WithdrawalRequestsTable({ pendingWithdrawals, recentProcessed }: WithdrawalRequestsTableProps) {
  const [processing, setProcessing] = useState<string | null>(null);

  async function handleAction(withdrawalId: string, action: 'complete' | 'reject') {
    if (!confirm(`${action === 'complete' ? 'Mark as completed' : 'Reject'} this withdrawal?`)) return;
    setProcessing(withdrawalId);
    await fetch("/api/admin/withdrawals/process", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ withdrawalId, action }),
    });
    window.location.reload();
  }

  return (
    <div>
      <div style={{ background: 'white', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', marginBottom: '1.5rem', overflow: 'hidden' }}>
        <div style={{ padding: '0.875rem 1rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <h2 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--midnight)' }}>Pending withdrawals</h2>
          {pendingWithdrawals.length > 0 && (
            <span style={{ background: '#F59E0B', color: 'white', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px' }}>
              {pendingWithdrawals.length}
            </span>
          )}
        </div>

        {pendingWithdrawals.length === 0 ? (
          <p style={{ padding: '1.5rem', fontSize: '0.875rem', color: 'var(--text-muted)', textAlign: 'center' }}>No pending withdrawals.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
            <thead>
              <tr style={{ background: 'var(--gray-100)' }}>
                {["User", "Amount", "Early exit?", "Penalty", "Net payout", "Bank details", "Requested", "Action"].map(h => (
                  <th key={h} style={{ padding: '0.625rem 1rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pendingWithdrawals.map(w => (
                <tr key={w.id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                  <td style={{ padding: '0.625rem 1rem' }}>
                    <p style={{ fontWeight: 600, color: 'var(--midnight)' }}>{w.users?.full_name}</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{w.users?.email}</p>
                  </td>
                  <td style={{ padding: '0.625rem 1rem', fontWeight: 700 }}>{w.currency} {w.gross_amount.toLocaleString()}</td>
                  <td style={{ padding: '0.625rem 1rem' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: '20px', background: w.is_early_exit ? '#FEF2F2' : 'var(--teal-pale)', color: w.is_early_exit ? 'var(--danger)' : 'var(--teal)' }}>
                      {w.is_early_exit ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td style={{ padding: '0.625rem 1rem', color: 'var(--danger)' }}>
                    {w.penalty_amount > 0 ? `- ${w.currency} ${w.penalty_amount.toLocaleString()}` : '—'}
                  </td>
                  <td style={{ padding: '0.625rem 1rem', fontWeight: 700, color: 'var(--teal)' }}>
                    {w.currency} {w.net_amount.toLocaleString()}
                  </td>
                  <td style={{ padding: '0.625rem 1rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    <p>{w.bank_name}</p>
                    <p style={{ fontFamily: 'monospace', fontWeight: 600 }}>{w.account_number}</p>
                    <p>{w.account_name}</p>
                  </td>
                  <td style={{ padding: '0.625rem 1rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {new Date(w.requested_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}
                  </td>
                  <td style={{ padding: '0.625rem 1rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => handleAction(w.id, 'complete')}
                        disabled={processing === w.id}
                        style={{ padding: '0.375rem 0.625rem', background: 'var(--teal)', color: 'var(--midnight)', fontWeight: 700, fontSize: '0.75rem', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer' }}
                      >
                        Done
                      </button>
                      <button
                        onClick={() => handleAction(w.id, 'reject')}
                        disabled={processing === w.id}
                        style={{ padding: '0.375rem 0.625rem', background: 'var(--gray-100)', color: 'var(--danger)', fontWeight: 600, fontSize: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', cursor: 'pointer' }}
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {recentProcessed.length > 0 && (
        <div style={{ background: 'white', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', overflow: 'hidden' }}>
          <div style={{ padding: '0.875rem 1rem', borderBottom: '1px solid var(--border)' }}>
            <h2 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--midnight)' }}>Recent history</h2>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
            <thead>
              <tr style={{ background: 'var(--gray-100)' }}>
                {["User", "Amount", "Net payout", "Bank", "Status", "Processed at"].map(h => (
                  <th key={h} style={{ padding: '0.625rem 1rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentProcessed.map(w => (
                <tr key={w.id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                  <td style={{ padding: '0.625rem 1rem', color: 'var(--midnight)', fontWeight: 500 }}>{w.users?.full_name}</td>
                  <td style={{ padding: '0.625rem 1rem', fontWeight: 700 }}>{w.currency} {w.gross_amount.toLocaleString()}</td>
                  <td style={{ padding: '0.625rem 1rem', fontWeight: 700, color: 'var(--teal)' }}>{w.currency} {w.net_amount.toLocaleString()}</td>
                  <td style={{ padding: '0.625rem 1rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {w.bank_name}<br />
                    <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{w.account_number}</span>
                  </td>
                  <td style={{ padding: '0.625rem 1rem' }}>
                    <span style={{
                      fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: '20px',
                      background: w.status === 'completed' ? 'var(--teal-pale)' : '#FEF2F2',
                      color: w.status === 'completed' ? 'var(--teal)' : 'var(--danger)',
                    }}>
                      {w.status}
                    </span>
                  </td>
                  <td style={{ padding: '0.625rem 1rem', color: 'var(--text-muted)' }}>
                    {w.processed_at ? new Date(w.processed_at).toLocaleString('en-NG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
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
