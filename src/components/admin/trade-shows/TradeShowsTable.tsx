"use client";

import { useState } from "react";
import Link from "next/link";

interface TradeShow {
  id: string;
  name: string;
  location_city: string;
  location_country: string;
  event_date_start: string;
  event_date_end: string;
  base_cost_solo_ngn: number | null;
  base_cost_group_ngn: number | null;
  is_active: boolean;
}

export default function TradeShowsTable({ shows: initial }: { shows: TradeShow[] }) {
  const [shows, setShows] = useState(initial);

  async function toggleActive(id: string, current: boolean) {
    const res = await fetch("/api/admin/trade-shows/toggle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, is_active: !current }),
    });
    if (res.ok) {
      setShows((prev) => prev.map((s) => (s.id === id ? { ...s, is_active: !current } : s)));
    }
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", minWidth: 400, borderCollapse: "collapse", background: "white", borderRadius: "var(--radius-lg)", overflow: "hidden", border: "1px solid var(--border)" }}>
        <thead>
          <tr style={{ background: "var(--off-white)", textAlign: "left" }}>
            <th style={{ padding: "0.75rem 1rem", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Name</th>
            <th className="hide-mobile" style={{ padding: "0.75rem 1rem", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Location</th>
            <th className="hide-mobile" style={{ padding: "0.75rem 1rem", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Dates</th>
            <th style={{ padding: "0.75rem 1rem", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Solo / Group</th>
            <th style={{ padding: "0.75rem 1rem", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Active</th>
            <th style={{ padding: "0.75rem 1rem", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}></th>
          </tr>
        </thead>
        <tbody>
          {shows.map((show) => (
            <tr key={show.id} style={{ borderTop: "1px solid var(--border)" }}>
              <td style={{ padding: "0.75rem 1rem", fontSize: "0.875rem", fontWeight: 600, color: "var(--midnight)" }}>{show.name}</td>
              <td className="hide-mobile" style={{ padding: "0.75rem 1rem", fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                {show.location_city}, {show.location_country}
              </td>
              <td className="hide-mobile" style={{ padding: "0.75rem 1rem", fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                {new Date(show.event_date_start).toLocaleDateString()}
              </td>
              <td style={{ padding: "0.75rem 1rem", fontSize: "0.875rem", color: "var(--midnight)" }}>
                ₦{show.base_cost_solo_ngn?.toLocaleString() || "—"} / {show.base_cost_group_ngn ? `₦${show.base_cost_group_ngn.toLocaleString()}` : "—"}
              </td>
              <td style={{ padding: "0.75rem 1rem" }}>
                <button
                  onClick={() => toggleActive(show.id, show.is_active)}
                  title={show.is_active ? "Click to deactivate" : "Click to activate"}
                  className="table-toggle-btn"
                  style={{ background: "none", border: "none", cursor: "pointer" }}
                >
                  <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: show.is_active ? "var(--teal)" : "var(--gray-300)", transition: "background 0.15s" }} />
                </button>
              </td>
              <td style={{ padding: "0.75rem 1rem" }}>
                <Link href={`/admin/trade-shows/${show.id}`} style={{ fontSize: "0.8125rem", color: "var(--teal)", fontWeight: 600, textDecoration: "none" }}>
                  Edit
                </Link>
              </td>
            </tr>
          ))}
          {shows.length === 0 && (
            <tr>
              <td colSpan={6} style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.875rem" }}>
                No trade shows yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
