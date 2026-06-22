"use client";

import { useState } from "react";

interface DepositSummary {
  id: string;
  payment_reference: string;
  currency: string;
  amount: number;
  user_confirmed_at: string;
  users?: { full_name: string; email: string } | null;
  savings_goals?: { goal_name: string } | null;
}

interface ConfirmDepositModalProps {
  deposit: DepositSummary;
  onConfirm: (notes: string) => void;
  onClose: () => void;
  loading: boolean;
  error?: string;
}

export default function ConfirmDepositModal({ deposit, onConfirm, onClose, loading, error }: ConfirmDepositModalProps) {
  const [notes, setNotes] = useState("");

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 50 }} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        background: 'white', borderRadius: 'var(--radius-xl)',
        padding: '2rem', width: '480px', maxWidth: '95vw',
        zIndex: 51, boxShadow: 'var(--shadow-lg)',
      }}>
        <h3 style={{ fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', fontSize: '1.125rem', fontWeight: 700, color: 'var(--midnight)', marginBottom: '1.25rem' }}>
          Confirm deposit
        </h3>

        <div style={{ background: 'var(--off-white)', borderRadius: 'var(--radius-md)', padding: '1rem', marginBottom: '1.25rem' }}>
          {[
            { label: 'User', value: `${deposit.users?.full_name} (${deposit.users?.email})` },
            { label: 'Amount', value: `${deposit.currency} ${deposit.amount.toLocaleString()}` },
            { label: 'Reference', value: deposit.payment_reference },
            { label: 'Goal', value: deposit.savings_goals?.goal_name || 'Free wallet balance' },
            { label: 'Submitted', value: new Date(deposit.user_confirmed_at).toLocaleString('en-NG') },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.375rem 0', borderBottom: '1px solid var(--gray-100)', fontSize: '0.875rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>{item.label}</span>
              <span style={{ fontWeight: 600, color: 'var(--midnight)', textAlign: 'right', maxWidth: '60%', wordBreak: 'break-all' }}>{item.value}</span>
            </div>
          ))}
        </div>

        <div style={{ background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 'var(--radius-md)', padding: '0.75rem', marginBottom: '1rem', fontSize: '0.8125rem', color: '#92400E' }}>
          ⚠️ Verify this transfer in your bank app before confirming. Reference must match exactly. <strong>This cannot be undone.</strong>
        </div>

        {error && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 'var(--radius-md)', padding: '0.75rem', marginBottom: '1rem', fontSize: '0.8125rem', color: 'var(--danger)' }}>
            {error}
          </div>
        )}

        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--midnight)', display: 'block', marginBottom: '0.375rem' }}>
            Notes (optional)
          </label>
          <input
            type="text"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="e.g. Confirmed via bank statement 03/06"
            style={{ width: '100%', padding: '0.625rem 0.875rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', outline: 'none' }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <button
            onClick={onClose}
            style={{ padding: '0.75rem', background: 'var(--gray-100)', color: 'var(--text-secondary)', fontWeight: 600, borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(notes)}
            disabled={loading}
            style={{ padding: '0.75rem', background: loading ? 'var(--gray-300)' : 'var(--teal)', color: 'var(--midnight)', fontWeight: 700, borderRadius: 'var(--radius-md)', border: 'none', cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            {loading ? "Confirming..." : "Confirm deposit ✓"}
          </button>
        </div>
      </div>
    </>
  );
}
