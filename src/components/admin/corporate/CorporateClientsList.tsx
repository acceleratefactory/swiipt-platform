"use client";
import { useState } from "react";
import CorporateClientForm from "./CorporateClientForm";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function CorporateClientsList({ clients }: { clients: any[] }) {
  const [showForm, setShowForm] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [editing, setEditing] = useState<any | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [list, setList] = useState<any[]>(clients);

  const statusBadge: Record<string, { label: string; bg: string; color: string }> = {
    prospect: { label: "Prospect", bg: "var(--gray-100)", color: "var(--text-muted)" },
    active: { label: "Active", bg: "var(--teal-pale)", color: "var(--teal)" },
    lapsed: { label: "Lapsed", bg: "#FEF3C7", color: "#B45309" },
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function handleSaved(client: any) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setList(prev => {
      const idx = prev.findIndex(c => c.id === client.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = client;
        return next;
      }
      return [client, ...prev];
    });
    setShowForm(false);
    setEditing(null);
  }

  return (
    <div style={{ background: "white", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", overflow: "hidden" }}>
      <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>{list.length} client{list.length !== 1 ? "s" : ""}</span>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          style={{ padding: "0.5rem 1rem", borderRadius: "var(--radius-md)", border: "none", background: "var(--midnight)", color: "white", fontWeight: 600, fontSize: "0.8125rem", cursor: "pointer" }}
        >
          + Add new client
        </button>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8125rem" }}>
          <thead>
            <tr style={{ background: "var(--gray-100)" }}>
              {["Company name", "Contact name", "Email", "Phone", "Retainer amount", "Currency", "Status", "Actions"].map(h => (
                <th key={h} style={{ padding: "0.625rem 1rem", textAlign: "left", fontWeight: 600, color: "var(--text-secondary)", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {list.map((c: any) => {
              const badge = statusBadge[c.status] || { label: c.status, bg: "var(--gray-100)", color: "var(--text-muted)" };
              return (
                <tr key={c.id} style={{ borderBottom: "1px solid var(--gray-100)" }}>
                  <td style={{ padding: "0.625rem 1rem", fontWeight: 600, color: "var(--midnight)" }}>{c.company_name}</td>
                  <td style={{ padding: "0.625rem 1rem", color: "var(--text-secondary)" }}>{c.contact_name}</td>
                  <td style={{ padding: "0.625rem 1rem", color: "var(--text-muted)" }}>{c.contact_email}</td>
                  <td style={{ padding: "0.625rem 1rem", color: "var(--text-muted)" }}>{c.contact_phone || "—"}</td>
                  <td style={{ padding: "0.625rem 1rem", fontWeight: 700, fontFamily: "monospace" }}>
                    {c.retainer_amount ? `₦${c.retainer_amount.toLocaleString()}` : "—"}
                  </td>
                  <td style={{ padding: "0.625rem 1rem", color: "var(--text-muted)" }}>{c.retainer_currency || "—"}</td>
                  <td style={{ padding: "0.625rem 1rem" }}>
                    <span style={{ fontSize: "0.65rem", fontWeight: 700, padding: "2px 6px", borderRadius: "20px", background: badge.bg, color: badge.color }}>
                      {badge.label}
                    </span>
                  </td>
                  <td style={{ padding: "0.625rem 1rem" }}>
                    <button
                      onClick={() => { setEditing(c); setShowForm(true); }}
                      style={{ padding: "0.25rem 0.625rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "white", fontSize: "0.75rem", cursor: "pointer" }}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {list.length === 0 && (
        <p style={{ padding: "2rem", fontSize: "0.875rem", color: "var(--text-muted)", textAlign: "center" }}>No corporate clients yet.</p>
      )}

      {showForm && (
        <CorporateClientForm
          client={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
