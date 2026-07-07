"use client";
import { useState } from "react";

const typeColors: Record<string, string> = {
  job: "var(--teal)",
  scholarship: "#7C3AED",
  visa_programme: "#2563EB",
  sports_trial: "#DC2626",
  remote_work: "#0891B2",
  training: "#D97706",
};

export default function OpportunitiesList({ opportunities: initial, degradedSources }: { opportunities: any[]; degradedSources?: Set<string> }) {
  const [opportunities, setOpportunities] = useState(initial);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  async function handleToggle(id: string) {
    setTogglingId(id);
    try {
      const res = await fetch("/api/admin/opportunities/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (res.ok) {
        setOpportunities(prev => prev.map(o => o.id === id ? { ...o, is_active: data.is_active } : o));
      }
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', overflow: 'hidden' }}>
      {opportunities.length === 0 ? (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No opportunities yet. Create one or run the AI refresh cron.</p>
        </div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--off-white)' }}>
              <th style={{ textAlign: 'left', padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--midnight)' }}>Title</th>
              <th style={{ textAlign: 'left', padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--midnight)' }}>Org</th>
              <th style={{ textAlign: 'left', padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--midnight)' }}>Segment</th>
              <th style={{ textAlign: 'left', padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--midnight)' }}>Type</th>
              <th style={{ textAlign: 'center', padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--midnight)' }}>Views</th>
              <th style={{ textAlign: 'center', padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--midnight)' }}>Applies</th>
              <th style={{ textAlign: 'center', padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--midnight)' }}>Status</th>
              <th style={{ textAlign: 'right', padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--midnight)' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {opportunities.map(o => (
              <tr key={o.id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: 'var(--midnight)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  <a href={`/admin/opportunities/${o.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>{o.title}</a>
                </td>
                <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                  {o.organisation}
                  {degradedSources?.has(o.source_name) && (
                    <span title={`Source "${o.source_name}" is degraded`} style={{ display: 'inline-block', marginLeft: '0.375rem', padding: '1px 6px', borderRadius: '10px', fontSize: '0.6rem', fontWeight: 700, background: '#FEF3C7', color: '#D97706', verticalAlign: 'middle' }}>⚠ Source</span>
                  )}
                </td>
                <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{o.segment_slug}</td>
                <td style={{ padding: '0.75rem 1rem' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: '20px', background: `${typeColors[o.type] || 'var(--text-muted)'}18`, color: typeColors[o.type] || 'var(--text-muted)' }}>
                    {o.type.replace(/_/g, " ")}
                  </span>
                </td>
                <td style={{ padding: '0.75rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>{o.view_count || 0}</td>
                <td style={{ padding: '0.75rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>{o.apply_click_count || 0}</td>
                <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '3px 10px', borderRadius: '20px', background: o.is_active ? 'var(--teal-pale)' : '#FEF3C7', color: o.is_active ? 'var(--teal)' : '#D97706' }}>
                    {o.is_active ? "Active" : "Inactive"}
                  </span>
                  {o.ai_generated && <span style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>AI</span>}
                </td>
                <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '0.375rem', justifyContent: 'flex-end' }}>
                    <a href={`/admin/opportunities/${o.id}`} style={{ padding: '0.375rem 0.5rem', background: 'transparent', color: 'var(--teal)', fontWeight: 600, fontSize: '0.7rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', textDecoration: 'none' }}>
                      Edit
                    </a>
                    <button
                      onClick={() => handleToggle(o.id)}
                      disabled={togglingId === o.id}
                      style={{ padding: '0.375rem 0.625rem', background: o.is_active ? '#FEF3C7' : 'var(--teal-pale)', color: o.is_active ? '#D97706' : 'var(--teal)', fontWeight: 600, fontSize: '0.7rem', borderRadius: 'var(--radius-sm)', border: 'none', cursor: togglingId === o.id ? 'not-allowed' : 'pointer' }}
                    >
                      {togglingId === o.id ? "..." : o.is_active ? "Deactivate" : "Activate"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
