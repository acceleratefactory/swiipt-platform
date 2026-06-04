"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("en-NG", {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export default function NotificationHistory({ broadcasts }: { broadcasts: any[] }) {
  return (
    <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', overflow: 'hidden' }}>
      <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
        <h2 style={{ fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', fontSize: '1rem', fontWeight: 700, color: 'var(--midnight)' }}>
          Recent Broadcasts
        </h2>
      </div>

      {broadcasts.length === 0 ? (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No broadcasts sent yet.</p>
        </div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--off-white)' }}>
              <th style={{ textAlign: 'left', padding: '0.625rem 1rem', fontWeight: 700, color: 'var(--midnight)' }}>Date</th>
              <th style={{ textAlign: 'left', padding: '0.625rem 1rem', fontWeight: 700, color: 'var(--midnight)' }}>Target</th>
              <th style={{ textAlign: 'left', padding: '0.625rem 1rem', fontWeight: 700, color: 'var(--midnight)' }}>Title</th>
              <th style={{ textAlign: 'left', padding: '0.625rem 1rem', fontWeight: 700, color: 'var(--midnight)' }}>Channel</th>
              <th style={{ textAlign: 'right', padding: '0.625rem 1rem', fontWeight: 700, color: 'var(--midnight)' }}>Sent to</th>
            </tr>
          </thead>
          <tbody>
            {broadcasts.map((b: any) => (
              <tr key={b.id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                <td style={{ padding: '0.625rem 1rem', color: 'var(--text-muted)', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                  {formatDate(b.created_at)}
                </td>
                <td style={{ padding: '0.625rem 1rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                  {b.event_data?.target || "—"}
                </td>
                <td style={{ padding: '0.625rem 1rem', fontWeight: 600, color: 'var(--midnight)' }}>
                  {b.event_data?.title || "—"}
                </td>
                <td style={{ padding: '0.625rem 1rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                  {b.event_data?.channel || "—"}
                </td>
                <td style={{ padding: '0.625rem 1rem', textAlign: 'right', fontWeight: 700, color: 'var(--midnight)' }}>
                  {b.event_data?.recipientCount || 0}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
/* eslint-enable @typescript-eslint/no-explicit-any */
