"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";

const statusConfig: Record<string, { label: string; background: string; color: string }> = {
  active: { label: "Active", background: "var(--teal-pale)", color: "var(--teal)" },
  scheduled: { label: "Scheduled", background: "#DBEAFE", color: "#1D4ED8" },
  ended: { label: "Ended", background: "var(--gray-100)", color: "var(--text-muted)" },
  paused: { label: "Paused", background: "#FEF3C7", color: "#D97706" },
};

export default function PromotionsList({ promotions: initialPromotions }: { promotions: any[] }) {
  const [promotions, setPromotions] = useState(initialPromotions);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [endingId, setEndingId] = useState<string | null>(null);

  async function handleToggle(id: string) {
    setTogglingId(id);
    try {
      const res = await fetch("/api/admin/promotions/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "toggle" }),
      });
      const data = await res.json();
      if (res.ok) {
        setPromotions(prev => prev.map(p => p.id === id ? { ...p, status: data.status } : p));
      }
    } finally {
      setTogglingId(null);
    }
  }

  async function handleEndNow(id: string) {
    setEndingId(id);
    try {
      const res = await fetch("/api/admin/promotions/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "end_now" }),
      });
      const data = await res.json();
      if (res.ok) {
        setPromotions(prev => prev.map(p => p.id === id ? { ...p, status: data.status } : p));
      }
    } finally {
      setEndingId(null);
    }
  }

  return (
    <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', overflow: 'hidden' }}>
      {promotions.length === 0 ? (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No promotions yet. Create your first one!</p>
        </div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--off-white)' }}>
              <th style={{ textAlign: 'left', padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--midnight)' }}>Title</th>
              <th style={{ textAlign: 'left', padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--midnight)' }}>Type</th>
              <th style={{ textAlign: 'left', padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--midnight)' }}>Prize</th>
              <th style={{ textAlign: 'left', padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--midnight)' }}>Dates</th>
              <th style={{ textAlign: 'center', padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--midnight)' }}>Awarded/Cap</th>
              <th style={{ textAlign: 'center', padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--midnight)' }}>Status</th>
              <th style={{ textAlign: 'right', padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--midnight)' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {promotions.map(promo => {
              const status = statusConfig[promo.status] || statusConfig.scheduled;
              const typeLabel = promo.promotion_type?.replace(/_/g, " ") || promo.type?.replace(/_/g, " ") || "—";
              return (
                <tr key={promo.id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: 'var(--midnight)' }}>{promo.title}</td>
                  <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{typeLabel}</td>
                  <td style={{ padding: '0.75rem 1rem', color: 'var(--teal)', fontWeight: 600 }}>{promo.prize_label || "—"}</td>
                  <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                    {promo.starts_at ? new Date(promo.starts_at).toLocaleDateString("en-NG", { month: "short", day: "numeric" }) : "—"}
                    {" — "}
                    {promo.ends_at ? new Date(promo.ends_at).toLocaleDateString("en-NG", { month: "short", day: "numeric" }) : "—"}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    {promo.promotion_awards?.[0]?.count || 0}/{promo.quantity_cap || "∞"}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '3px 10px', borderRadius: '20px', background: status.background, color: status.color }}>
                      {status.label}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.375rem', justifyContent: 'flex-end' }}>
                      {(promo.status === "active" || promo.status === "paused") && (
                        <button
                          onClick={() => handleToggle(promo.id)}
                          disabled={togglingId === promo.id}
                          style={{ padding: '0.375rem 0.625rem', background: promo.status === "active" ? '#FEF3C7' : 'var(--teal-pale)', color: promo.status === "active" ? '#D97706' : 'var(--teal)', fontWeight: 600, fontSize: '0.7rem', borderRadius: 'var(--radius-sm)', border: 'none', cursor: togglingId === promo.id ? 'not-allowed' : 'pointer' }}
                        >
                          {togglingId === promo.id ? "..." : promo.status === "active" ? "Pause" : "Resume"}
                        </button>
                      )}
                      {promo.status === "active" && (
                        <button
                          onClick={() => handleEndNow(promo.id)}
                          disabled={endingId === promo.id}
                          style={{ padding: '0.375rem 0.625rem', background: '#FEF2F2', color: '#EF4444', fontWeight: 600, fontSize: '0.7rem', borderRadius: 'var(--radius-sm)', border: 'none', cursor: endingId === promo.id ? 'not-allowed' : 'pointer' }}
                        >
                          {endingId === promo.id ? "..." : "End"}
                        </button>
                      )}
                    </div>
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
