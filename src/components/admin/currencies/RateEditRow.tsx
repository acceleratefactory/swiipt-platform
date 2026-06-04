"use client";
import { useState } from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function RateEditRow({ currency }: { currency: any }) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(String(currency.ngn_exchange_rate));
  const [saving, setSaving] = useState(false);
  const [active, setActive] = useState(currency.is_active);

  async function saveRate() {
    setSaving(true);
    const res = await fetch("/api/admin/currencies/update-rate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currencyId: currency.id,
        code: currency.code,
        ngn_exchange_rate: Number(editValue),
      }),
    });
    if (res.ok) {
      setEditing(false);
    }
    setSaving(false);
  }

  async function toggleActive() {
    const newActive = !active;
    setActive(newActive);
    await fetch("/api/admin/currencies/update-rate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currencyId: currency.id,
        code: currency.code,
        ngn_exchange_rate: currency.ngn_exchange_rate,
        is_active: newActive,
      }),
    });
  }

  return (
    <tr style={{ borderBottom: "1px solid var(--gray-100)" }}>
      <td style={{ padding: "0.625rem 1rem", fontWeight: 600, color: "var(--midnight)" }}>{currency.name}</td>
      <td style={{ padding: "0.625rem 1rem", fontFamily: "monospace", fontSize: "0.75rem", color: "var(--text-secondary)" }}>{currency.code}</td>
      <td style={{ padding: "0.625rem 1rem", fontSize: "1rem", color: "var(--text-muted)" }}>{currency.symbol}</td>
      <td style={{ padding: "0.625rem 1rem" }}>
        {editing ? (
          <div style={{ display: "flex", gap: "0.375rem", alignItems: "center" }}>
            <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>₦</span>
            <input
              value={editValue}
              onChange={e => setEditValue(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") saveRate(); if (e.key === "Escape") { setEditing(false); setEditValue(String(currency.ngn_exchange_rate)); } }}
              onBlur={saveRate}
              autoFocus
              style={{ width: 80, padding: "0.25rem 0.5rem", borderRadius: "var(--radius-sm)", border: "2px solid var(--teal)", fontSize: "0.8125rem", fontFamily: "monospace" }}
            />
            {saving && <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>…</span>}
          </div>
        ) : (
          <span
            onClick={() => { setEditing(true); setEditValue(String(currency.ngn_exchange_rate)); }}
            style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "0.375rem", fontFamily: "monospace", fontSize: "0.8125rem" }}
          >
            ₦{currency.ngn_exchange_rate.toLocaleString()}
            <span style={{ fontSize: "0.75rem", color: "var(--gray-300)" }}>✏️</span>
          </span>
        )}
      </td>
      <td style={{ padding: "0.625rem 1rem", color: "var(--text-muted)", fontSize: "0.75rem", whiteSpace: "nowrap" }}>
        {currency.last_updated_at ? new Date(currency.last_updated_at).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" }) : "—"}
      </td>
      <td style={{ padding: "0.625rem 1rem" }}>
        <input type="checkbox" checked={active} onChange={toggleActive} style={{ accentColor: "var(--teal)", cursor: "pointer" }} />
      </td>
      <td style={{ padding: "0.625rem 1rem" }}>
        <button
          onClick={() => { setEditing(true); setEditValue(String(currency.ngn_exchange_rate)); }}
          style={{ padding: "0.25rem 0.625rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "white", fontSize: "0.75rem", cursor: "pointer" }}
        >
          Edit
        </button>
      </td>
    </tr>
  );
}
