"use client";
import { useState } from "react";

const statusColors: Record<string, { bg: string; color: string }> = {
  initiated: { bg: '#F3F4F6', color: '#6B7280' },
  payment_pending: { bg: '#FEF3C7', color: '#B45309' },
  payment_confirmed: { bg: 'var(--teal-pale)', color: 'var(--teal)' },
  documents_requested: { bg: '#FEF3C7', color: '#B45309' },
  documents_received: { bg: '#DBEAFE', color: '#1D4ED8' },
  in_progress: { bg: '#DBEAFE', color: '#1D4ED8' },
  awaiting_approval: { bg: '#EDE9FE', color: '#6D28D9' },
  approved: { bg: 'var(--teal-pale)', color: 'var(--teal)' },
  completed: { bg: 'var(--teal-pale)', color: 'var(--teal)' },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function OrdersTable({ orders }: { orders: any[] }) {
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = statusFilter === "all" ? orders : orders.filter(o => o.status === statusFilter);
  const uniqueStatuses = ["all"] as string[];
  orders.forEach(o => { if (!uniqueStatuses.includes(o.status)) uniqueStatuses.push(o.status); });

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
              <th style={{ textAlign: 'left', padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--midnight)' }}>User</th>
              <th style={{ textAlign: 'left', padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--midnight)' }}>Service</th>
              <th style={{ textAlign: 'left', padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--midnight)' }}>Payment</th>
              <th style={{ textAlign: 'left', padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--midnight)' }}>Status</th>
              <th style={{ textAlign: 'left', padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--midnight)' }}>Created</th>
              <th style={{ textAlign: 'right', padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--midnight)' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(order => {
              const sc = statusColors[order.status] || { bg: '#F3F4F6', color: '#6B7280' };
              return (
                <tr key={order.id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <p style={{ fontWeight: 600, color: 'var(--midnight)' }}>{order.users?.full_name || 'N/A'}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{order.users?.email}</p>
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <p style={{ color: 'var(--midnight)' }}>{order.service_packages?.name}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{order.service_packages?.destination}</p>
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <p style={{ color: 'var(--midnight)' }}>{order.payment_method || '-'}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{order.price_paid ? `${order.currency || 'NGN'} ${Number(order.price_paid).toLocaleString()}` : '-'}</p>
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: '20px', background: sc.bg, color: sc.color }}>
                      {order.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)' }}>
                    {new Date(order.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                    <a
                      href={`/admin/orders/${order.id}`}
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
          No orders found for this filter.
        </p>
      )}
    </div>
  );
}
