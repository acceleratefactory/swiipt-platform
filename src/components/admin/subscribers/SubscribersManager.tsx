"use client";
import { useState } from "react";

interface Subscriber {
  id: string;
  email: string;
  source: string | null;
  destination_interest: string | null;
  created_at: string;
}

export default function SubscribersManager({ subscribers }: { subscribers: Subscriber[] }) {
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");

  const filtered = subscribers
    .filter(s =>
      search === "" ||
      s.email.toLowerCase().includes(search.toLowerCase())
    )
    .filter(s =>
      sourceFilter === "all" || s.source === sourceFilter
    );

  const sources = ["all", ...Array.from(new Set(subscribers.map(s => s.source || "landing_page").filter(Boolean)))];

  function exportCSV() {
    const headers = ["Email", "Source", "Destination Interest", "Subscribed Date"];
    const rows = filtered.map(s => [
      s.email,
      s.source || "landing_page",
      s.destination_interest || "",
      new Date(s.created_at).toLocaleDateString("en-NG"),
    ]);

    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `swiipt-subscribers-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function exportEmailsOnly() {
    const emails = filtered.map(s => s.email).join("\n");
    const blob = new Blob([emails], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `swiipt-emails-${new Date().toISOString().split("T")[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      {/* Controls row */}
      <div style={{
        display: "flex",
        gap: "0.75rem",
        marginBottom: "1rem",
        flexWrap: "wrap",
        alignItems: "center",
      }}>
        <input
          type="text"
          placeholder="Search by email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            flex: 1,
            minWidth: "200px",
            padding: "0.5rem 0.875rem",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-md)",
            fontSize: "0.875rem",
            outline: "none",
          }}
        />
        <select
          value={sourceFilter}
          onChange={e => setSourceFilter(e.target.value)}
          style={{
            padding: "0.5rem 0.875rem",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-md)",
            fontSize: "0.875rem",
            outline: "none",
          }}
        >
          {sources.map(s => (
            <option key={s} value={s}>
              {s === "all" ? "All sources" : s}
            </option>
          ))}
        </select>
        <button
          onClick={exportCSV}
          style={{
            padding: "0.5rem 1rem",
            background: "var(--midnight)",
            color: "white",
            fontWeight: 700,
            fontSize: "0.875rem",
            borderRadius: "var(--radius-md)",
            border: "none",
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          Export CSV ({filtered.length})
        </button>
        <button
          onClick={exportEmailsOnly}
          style={{
            padding: "0.5rem 1rem",
            background: "var(--off-white)",
            color: "var(--midnight)",
            fontWeight: 600,
            fontSize: "0.875rem",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border)",
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          Export emails only
        </button>
      </div>

      {/* Summary stats */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
        gap: "0.75rem",
        marginBottom: "1.5rem",
      }}>
        {[
          { label: "Total subscribers", value: subscribers.length },
          { label: "Showing", value: filtered.length },
          { label: "This month", value: subscribers.filter(s => new Date(s.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length },
          { label: "This week", value: subscribers.filter(s => new Date(s.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length },
        ].map(stat => (
          <div key={stat.label} style={{
            background: "white",
            borderRadius: "var(--radius-md)",
            padding: "0.875rem 1rem",
            border: "1px solid var(--border)",
          }}>
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>{stat.label}</p>
            <p style={{
              fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif",
              fontSize: "1.25rem",
              fontWeight: 800,
              color: "var(--midnight)",
            }}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Subscribers table */}
      <div style={{
        background: "white",
        borderRadius: "var(--radius-lg)",
        border: "1px solid var(--border)",
        overflow: "hidden",
      }}>
        {filtered.length === 0 ? (
          <p style={{ padding: "2rem", color: "var(--text-muted)", textAlign: "center" }}>
            {subscribers.length === 0 ? "No subscribers yet." : "No subscribers match your search."}
          </p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8125rem" }}>
              <thead>
                <tr style={{ background: "var(--gray-100)" }}>
                  {["Email", "Source", "Destination Interest", "Subscribed"].map(h => (
                    <th key={h} style={{
                      padding: "0.625rem 1rem",
                      textAlign: "left",
                      fontWeight: 600,
                      color: "var(--text-secondary)",
                      whiteSpace: "nowrap",
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(sub => (
                  <tr key={sub.id} style={{ borderBottom: "1px solid var(--gray-100)" }}>
                    <td style={{ padding: "0.625rem 1rem", color: "var(--midnight)", fontWeight: 500 }}>
                      {sub.email}
                    </td>
                    <td style={{ padding: "0.625rem 1rem", color: "var(--text-muted)" }}>
                      {sub.source || "landing_page"}
                    </td>
                    <td style={{ padding: "0.625rem 1rem", color: "var(--text-muted)" }}>
                      {sub.destination_interest || "—"}
                    </td>
                    <td style={{ padding: "0.625rem 1rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                      {new Date(sub.created_at).toLocaleDateString("en-NG", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
