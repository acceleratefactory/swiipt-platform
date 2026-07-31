"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const statusColors: Record<string, { bg: string; color: string }> = {
  payment_pending: { bg: '#FEF3C7', color: '#B45309' },
  payment_submitted: { bg: '#DBEAFE', color: '#1D4ED8' },
  payment_confirmed: { bg: 'var(--teal-pale)', color: 'var(--teal)' },
  completed: { bg: 'var(--teal-pale)', color: 'var(--teal)' },
  cancelled: { bg: '#F3F4F6', color: '#6B7280' },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function HolidayBookingsPanel({ bookings }: { bookings: any[] }) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState("");

  const filtered = statusFilter === "all" ? bookings : bookings.filter((b: any) => b.status === statusFilter);
  const uniqueStatuses = ["all"] as string[];
  bookings.forEach((b: any) => { if (!uniqueStatuses.includes(b.status)) uniqueStatuses.push(b.status); });

  async function handleDelete(booking: any) {
    if (!window.confirm(`Delete booking "${booking.reference}" for ${booking.user?.full_name || "user"}? This cannot be undone.`)) return;
    setDeletingId(booking.id);
    setDeleteError("");
    const res = await fetch("/api/admin/holidays/delete-booking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId: booking.id }),
    });
    setDeletingId(null);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      setDeleteError(err.error || "Failed to delete booking");
      return;
    }
    router.refresh();
  }

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
      {deleteError && (
        <div style={{ padding: '0.625rem 0.875rem', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 'var(--radius-sm)', color: '#B91C1C', fontSize: '0.8125rem', margin: '0 1.25rem 0.75rem' }}>
          {deleteError}
        </div>
      )}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--off-white)' }}>
              <th style={{ textAlign: 'left', padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--midnight)' }}>User</th>
              <th style={{ textAlign: 'left', padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--midnight)' }}>Package</th>
              <th style={{ textAlign: 'left', padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--midnight)' }}>Reference</th>
              <th style={{ textAlign: 'left', padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--midnight)' }}>Travellers</th>
              <th style={{ textAlign: 'left', padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--midnight)' }}>Total</th>
              <th style={{ textAlign: 'left', padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--midnight)' }}>Status</th>
              <th style={{ textAlign: 'left', padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--midnight)' }}>Created</th>
              <th style={{ textAlign: 'left', padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--midnight)' }}></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((booking: any) => {
              const sc = statusColors[booking.status] || { bg: '#F3F4F6', color: '#6B7280' };
              return (
                <tr key={booking.id} onClick={() => router.push(`/admin/holidays/bookings/${booking.id}`)} style={{ borderBottom: '1px solid var(--gray-100)', cursor: 'pointer' }}>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <p style={{ fontWeight: 600, color: 'var(--midnight)' }}>{booking.user?.full_name || 'N/A'}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{booking.user?.email}</p>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: 'var(--midnight)' }}>{booking.package_title || 'N/A'}</td>
                  <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{booking.reference}</td>
                  <td style={{ padding: '0.75rem 1rem', color: 'var(--midnight)' }}>{booking.travellers}</td>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: 'var(--midnight)' }}>{booking.currency} {Number(booking.total_price).toLocaleString()}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: '20px', background: sc.bg, color: sc.color }}>
                      {booking.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)' }}>
                    {new Date(booking.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap' }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(booking); }}
                      disabled={deletingId === booking.id}
                      title="Delete this booking"
                      style={{ background: 'none', border: 'none', color: 'var(--danger)', fontSize: '0.75rem', fontWeight: 600, cursor: deletingId === booking.id ? 'not-allowed' : 'pointer', textDecoration: 'underline' }}
                    >
                      {deletingId === booking.id ? "Deleting..." : "Delete"}
                    </button>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  No bookings found for this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
