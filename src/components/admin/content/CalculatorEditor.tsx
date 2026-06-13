"use client";

import { useState } from "react";

interface CalculatorConfig {
  id: string;
  destination: string;
  service_type: string;
  family_size: string;
  service_fee_ngn: number;
  government_fee_ngn: number;
  document_prep_ngn: number;
  travel_estimate_ngn: number;
  first_month_setup_ngn: number;
  processing_weeks_min: number;
  processing_weeks_max: number;
  success_rate: number;
  is_active: boolean;
}

export default function CalculatorEditor({ configs: initial }: { configs: CalculatorConfig[] }) {
  const [configs, setConfigs] = useState(initial);
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [editValues, setEditValues] = useState<Record<string, Record<string, string>>>({});

  const grouped: Record<string, CalculatorConfig[]> = {};
  const destOrder: string[] = [];
  for (const c of configs) {
    if (!grouped[c.destination]) {
      grouped[c.destination] = [];
      destOrder.push(c.destination);
    }
    grouped[c.destination].push(c);
  }

  function toggleGroup(dest: string) {
    setCollapsed((prev) => ({ ...prev, [dest]: !prev[dest] }));
  }

  function setEditValue(configId: string, field: string, value: string) {
    setEditValues((prev) => ({
      ...prev,
      [configId]: { ...(prev[configId] || {}), [field]: value },
    }));
  }

  function getDisplayValue(config: CalculatorConfig, field: string): string {
    return editValues[config.id]?.[field] ?? String((config as unknown as Record<string, number>)[field] ?? "");
  }

  async function handleSave(config: CalculatorConfig, field: string) {
    const raw = editValues[config.id]?.[field];
    if (raw === undefined) return;

    setSaving(config.id);
    const updated = { ...config, [field]: Number(raw) };
    const res = await fetch("/api/admin/calculator/upsert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    });
    if (res.ok) {
      setConfigs((prev) => prev.map((c) => (c.id === config.id ? { ...c, [field]: Number(raw) } : c)));
      setSaved(config.id);
      setTimeout(() => setSaved(null), 2000);
    }
    setSaving(null);
  }

  const numericFields: { key: string; label: string; prefix: string }[] = [
    { key: "service_fee_ngn", label: "Service fee", prefix: "₦" },
    { key: "government_fee_ngn", label: "Gov fee", prefix: "₦" },
    { key: "document_prep_ngn", label: "Doc prep", prefix: "₦" },
    { key: "travel_estimate_ngn", label: "Travel est", prefix: "₦" },
    { key: "first_month_setup_ngn", label: "1st mo", prefix: "₦" },
    { key: "processing_weeks_min", label: "Wk min", prefix: "" },
    { key: "processing_weeks_max", label: "Wk max", prefix: "" },
    { key: "success_rate", label: "Rate %", prefix: "" },
  ];

  const label = (s: string) =>
    s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div>
      <div
        style={{
          background: "#FFF8E1",
          border: "1px solid #FFE082",
          borderRadius: "var(--radius-md)",
          padding: "0.75rem 1rem",
          marginBottom: "1.5rem",
          fontSize: "0.8125rem",
          color: "#795548",
          lineHeight: 1.5,
        }}
      >
        <strong>⚠️ These figures appear on the public landing page.</strong>{" "}
        Enter your real service fees and current government fee estimates.
        The total shown to visitors = sum of all five fee columns.
      </div>

      {destOrder.map((dest) => {
        const rows = grouped[dest];
        const isCollapsed = collapsed[dest] ?? (false);
        return (
          <div
            key={dest}
            style={{
              background: "white",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--border)",
              marginBottom: "1rem",
              overflow: "hidden",
            }}
          >
            <button
              onClick={() => toggleGroup(dest)}
              style={{
                width: "100%",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "0.75rem 1rem",
                background: "var(--off-white)",
                border: "none",
                borderBottom: isCollapsed ? "none" : "1px solid var(--border)",
                cursor: "pointer",
                fontWeight: 700,
                fontSize: "0.9375rem",
                color: "var(--midnight)",
                textAlign: "left",
              }}
            >
              <span>{dest} ({rows.length} configs)</span>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                {isCollapsed ? "▸" : "▾"}
              </span>
            </button>

            {!isCollapsed && (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", minWidth: 750, borderCollapse: "collapse", fontSize: "0.8125rem" }}>
                  <thead>
                    <tr style={{ background: "white", textAlign: "left" }}>
                      <th style={{ padding: "0.5rem 0.75rem", fontSize: "0.7rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Service</th>
                      <th style={{ padding: "0.5rem 0.75rem", fontSize: "0.7rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Size</th>
                      {numericFields.map((f) => (
                        <th key={f.key} style={{ padding: "0.5rem 0.5rem", fontSize: "0.65rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", whiteSpace: "nowrap" }}>{f.label}</th>
                      ))}
                      <th style={{ padding: "0.5rem 0.75rem", fontSize: "0.7rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Active</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((config) => (
                      <tr key={config.id} style={{ borderTop: "1px solid var(--border)" }}>
                        <td style={{ padding: "0.375rem 0.75rem", fontSize: "0.8125rem", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>{label(config.service_type)}</td>
                        <td style={{ padding: "0.375rem 0.75rem", fontSize: "0.8125rem", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>{label(config.family_size)}</td>
                        {numericFields.map((f) => {
                          const displayValue = getDisplayValue(config, f.key);
                          const isDirty = editValues[config.id]?.[f.key] !== undefined;
                          return (
                            <td key={f.key} style={{ padding: "0.375rem 0.5rem" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                                {f.prefix && <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{f.prefix}</span>}
                                <input
                                  value={displayValue}
                                  onChange={(e) => setEditValue(config.id, f.key, e.target.value)}
                                  onBlur={(e) => {
                                    if (!isDirty) e.target.style.border = "1px solid transparent";
                                    if (isDirty) handleSave(config, f.key);
                                  }}
                                  onKeyDown={(e) => { if (e.key === "Enter") { (e.target as HTMLInputElement).blur(); } if (e.key === "Escape") { setEditValues((prev) => { const next = { ...prev }; delete next[config.id]; return next; }); } }}
                                  style={{
                                    width: 52,
                                    padding: "0.15rem 0.25rem",
                                    borderRadius: "var(--radius-sm)",
                                    border: isDirty ? "2px solid var(--teal)" : "1px solid transparent",
                                    fontSize: "0.75rem",
                                    fontFamily: "monospace",
                                    background: "transparent",
                                    outline: "none",
                                    textAlign: "right",
                                    transition: "border 0.15s",
                                  }}
                                  onFocus={(e) => (e.target.style.border = "2px solid var(--teal)")}
                                />
                                {saving === config.id && (
                                  <span style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>…</span>
                                )}
                                {saved === config.id && (
                                  <span style={{ fontSize: "0.75rem", color: "var(--teal)", fontWeight: 700 }}>✓</span>
                                )}
                              </div>
                            </td>
                          );
                        })}
                        <td style={{ padding: "0.375rem 0.75rem" }}>
                          <button
                            onClick={async () => {
                              const res = await fetch("/api/admin/calculator/toggle", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ id: config.id, is_active: !config.is_active }),
                              });
                              if (res.ok) {
                                setConfigs((prev) => prev.map((c) => (c.id === config.id ? { ...c, is_active: !c.is_active } : c)));
                              }
                            }}
                            style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
                          >
                            <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: config.is_active ? "var(--teal)" : "var(--gray-300)" }} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
