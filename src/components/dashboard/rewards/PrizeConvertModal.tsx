"use client";
import { useState } from "react";

/* eslint-disable @typescript-eslint/no-explicit-any */
export default function PrizeConvertModal({ reward, activeGoals, onClose, onConverted }: { reward: any; activeGoals: any[]; onClose: () => void; onConverted: () => void }) {
  const [selectedGoalId, setSelectedGoalId] = useState("");
  const [createNew, setCreateNew] = useState(true);
  const [loading, setLoading] = useState(false);

  const creditValues: Record<string, number> = {
    welcome_gift: 25000, streak_30day: 5000, streak_90day: 25000,
    "25_percent": 15000, "50_percent": 20000, "75_percent": 30000,
  };
  const creditAmount = creditValues[reward.milestone_type] || 10000;

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 50 }} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'white', borderRadius: 'var(--radius-xl)', padding: '2rem', width: '460px', maxWidth: '95vw', zIndex: 51, boxShadow: 'var(--shadow-lg)' }}>
        <h3 style={{ fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', fontWeight: 700, color: 'var(--midnight)', marginBottom: '0.5rem' }}>
          Convert to travel credit
        </h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
          Convert <strong>{reward.reward_label}</strong> to <strong>₦{creditAmount.toLocaleString()}</strong> locked travel credit.
        </p>

        <div style={{ background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 'var(--radius-md)', padding: '0.75rem', marginBottom: '1.25rem', fontSize: '0.8125rem', color: '#92400E' }}>
          ⚠️ Credits are locked — they can only be used toward a travel goal or service. They cannot be withdrawn as cash.
        </div>

        <div style={{ marginBottom: '1.25rem' }}>
          <button
            onClick={() => setCreateNew(true)}
            style={{ width: '100%', padding: '0.875rem', border: createNew ? '2px solid var(--teal)' : '1px solid var(--border)', background: createNew ? 'var(--teal-pale)' : 'white', borderRadius: 'var(--radius-md)', textAlign: 'left', cursor: 'pointer', marginBottom: '0.5rem' }}
          >
            <p style={{ fontWeight: 600, color: 'var(--midnight)', fontSize: '0.9375rem' }}>Create new credit goal</p>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>A new locked goal will be created with ₦{creditAmount.toLocaleString()}</p>
          </button>

          {activeGoals.length > 0 && (
            <button
              onClick={() => setCreateNew(false)}
              style={{ width: '100%', padding: '0.875rem', border: !createNew ? '2px solid var(--teal)' : '1px solid var(--border)', background: !createNew ? 'var(--teal-pale)' : 'white', borderRadius: 'var(--radius-md)', textAlign: 'left', cursor: 'pointer' }}
            >
              <p style={{ fontWeight: 600, color: 'var(--midnight)', fontSize: '0.9375rem' }}>Add to existing goal</p>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Top up one of your active goals</p>
            </button>
          )}
        </div>

        {!createNew && (
          <div style={{ marginBottom: '1.25rem' }}>
            {activeGoals.map((g: any) => (
              <button key={g.id} onClick={() => setSelectedGoalId(g.id)} style={{ width: '100%', padding: '0.75rem', border: selectedGoalId === g.id ? '2px solid var(--teal)' : '1px solid var(--border)', borderRadius: 'var(--radius-md)', background: selectedGoalId === g.id ? 'var(--teal-pale)' : 'white', textAlign: 'left', cursor: 'pointer', marginBottom: '0.375rem' }}>
                <p style={{ fontWeight: 600, color: 'var(--midnight)', fontSize: '0.875rem' }}>{g.goal_name}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{g.currency} {g.current_balance.toLocaleString()} saved</p>
              </button>
            ))}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <button onClick={onClose} style={{ padding: '0.75rem', background: 'var(--gray-100)', color: 'var(--text-secondary)', fontWeight: 600, borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer' }}>
            Cancel
          </button>
          <button
            disabled={loading || (!createNew && !selectedGoalId)}
            onClick={async () => {
              setLoading(true);
              const res = await fetch("/api/rewards/convert", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ rewardId: reward.id, goalId: createNew ? null : selectedGoalId }),
              });
              if (res.ok) onConverted();
              setLoading(false);
            }}
            style={{ padding: '0.75rem', background: loading ? 'var(--gray-100)' : 'var(--teal)', color: loading ? 'var(--text-muted)' : 'var(--midnight)', fontWeight: 700, borderRadius: 'var(--radius-md)', border: 'none', cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            {loading ? "Converting..." : "Convert ✓"}
          </button>
        </div>
      </div>
    </>
  );
}
/* eslint-enable @typescript-eslint/no-explicit-any */
