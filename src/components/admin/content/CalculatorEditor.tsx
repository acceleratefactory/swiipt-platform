"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

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

type SaveState = "idle" | "saving" | "saved" | "error";

const defaultAddForm = {
  destination: "",
  service_type: "",
  family_size: "",
  service_fee_ngn: "",
  government_fee_ngn: "",
  document_prep_ngn: "",
  travel_estimate_ngn: "",
  first_month_setup_ngn: "",
  processing_weeks_min: "",
  processing_weeks_max: "",
  success_rate: "",
};

export default function CalculatorEditor({ configs: initial }: { configs: CalculatorConfig[] }) {
  const [configs, setConfigs] = useState(initial);
  const [saveStates, setSaveStates] = useState<Record<string, SaveState>>({});
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [editValues, setEditValues] = useState<Record<string, Record<string, string>>>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState(defaultAddForm);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

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

  function clearRowEdits(configId: string) {
    setEditValues((prev) => {
      const next = { ...prev };
      delete next[configId];
      return next;
    });
  }

  async function handleSave(config: CalculatorConfig, field: string) {
    const raw = editValues[config.id]?.[field];
    if (raw === undefined) return;

    setSaveStates((prev) => ({ ...prev, [config.id]: "saving" }));
    setError(null);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: err } = await (supabase as any)
      .from("calculator_configs")
      .update({ [field]: Number(raw), updated_at: new Date().toISOString() })
      .eq("id", config.id);

    if (err) {
      setSaveStates((prev) => ({ ...prev, [config.id]: "error" }));
      if (err.message.includes("duplicate") || err.message.includes("unique") || err.message.includes("23505")) {
        setError("Duplicate key violation: a config with this destination, service type, and family size already exists.");
      }
      setTimeout(() => setSaveStates((prev) => ({ ...prev, [config.id]: "idle" })), 3000);
      return;
    }

    setConfigs((prev) => prev.map((c) => (c.id === config.id ? { ...c, [field]: Number(raw) } : c)));
    setSaveStates((prev) => ({ ...prev, [config.id]: "saved" }));
    setTimeout(() => setSaveStates((prev) => ({ ...prev, [config.id]: "idle" })), 2000);
  }

  async function handleToggle(config: CalculatorConfig) {
    setSaveStates((prev) => ({ ...prev, [config.id]: "saving" }));
    setError(null);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: err } = await (supabase as any)
      .from("calculator_configs")
      .update({ is_active: !config.is_active, updated_at: new Date().toISOString() })
      .eq("id", config.id);

    if (err) {
      setSaveStates((prev) => ({ ...prev, [config.id]: "error" }));
      setTimeout(() => setSaveStates((prev) => ({ ...prev, [config.id]: "idle" })), 3000);
      return;
    }

    setConfigs((prev) => prev.map((c) => (c.id === config.id ? { ...c, is_active: !c.is_active } : c)));
    setSaveStates((prev) => ({ ...prev, [config.id]: "saved" }));
    setTimeout(() => setSaveStates((prev) => ({ ...prev, [config.id]: "idle" })), 2000);
  }

  async function handleDelete(config: CalculatorConfig) {
    if (!confirm(`Delete this config for ${config.destination} / ${config.service_type} / ${config.family_size}?`)) return;

    setSaveStates((prev) => ({ ...prev, [config.id]: "saving" }));
    setError(null);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: err } = await (supabase as any)
      .from("calculator_configs")
      .delete()
      .eq("id", config.id);

    if (err) {
      setSaveStates((prev) => ({ ...prev, [config.id]: "error" }));
      setTimeout(() => setSaveStates((prev) => ({ ...prev, [config.id]: "idle" })), 3000);
      return;
    }

    setConfigs((prev) => prev.filter((c) => c.id !== config.id));
  }

  async function handleAdd() {
    setError(null);
    const payload = {
      destination: addForm.destination,
      service_type: addForm.service_type,
      family_size: addForm.family_size,
      service_fee_ngn: Number(addForm.service_fee_ngn),
      government_fee_ngn: Number(addForm.government_fee_ngn),
      document_prep_ngn: Number(addForm.document_prep_ngn),
      travel_estimate_ngn: Number(addForm.travel_estimate_ngn),
      first_month_setup_ngn: Number(addForm.first_month_setup_ngn),
      processing_weeks_min: Number(addForm.processing_weeks_min),
      processing_weeks_max: Number(addForm.processing_weeks_max),
      success_rate: Number(addForm.success_rate),
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error: err } = await (supabase as any)
      .from("calculator_configs")
      .insert(payload)
      .select()
      .single();

    if (err) {
      if (err.message.includes("duplicate") || err.message.includes("unique") || err.message.includes("23505")) {
        setError("Duplicate key violation: a config with this destination, service type, and family size already exists.");
      } else {
        setError(err.message);
      }
      return;
    }

    setConfigs((prev) => [...prev, data]);
    setShowAddForm(false);
    setAddForm(defaultAddForm);
  }

  const numericFields: { key: string; label: string; prefix: string }[] = [
    { key: "service_fee_ngn", label: "Service fee", prefix: "\u20A6" },
    { key: "government_fee_ngn", label: "Gov fee", prefix: "\u20A6" },
    { key: "document_prep_ngn", label: "Doc prep", prefix: "\u20A6" },
    { key: "travel_estimate_ngn", label: "Travel est", prefix: "\u20A6" },
    { key: "first_month_setup_ngn", label: "1st mo", prefix: "\u20A6" },
    { key: "processing_weeks_min", label: "Wk min", prefix: "" },
    { key: "processing_weeks_max", label: "Wk max", prefix: "" },
    { key: "success_rate", label: "Rate %", prefix: "" },
  ];

  const label = (s: string) =>
    s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const saveStateColors: Record<SaveState, { color: string; bg: string }> = {
    idle: { color: "var(--text-muted)", bg: "transparent" },
    saving: { color: "#856404", bg: "#FFF3CD" },
    saved: { color: "var(--teal)", bg: "var(--teal-pale)" },
    error: { color: "var(--danger)", bg: "#FDE8E8" },
  };

  const saveStateLabels: Record<SaveState, string> = {
    idle: "",
    saving: "Saving\u2026",
    saved: "\u2713 Saved",
    error: "\u2717 Error",
  };

  return (
    <div>
      {error && (
        <div
          style={{
            background: "#FDE8E8",
            border: "1px solid var(--danger)",
            borderRadius: "var(--radius-md)",
            padding: "0.75rem 1rem",
            marginBottom: "1.5rem",
            fontSize: "0.8125rem",
            color: "var(--danger)",
            lineHeight: 1.5,
          }}
        >
          {error}
          <button
            onClick={() => setError(null)}
            style={{
              marginLeft: "1rem",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontWeight: 700,
              color: "var(--danger)",
              fontSize: "0.8125rem",
            }}
          >
            Dismiss
          </button>
        </div>
      )}

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
        <strong>{"\u26A0\uFE0F"} These figures appear on the public landing page.</strong>{" "}
        Enter your real service fees and current government fee estimates.
        The total shown to visitors = sum of all five fee columns.
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <button
          onClick={() => { setShowAddForm(!showAddForm); if (!showAddForm) setError(null); }}
          style={{
            padding: "0.5rem 1rem",
            background: showAddForm ? "var(--off-white)" : "var(--midnight)",
            color: showAddForm ? "var(--midnight)" : "white",
            fontWeight: 700,
            fontSize: "0.8125rem",
            borderRadius: "var(--radius-md)",
            border: showAddForm ? "1px solid var(--border)" : "none",
            cursor: "pointer",
          }}
        >
          {showAddForm ? "Cancel" : "+ Add new config"}
        </button>
      </div>

      {showAddForm && (
        <div
          style={{
            background: "white",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--border)",
            padding: "1.5rem",
            marginBottom: "1.5rem",
          }}
        >
          <h3
            style={{
              fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif",
              fontSize: "1rem",
              fontWeight: 700,
              color: "var(--midnight)",
              marginBottom: "1rem",
            }}
          >
            New pricing config
          </h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
              gap: "1rem",
              marginBottom: "1rem",
            }}
          >
            <div>
              <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.25rem" }}>Destination</p>
              <input value={addForm.destination} onChange={(e) => setAddForm((prev) => ({ ...prev, destination: e.target.value }))} placeholder="e.g. UAE" style={{ width: "100%", padding: "0.375rem 0.5rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", fontSize: "0.8125rem" }} />
            </div>
            <div>
              <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.25rem" }}>Service type</p>
              <input value={addForm.service_type} onChange={(e) => setAddForm((prev) => ({ ...prev, service_type: e.target.value }))} placeholder="e.g. work" style={{ width: "100%", padding: "0.375rem 0.5rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", fontSize: "0.8125rem" }} />
            </div>
            <div>
              <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.25rem" }}>Family size</p>
              <input value={addForm.family_size} onChange={(e) => setAddForm((prev) => ({ ...prev, family_size: e.target.value }))} placeholder="e.g. single" style={{ width: "100%", padding: "0.375rem 0.5rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", fontSize: "0.8125rem" }} />
            </div>
            <div>
              <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.25rem" }}>Service fee ({"\u20A6"})</p>
              <input type="number" value={addForm.service_fee_ngn} onChange={(e) => setAddForm((prev) => ({ ...prev, service_fee_ngn: e.target.value }))} style={{ width: "100%", padding: "0.375rem 0.5rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", fontSize: "0.8125rem" }} />
            </div>
            <div>
              <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.25rem" }}>Gov fee ({"\u20A6"})</p>
              <input type="number" value={addForm.government_fee_ngn} onChange={(e) => setAddForm((prev) => ({ ...prev, government_fee_ngn: e.target.value }))} style={{ width: "100%", padding: "0.375rem 0.5rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", fontSize: "0.8125rem" }} />
            </div>
            <div>
              <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.25rem" }}>Doc prep ({"\u20A6"})</p>
              <input type="number" value={addForm.document_prep_ngn} onChange={(e) => setAddForm((prev) => ({ ...prev, document_prep_ngn: e.target.value }))} style={{ width: "100%", padding: "0.375rem 0.5rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", fontSize: "0.8125rem" }} />
            </div>
            <div>
              <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.25rem" }}>Travel est ({"\u20A6"})</p>
              <input type="number" value={addForm.travel_estimate_ngn} onChange={(e) => setAddForm((prev) => ({ ...prev, travel_estimate_ngn: e.target.value }))} style={{ width: "100%", padding: "0.375rem 0.5rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", fontSize: "0.8125rem" }} />
            </div>
            <div>
              <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.25rem" }}>1st mo setup ({"\u20A6"})</p>
              <input type="number" value={addForm.first_month_setup_ngn} onChange={(e) => setAddForm((prev) => ({ ...prev, first_month_setup_ngn: e.target.value }))} style={{ width: "100%", padding: "0.375rem 0.5rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", fontSize: "0.8125rem" }} />
            </div>
            <div>
              <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.25rem" }}>Wk min</p>
              <input type="number" value={addForm.processing_weeks_min} onChange={(e) => setAddForm((prev) => ({ ...prev, processing_weeks_min: e.target.value }))} style={{ width: "100%", padding: "0.375rem 0.5rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", fontSize: "0.8125rem" }} />
            </div>
            <div>
              <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.25rem" }}>Wk max</p>
              <input type="number" value={addForm.processing_weeks_max} onChange={(e) => setAddForm((prev) => ({ ...prev, processing_weeks_max: e.target.value }))} style={{ width: "100%", padding: "0.375rem 0.5rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", fontSize: "0.8125rem" }} />
            </div>
            <div>
              <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.25rem" }}>Success rate %</p>
              <input type="number" value={addForm.success_rate} onChange={(e) => setAddForm((prev) => ({ ...prev, success_rate: e.target.value }))} style={{ width: "100%", padding: "0.375rem 0.5rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", fontSize: "0.8125rem" }} />
            </div>
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              onClick={handleAdd}
              style={{
                padding: "0.5rem 1.25rem",
                background: "var(--teal)",
                color: "var(--midnight)",
                fontWeight: 700,
                fontSize: "0.8125rem",
                borderRadius: "var(--radius-md)",
                border: "none",
                cursor: "pointer",
              }}
            >
              Save new config
            </button>
            <button
              onClick={() => { setShowAddForm(false); setAddForm(defaultAddForm); }}
              style={{
                padding: "0.5rem 1.25rem",
                background: "none",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-md)",
                fontSize: "0.8125rem",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {configs.length === 0 ? (
        <div
          style={{
            background: "white",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--border)",
            padding: "2rem",
            textAlign: "center",
            color: "var(--text-muted)",
            fontSize: "0.875rem",
          }}
        >
          No configs yet. Click &quot;+ Add new config&quot; to create one.
        </div>
      ) : (
        destOrder.map((dest) => {
          const rows = grouped[dest];
          const isCollapsed = collapsed[dest] ?? false;
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
                  {isCollapsed ? "\u25B8" : "\u25BE"}
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
                        <th style={{ padding: "0.5rem 0.75rem", fontSize: "0.7rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Status</th>
                        <th style={{ padding: "0.5rem 0.75rem", fontSize: "0.7rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((config) => {
                        const state = saveStates[config.id] || "idle";
                        return (
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
                                      onBlur={() => { if (isDirty) handleSave(config, f.key); }}
                                      onKeyDown={(e) => { if (e.key === "Enter") { (e.target as HTMLInputElement).blur(); } if (e.key === "Escape") { clearRowEdits(config.id); } }}
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
                                  </div>
                                </td>
                              );
                            })}
                            <td style={{ padding: "0.375rem 0.75rem" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                <button
                                  onClick={() => handleToggle(config)}
                                  disabled={state === "saving"}
                                  style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
                                >
                                  <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: config.is_active ? "var(--teal)" : "var(--gray-300)" }} />
                                </button>
                                {state !== "idle" && (
                                  <span
                                    style={{
                                      fontSize: "0.65rem",
                                      fontWeight: 600,
                                      padding: "2px 6px",
                                      borderRadius: "20px",
                                      background: saveStateColors[state].bg,
                                      color: saveStateColors[state].color,
                                    }}
                                  >
                                    {saveStateLabels[state]}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td style={{ padding: "0.375rem 0.75rem" }}>
                              <button
                                onClick={() => handleDelete(config)}
                                disabled={state === "saving"}
                                style={{
                                  background: "none",
                                  border: "none",
                                  fontSize: "0.75rem",
                                  color: "var(--danger)",
                                  fontWeight: 600,
                                  cursor: "pointer",
                                }}
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
