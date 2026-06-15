"use client";

import { useState } from "react";
import Link from "next/link";

interface GoalTemplate {
  id: string;
  icon: string;
  name: string;
  category: string;
  target_amount_ngn: number;
  lock_type: "locked" | "flexible";
  lock_months: number | null;
  is_active: boolean;
  sort_order: number;
}

export default function GoalTemplatesList({ templates: initial }: { templates: GoalTemplate[] }) {
  const [templates, setTemplates] = useState(initial);

  async function toggleActive(id: string, current: boolean) {
    const res = await fetch("/api/admin/goal-templates/toggle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, is_active: !current }),
    });
    if (res.ok) {
      setTemplates((prev) => prev.map((t) => (t.id === id ? { ...t, is_active: !current } : t)));
    }
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h1 style={{ fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', fontSize: '1.375rem', fontWeight: 800, color: 'var(--midnight)' }}>
          Goal Templates
        </h1>
        <Link
          href="/admin/goal-templates/new"
          style={{
            padding: "0.625rem 1.25rem",
            background: "var(--midnight)",
            color: "white",
            fontWeight: 700,
            fontSize: "0.875rem",
            borderRadius: "var(--radius-md)",
            textDecoration: "none",
          }}
        >
          + New template
        </Link>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", minWidth: 500, borderCollapse: "collapse", background: "white", borderRadius: "var(--radius-lg)", overflow: "hidden", border: "1px solid var(--border)" }}>
          <thead>
            <tr style={{ background: "var(--off-white)", textAlign: "left" }}>
              <th style={{ padding: "0.75rem 1rem", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Icon</th>
              <th style={{ padding: "0.75rem 1rem", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Name</th>
              <th className="hide-mobile" style={{ padding: "0.75rem 1rem", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Category</th>
              <th style={{ padding: "0.75rem 1rem", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Target (NGN)</th>
              <th className="hide-mobile" style={{ padding: "0.75rem 1rem", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Lock type</th>
              <th style={{ padding: "0.75rem 1rem", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Active</th>
              <th style={{ padding: "0.75rem 1rem", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Sort</th>
              <th style={{ padding: "0.75rem 1rem", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}></th>
            </tr>
          </thead>
          <tbody>
            {templates.map((t) => (
              <tr key={t.id} style={{ borderTop: "1px solid var(--border)" }}>
                <td style={{ padding: "0.75rem 1rem", fontSize: "1.25rem" }}>{t.icon}</td>
                <td style={{ padding: "0.75rem 1rem", fontSize: "0.875rem", fontWeight: 600, color: "var(--midnight)" }}>{t.name}</td>
                <td className="hide-mobile" style={{ padding: "0.75rem 1rem", fontSize: "0.8125rem", color: "var(--text-secondary)" }}>{t.category?.replace(/_/g, " ")}</td>
                <td style={{ padding: "0.75rem 1rem", fontSize: "0.875rem", fontWeight: 600, color: "var(--midnight)" }}>₦{t.target_amount_ngn?.toLocaleString()}</td>
                <td className="hide-mobile" style={{ padding: "0.75rem 1rem", fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                  {t.lock_type === "locked" ? `🔒 ${t.lock_months}m` : "🔓 Flexible"}
                </td>
                <td style={{ padding: "0.75rem 1rem" }}>
                  <button
                    onClick={() => toggleActive(t.id, t.is_active)}
                    title={t.is_active ? "Click to deactivate" : "Click to activate"}
                    style={{ background: "none", border: "none", cursor: "pointer" }}
                  >
                    <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: t.is_active ? "var(--teal)" : "var(--gray-300)", transition: "background 0.15s" }} />
                  </button>
                </td>
                <td style={{ padding: "0.75rem 1rem", fontSize: "0.8125rem", color: "var(--text-muted)" }}>{t.sort_order}</td>
                <td style={{ padding: "0.75rem 1rem" }}>
                  <Link href={`/admin/goal-templates/${t.id}`} style={{ fontSize: "0.8125rem", color: "var(--teal)", fontWeight: 600, textDecoration: "none" }}>
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
            {templates.length === 0 && (
              <tr>
                <td colSpan={8} style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.875rem" }}>
                  No goal templates yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
