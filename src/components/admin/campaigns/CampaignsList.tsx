"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";

const rewardTypes: Record<string, string> = {
  fixed: "Fixed ₦ reward per conversion",
  per_invite: "₦ per invite converted",
  tiered: "Tiered rewards by invite count",
};

export default function CampaignsList({ campaigns: initial }: { campaigns: any[] }) {
  const [campaigns, setCampaigns] = useState(initial);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  async function handleToggle(id: string) {
    setTogglingId(id);
    try {
      const res = await fetch("/api/admin/campaigns/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (res.ok) {
        setCampaigns(prev => prev.map(c => c.id === id ? { ...c, is_active: data.is_active } : c));
      }
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', overflow: 'hidden' }}>
      {campaigns.length === 0 ? (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No campaigns yet. Create your first one!</p>
        </div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--off-white)' }}>
              <th style={{ textAlign: 'left', padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--midnight)' }}>Title</th>
              <th style={{ textAlign: 'left', padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--midnight)' }}>Reward Type</th>
              <th style={{ textAlign: 'left', padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--midnight)' }}>Reward (₦)</th>
              <th style={{ textAlign: 'left', padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--midnight)' }}>Dates</th>
              <th style={{ textAlign: 'center', padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--midnight)' }}>Participants</th>
              <th style={{ textAlign: 'center', padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--midnight)' }}>Active</th>
              <th style={{ textAlign: 'right', padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--midnight)' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map(c => {
              const rewardLabel = rewardTypes[c.reward_type] || c.reward_type;
              return (
                <tr key={c.id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: 'var(--midnight)' }}>{c.title}</td>
                  <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{rewardLabel}</td>
                  <td style={{ padding: '0.75rem 1rem', color: 'var(--teal)', fontWeight: 600 }}>
                    {c.reward_amount_ngn?.toLocaleString() || "—"}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                    {c.starts_at ? new Date(c.starts_at).toLocaleDateString("en-NG", { month: "short", day: "numeric" }) : "—"}
                    {" — "}
                    {c.ends_at ? new Date(c.ends_at).toLocaleDateString("en-NG", { month: "short", day: "numeric" }) : "—"}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    {c.current_participants || 0}{c.max_participants ? ` / ${c.max_participants}` : ""}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '3px 10px', borderRadius: '20px', background: c.is_active ? 'var(--teal-pale)' : '#FEF3C7', color: c.is_active ? 'var(--teal)' : '#D97706' }}>
                      {c.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                    <button
                      onClick={() => handleToggle(c.id)}
                      disabled={togglingId === c.id}
                      style={{ padding: '0.375rem 0.625rem', background: c.is_active ? '#FEF3C7' : 'var(--teal-pale)', color: c.is_active ? '#D97706' : 'var(--teal)', fontWeight: 600, fontSize: '0.7rem', borderRadius: 'var(--radius-sm)', border: 'none', cursor: togglingId === c.id ? 'not-allowed' : 'pointer' }}
                    >
                      {togglingId === c.id ? "..." : c.is_active ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
/* eslint-enable @typescript-eslint/no-explicit-any */
