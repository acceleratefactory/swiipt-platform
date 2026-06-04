"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";

export default function PrizeConfigForm({ prizes, onSave }: { prizes: any[]; onSave: (prizeId: string, updates: any) => Promise<void> }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, { label: string; description: string; value_ngn: string }>>({});

  const rankLabels: Record<number, string> = { 1: "1st", 2: "2nd", 3: "3rd" };

  function handleEdit(prize: any) {
    setEditingId(prize.id);
    setFormData(prev => ({
      ...prev,
      [prize.id]: {
        label: prize.prize_label || "",
        description: prize.prize_description || "",
        value_ngn: prize.prize_value_ngn?.toString() || "",
      },
    }));
  }

  async function handleSave(prizeId: string) {
    setSaving(prizeId);
    await onSave(prizeId, formData[prizeId]);
    setSaving(null);
    setEditingId(null);
  }

  return (
    <div>
      {prizes.map(prize => (
        <div key={prize.id} style={{ padding: '1rem 0', borderBottom: '1px solid var(--gray-100)' }}>
          {editingId === prize.id ? (
            <div>
              <div style={{ display: 'grid', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Prize label</label>
                  <input
                    value={formData[prize.id]?.label || ""}
                    onChange={e => setFormData(prev => ({ ...prev, [prize.id]: { ...prev[prize.id], label: e.target.value } }))}
                    style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Description</label>
                  <input
                    value={formData[prize.id]?.description || ""}
                    onChange={e => setFormData(prev => ({ ...prev, [prize.id]: { ...prev[prize.id], description: e.target.value } }))}
                    style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Value (NGN)</label>
                  <input
                    type="number"
                    value={formData[prize.id]?.value_ngn || ""}
                    onChange={e => setFormData(prev => ({ ...prev, [prize.id]: { ...prev[prize.id], value_ngn: e.target.value } }))}
                    style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem' }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => handleSave(prize.id)}
                  disabled={saving === prize.id}
                  style={{ padding: '0.5rem 1rem', background: 'var(--teal)', color: 'var(--midnight)', fontWeight: 700, fontSize: '0.8125rem', borderRadius: 'var(--radius-sm)', border: 'none', cursor: saving === prize.id ? 'not-allowed' : 'pointer', opacity: saving === prize.id ? 0.6 : 1 }}
                >
                  {saving === prize.id ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  style={{ padding: '0.5rem 1rem', background: 'transparent', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.8125rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', cursor: 'pointer' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--midnight)' }}>
                  {rankLabels[prize.rank_position] || `${prize.rank_position}th`} place
                </p>
                <p style={{ fontSize: '0.9375rem', color: 'var(--teal)', fontWeight: 600 }}>{prize.prize_label}</p>
                {prize.prize_description && (
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{prize.prize_description}</p>
                )}
                {prize.prize_value_ngn && (
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>₦{Number(prize.prize_value_ngn).toLocaleString()}</p>
                )}
              </div>
              <button
                onClick={() => handleEdit(prize)}
                style={{ padding: '0.375rem 0.75rem', background: 'var(--off-white)', color: 'var(--midnight)', fontWeight: 600, fontSize: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', cursor: 'pointer' }}
              >
                Edit
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
/* eslint-enable @typescript-eslint/no-explicit-any */
