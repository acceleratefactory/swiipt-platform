"use client";
import { useState } from "react";

const statusColors: Record<string, { bg: string; color: string }> = {
  open: { bg: 'var(--teal-pale)', color: 'var(--teal)' },
  filled: { bg: '#DBEAFE', color: '#1D4ED8' },
  expired: { bg: '#F3F4F6', color: '#6B7280' },
  completed: { bg: 'var(--teal-pale)', color: 'var(--teal)' },
  cancelled: { bg: '#FEF2F2', color: '#EF4444' },
};

const itemTypeLabels: Record<string, string> = {
  holiday_package: "🏖️ Holiday",
  service: "🔧 Service",
};

export default function GroupsTable({ groups }: { groups: any[] }) {
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = statusFilter === "all" ? groups : groups.filter(g => g.status === statusFilter);
  const uniqueStatuses = ["all"] as string[];
  groups.forEach(g => { if (!uniqueStatuses.includes(g.status)) uniqueStatuses.push(g.status); });

  return (
    <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', overflow: 'hidden' }}>
      <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {uniqueStatuses.map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            style={{
              padding: '0.375rem 0.75rem',
              borderRadius: '20px',
              border: '1px solid var(--border)',
              background: statusFilter === s ? 'var(--midnight)' : 'transparent',
              color: statusFilter === s ? 'white' : 'var(--text-secondary)',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {s === "all" ? "All" : s.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--off-white)' }}>
              <th style={{ textAlign: 'left', padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--midnight)' }}>Group</th>
              <th style={{ textAlign: 'left', padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--midnight)' }}>Creator</th>
              <th style={{ textAlign: 'left', padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--midnight)' }}>Members</th>
              <th style={{ textAlign: 'left', padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--midnight)' }}>Discount</th>
              <th style={{ textAlign: 'left', padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--midnight)' }}>Status</th>
              <th style={{ textAlign: 'left', padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--midnight)' }}>Created</th>
              <th style={{ textAlign: 'right', padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--midnight)' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(group => {
              const sc = statusColors[group.status] || { bg: '#F3F4F6', color: '#6B7280' };
              return (
                <tr key={group.id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <p style={{ fontWeight: 600, color: 'var(--midnight)' }}>{group.title}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{itemTypeLabels[group.item_type] || group.item_type}</p>
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <p style={{ color: 'var(--midnight)' }}>{group.creator?.full_name || 'N/A'}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{group.creator?.email}</p>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: 'var(--midnight)' }}>
                    {group.current_size} / {group.target_size}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: 'var(--teal)', fontWeight: 600 }}>
                    {group.group_discount_pct}%
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: '20px', background: sc.bg, color: sc.color }}>
                      {group.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)' }}>
                    {new Date(group.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                    <a
                      href={`/admin/groups/${group.id}`}
                      style={{ padding: '0.375rem 0.75rem', borderRadius: 'var(--radius-sm)', background: 'var(--teal)', color: 'var(--midnight)', fontWeight: 600, fontSize: '0.75rem', textDecoration: 'none' }}
                    >
                      View
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          No groups found for this filter.
        </p>
      )}
    </div>
  );
}
