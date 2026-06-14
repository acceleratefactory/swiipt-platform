"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Pathway {
  id: string;
  pathway_name: string;
  destination: string;
  match_type: "HIGH" | "GOOD" | "POSSIBLE";
  processing_weeks: string;
  starting_price_ngn: number;
  description: string;
  requires_destination: string[];
  requires_employment: string[];
  requires_passport: string[];
  requires_income: string[];
  excludes_timeline: string[];
  priority_order: number;
  is_active: boolean;
}

interface PathwayResult {
  name: string;
  match: "HIGH" | "GOOD" | "POSSIBLE";
  processingWeeks: string;
  startingPrice: string;
  reason: string;
}

const defaultForm = {
  id: null as string | null,
  pathway_name: "",
  destination: "",
  match_type: "HIGH" as "HIGH" | "GOOD" | "POSSIBLE",
  processing_weeks: "",
  starting_price_ngn: "",
  description: "",
  requires_destination: [] as string[],
  requires_employment: [] as string[],
  requires_passport: [] as string[],
  requires_income: [] as string[],
  excludes_timeline: [] as string[],
  priority_order: 10,
  is_active: true,
};

const destinationOptions = ["UAE", "Canada", "UK", "Qatar", "Portugal", "Georgia", "StKitts", "unsure"];
const employmentOptions = ["employed", "selfemployed", "business", "student", "between"];
const passportOptions = ["valid2plus", "validunder2", "none"];
const incomeOptions = ["under200k", "200to500k", "500kto1m", "over1m"];
const timelineOptions = ["3to6", "6to12", "1to2years", "exploring"];

const testQuestions = [
  {
    id: "destination",
    question: "Destination",
    options: [
      { value: "UAE", label: "UAE" },
      { value: "Canada", label: "Canada" },
      { value: "UK", label: "UK" },
      { value: "Qatar", label: "Qatar" },
      { value: "Portugal", label: "Portugal" },
      { value: "unsure", label: "Not sure" },
    ],
  },
  {
    id: "employment",
    question: "Employment",
    options: [
      { value: "employed", label: "Employed" },
      { value: "selfemployed", label: "Self-employed" },
      { value: "business", label: "Business owner" },
      { value: "student", label: "Student" },
      { value: "between", label: "Between jobs" },
    ],
  },
  {
    id: "passport",
    question: "Passport",
    options: [
      { value: "valid2plus", label: "Valid 2+ years" },
      { value: "validunder2", label: "Expires within 2" },
      { value: "none", label: "No passport" },
    ],
  },
  {
    id: "income",
    question: "Income",
    options: [
      { value: "under200k", label: "Under ₦200k" },
      { value: "200to500k", label: "₦200k–₦500k" },
      { value: "500kto1m", label: "₦500k–₦1M" },
      { value: "over1m", label: "Over ₦1M" },
    ],
  },
  {
    id: "timeline",
    question: "Timeline",
    options: [
      { value: "3to6", label: "3–6 months" },
      { value: "6to12", label: "6–12 months" },
      { value: "1to2years", label: "1–2 years" },
      { value: "exploring", label: "Exploring" },
    ],
  },
];

function getResults(pathways: Pathway[], answers: Record<string, string>): PathwayResult[] {
  const { destination, employment, passport, income, timeline } = answers;

  const matched = pathways.filter((pathway) => {
    if (pathway.requires_destination?.length > 0) {
      if (!pathway.requires_destination.includes(destination)) return false;
    }
    if (pathway.requires_employment?.length > 0) {
      if (!pathway.requires_employment.includes(employment)) return false;
    }
    if (pathway.requires_passport?.length > 0) {
      if (!pathway.requires_passport.includes(passport)) return false;
    }
    if (pathway.requires_income?.length > 0) {
      if (!pathway.requires_income.includes(income)) return false;
    }
    if (pathway.excludes_timeline?.length > 0) {
      if (pathway.excludes_timeline.includes(timeline)) return false;
    }
    return true;
  });

  return matched.slice(0, 3).map((p) => ({
    name: p.pathway_name,
    match: p.match_type,
    processingWeeks: p.processing_weeks,
    startingPrice: `₦${Number(p.starting_price_ngn).toLocaleString()}`,
    reason: p.description,
  }));
}

function CheckboxGroup({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (values: string[]) => void;
}) {
  return (
    <div style={{ marginBottom: "1rem" }}>
      <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--midnight)", marginBottom: "0.375rem" }}>{label}</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
        {options.map((opt) => (
          <label
            key={opt}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.25rem",
              fontSize: "0.75rem",
              color: "var(--text-secondary)",
              cursor: "pointer",
              padding: "0.25rem 0.5rem",
              borderRadius: "var(--radius-sm)",
              background: selected.includes(opt) ? "var(--teal-pale)" : "var(--off-white)",
              border: selected.includes(opt) ? "1px solid var(--teal)" : "1px solid var(--border)",
            }}
          >
            <input
              type="checkbox"
              checked={selected.includes(opt)}
              onChange={() => {
                if (selected.includes(opt)) {
                  onChange(selected.filter((v) => v !== opt));
                } else {
                  onChange([...selected, opt]);
                }
              }}
              style={{ accentColor: "var(--teal)", margin: 0 }}
            />
            {opt.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase()).replace(/(\d)/g, " $1").trim()}
          </label>
        ))}
      </div>
    </div>
  );
}

const _label = (s: string) =>
  s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export default function EligibilityEditor({ pathways: initial }: { pathways: Pathway[] }) {
  const [pathways, setPathways] = useState(initial);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [testAnswers, setTestAnswers] = useState<Record<string, string>>({});
  const supabase = createClient();

  function selectForm(field: string, value: string | number | boolean | string[]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function _toggleArray(field: string, value: string) {
    const arr = (form as unknown as Record<string, string[]>)[field] || [];
    if (arr.includes(value)) {
      selectForm(field, arr.filter((v) => v !== value));
    } else {
      selectForm(field, [...arr, value]);
    }
  }

  function editPathway(p: Pathway) {
    setForm({
      id: p.id,
      pathway_name: p.pathway_name,
      destination: p.destination,
      match_type: p.match_type,
      processing_weeks: p.processing_weeks,
      starting_price_ngn: String(p.starting_price_ngn),
      description: p.description,
      requires_destination: p.requires_destination || [],
      requires_employment: p.requires_employment || [],
      requires_passport: p.requires_passport || [],
      requires_income: p.requires_income || [],
      excludes_timeline: p.excludes_timeline || [],
      priority_order: p.priority_order,
      is_active: p.is_active,
    });
  }

  function resetForm() {
    setForm(defaultForm);
  }

  async function handleSave() {
    setSaving(true);
    const payload = {
      pathway_name: form.pathway_name,
      destination: form.destination,
      match_type: form.match_type,
      processing_weeks: form.processing_weeks,
      starting_price_ngn: Number(form.starting_price_ngn),
      description: form.description,
      requires_destination: form.requires_destination || [],
      requires_employment: form.requires_employment || [],
      requires_passport: form.requires_passport || [],
      requires_income: form.requires_income || [],
      excludes_timeline: form.excludes_timeline || [],
      priority_order: Number(form.priority_order),
      is_active: form.is_active,
    };

    if (form.id && form.id !== "new") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("eligibility_pathways")
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq("id", form.id)
        .select()
        .single();
      if (!error && data) {
        setPathways((prev) => prev.map((p) => (p.id === form.id ? data : p)));
        resetForm();
      }
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("eligibility_pathways")
        .insert(payload)
        .select()
        .single();
      if (!error && data) {
        setPathways((prev) => [...prev, data]);
        resetForm();
      }
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this pathway?")) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("eligibility_pathways")
      .delete()
      .eq("id", id);
    if (!error) {
      setPathways((prev) => prev.filter((p) => p.id !== id));
    }
  }

  const matchColors: Record<string, { bg: string; color: string }> = {
    HIGH: { bg: "var(--teal-pale)", color: "var(--teal)" },
    GOOD: { bg: "#FFF3CD", color: "#856404" },
    POSSIBLE: { bg: "var(--gray-100)", color: "var(--text-muted)" },
  };

  return (
    <div>
      {/* Pathway list table */}
      <div style={{ overflowX: "auto", marginBottom: "2rem" }}>
        <table style={{ width: "100%", minWidth: 600, borderCollapse: "collapse", background: "white", borderRadius: "var(--radius-lg)", overflow: "hidden", border: "1px solid var(--border)" }}>
          <thead>
            <tr style={{ background: "var(--off-white)", textAlign: "left" }}>
              <th style={{ padding: "0.625rem 0.75rem", fontSize: "0.7rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Name</th>
              <th style={{ padding: "0.625rem 0.75rem", fontSize: "0.7rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Dest</th>
              <th style={{ padding: "0.625rem 0.75rem", fontSize: "0.7rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Match</th>
              <th style={{ padding: "0.625rem 0.75rem", fontSize: "0.7rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Price</th>
              <th style={{ padding: "0.625rem 0.75rem", fontSize: "0.7rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Active</th>
              <th style={{ padding: "0.625rem 0.75rem", fontSize: "0.7rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Order</th>
              <th style={{ padding: "0.625rem 0.75rem" }}></th>
            </tr>
          </thead>
          <tbody>
            {pathways.map((p) => (
              <tr key={p.id} style={{ borderTop: "1px solid var(--border)" }}>
                <td style={{ padding: "0.5rem 0.75rem", fontSize: "0.8125rem", fontWeight: 600, color: "var(--midnight)" }}>{p.pathway_name}</td>
                <td style={{ padding: "0.5rem 0.75rem", fontSize: "0.75rem", color: "var(--text-secondary)" }}>{p.destination}</td>
                <td style={{ padding: "0.5rem 0.75rem" }}>
                  <span style={{ fontSize: "0.65rem", fontWeight: 700, padding: "2px 6px", borderRadius: "20px", background: matchColors[p.match_type]?.bg || "var(--gray-100)", color: matchColors[p.match_type]?.color || "var(--text-muted)" }}>
                    {p.match_type}
                  </span>
                </td>
                <td style={{ padding: "0.5rem 0.75rem", fontSize: "0.75rem", fontFamily: "monospace", color: "var(--text-secondary)" }}>₦{p.starting_price_ngn.toLocaleString()}</td>
                <td style={{ padding: "0.5rem 0.75rem" }}>
                  <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: p.is_active ? "var(--teal)" : "var(--gray-300)" }} />
                </td>
                <td style={{ padding: "0.5rem 0.75rem", fontSize: "0.75rem", color: "var(--text-muted)" }}>{p.priority_order}</td>
                <td style={{ padding: "0.5rem 0.75rem" }}>
                  <div style={{ display: "flex", gap: "0.375rem" }}>
                    <button onClick={() => editPathway(p)} style={{ background: "none", border: "none", fontSize: "0.75rem", color: "var(--teal)", fontWeight: 600, cursor: "pointer" }}>Edit</button>
                    <button onClick={() => handleDelete(p.id)} style={{ background: "none", border: "none", fontSize: "0.75rem", color: "var(--danger)", fontWeight: 600, cursor: "pointer" }}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {pathways.length === 0 && (
              <tr>
                <td colSpan={7} style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.875rem" }}>
                  No pathways yet. Click &quot;Add new pathway&quot; to create one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add button + form */}
      <div style={{ background: "white", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", padding: "1.5rem", marginBottom: "2rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h3 style={{ fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', fontSize: '1rem', fontWeight: 700, color: 'var(--midnight)' }}>
            {form.id ? "Edit pathway" : "Add new pathway"}
          </h3>
          {!form.id && (
            <button onClick={() => editPathway({ id: "new", pathway_name: "", destination: "", match_type: "HIGH", processing_weeks: "", starting_price_ngn: 0, description: "", requires_destination: [], requires_employment: [], requires_passport: [], requires_income: [], excludes_timeline: [], priority_order: 10, is_active: true })} style={{ padding: "0.5rem 1rem", background: "var(--midnight)", color: "white", fontWeight: 700, fontSize: "0.8125rem", borderRadius: "var(--radius-md)", border: "none", cursor: "pointer" }}>
              + Add new pathway
            </button>
          )}
        </div>

        {form.id !== null && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1rem" }}>
              <div>
                <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.25rem" }}>Pathway name</p>
                <input value={form.pathway_name} onChange={(e) => selectForm("pathway_name", e.target.value)} style={{ width: "100%", padding: "0.375rem 0.5rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", fontSize: "0.8125rem" }} />
              </div>
              <div>
                <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.25rem" }}>Destination</p>
                <select value={form.destination} onChange={(e) => selectForm("destination", e.target.value)} style={{ width: "100%", padding: "0.375rem 0.5rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", fontSize: "0.8125rem" }}>
                  <option value="">Select...</option>
                  {destinationOptions.filter((d) => d !== "unsure").map((d) => (<option key={d} value={d}>{d}</option>))}
                </select>
              </div>
              <div>
                <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.25rem" }}>Match type</p>
                <select value={form.match_type} onChange={(e) => selectForm("match_type", e.target.value)} style={{ width: "100%", padding: "0.375rem 0.5rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", fontSize: "0.8125rem" }}>
                  <option value="HIGH">HIGH</option>
                  <option value="GOOD">GOOD</option>
                  <option value="POSSIBLE">POSSIBLE</option>
                </select>
              </div>
              <div>
                <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.25rem" }}>Processing weeks</p>
                <input value={form.processing_weeks} onChange={(e) => selectForm("processing_weeks", e.target.value)} placeholder="e.g. 8–12 weeks" style={{ width: "100%", padding: "0.375rem 0.5rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", fontSize: "0.8125rem" }} />
              </div>
              <div>
                <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.25rem" }}>Starting price (NGN)</p>
                <input type="number" value={form.starting_price_ngn} onChange={(e) => selectForm("starting_price_ngn", e.target.value)} style={{ width: "100%", padding: "0.375rem 0.5rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", fontSize: "0.8125rem" }} />
              </div>
              <div>
                <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.25rem" }}>Priority order</p>
                <input type="number" value={form.priority_order} onChange={(e) => selectForm("priority_order", Number(e.target.value))} style={{ width: "100%", padding: "0.375rem 0.5rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", fontSize: "0.8125rem" }} />
              </div>
              <div>
                <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.25rem" }}>Active</p>
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8125rem", color: "var(--text-secondary)", cursor: "pointer" }}>
                  <input type="checkbox" checked={form.is_active} onChange={(e) => selectForm("is_active", e.target.checked)} style={{ accentColor: "var(--teal)" }} />
                  {form.is_active ? "Active" : "Inactive"}
                </label>
              </div>
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.25rem" }}>Description (shown as reason in results)</p>
              <textarea value={form.description} onChange={(e) => selectForm("description", e.target.value)} rows={3} style={{ width: "100%", padding: "0.375rem 0.5rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", fontSize: "0.8125rem", resize: "vertical" }} />
            </div>

            <div style={{ borderTop: "1px solid var(--border)", paddingTop: "1rem", marginBottom: "1rem" }}>
              <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--midnight)", marginBottom: "0.75rem" }}>Conditions</p>
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "1rem", lineHeight: 1.5 }}>
                A pathway appears in results only when the user&apos;s answers match ALL checked conditions.
                Leave a condition group empty to match any answer for that question.
                Excludes timeline: pathway is hidden if user selects any of the checked timeline options.
              </p>

              <CheckboxGroup label="Requires destination" options={destinationOptions} selected={form.requires_destination} onChange={(v) => selectForm("requires_destination", v)} />
              <CheckboxGroup label="Requires employment" options={employmentOptions} selected={form.requires_employment} onChange={(v) => selectForm("requires_employment", v)} />
              <CheckboxGroup label="Requires passport" options={passportOptions} selected={form.requires_passport} onChange={(v) => selectForm("requires_passport", v)} />
              <CheckboxGroup label="Requires income" options={incomeOptions} selected={form.requires_income} onChange={(v) => selectForm("requires_income", v)} />
              <CheckboxGroup label="Excludes timeline" options={timelineOptions} selected={form.excludes_timeline} onChange={(v) => selectForm("excludes_timeline", v)} />
            </div>

            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button onClick={handleSave} disabled={saving} style={{ padding: "0.5rem 1.25rem", background: "var(--teal)", color: "var(--midnight)", fontWeight: 700, fontSize: "0.8125rem", borderRadius: "var(--radius-md)", border: "none", cursor: "pointer" }}>
                {saving ? "Saving..." : form.id && form.id !== "new" ? "Update pathway" : "Create pathway"}
              </button>
              <button onClick={resetForm} style={{ padding: "0.5rem 1.25rem", background: "none", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", fontSize: "0.8125rem", cursor: "pointer" }}>Cancel</button>
            </div>
          </div>
        )}
      </div>

      {/* Test panel */}
      <div style={{ background: "var(--off-white)", borderRadius: "var(--radius-lg)", padding: "1.5rem" }}>
        <h3 style={{ fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', fontSize: '1rem', fontWeight: 700, color: 'var(--midnight)', marginBottom: "0.5rem" }}>
          Test your pathways
        </h3>
        <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
          Simulate what a visitor sees by selecting answers. No save needed — results update immediately.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1.5rem" }}>
          {testQuestions.map((q) => (
            <div key={q.id}>
              <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.25rem" }}>{q.question}</p>
              <select
                value={testAnswers[q.id] || ""}
                onChange={(e) => setTestAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                style={{ padding: "0.375rem 0.5rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", fontSize: "0.8125rem" }}
              >
                <option value="">Select...</option>
                {q.options.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
              </select>
            </div>
          ))}
        </div>

        {testQuestions.every((q) => testAnswers[q.id]) ? (
          <div>
            <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--midnight)", marginBottom: "0.75rem" }}>
              Matched pathways ({getResults(pathways, testAnswers).length}):
            </p>
            {getResults(pathways, testAnswers).length === 0 ? (
              <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>No pathways match these answers.</p>
            ) : (
              getResults(pathways, testAnswers).map((r, i) => (
                <div key={i} style={{ background: "white", borderRadius: "var(--radius-md)", padding: "0.75rem 1rem", marginBottom: "0.5rem", border: "1px solid var(--border)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem" }}>
                    <span style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--midnight)" }}>{r.name}</span>
                    <span style={{ fontSize: "0.65rem", fontWeight: 700, padding: "2px 6px", borderRadius: "20px", background: matchColors[r.match]?.bg, color: matchColors[r.match]?.color }}>{r.match}</span>
                  </div>
                  <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", lineHeight: 1.4 }}>{r.reason}</p>
                </div>
              ))
            )}
          </div>
        ) : (
          <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>Select all 5 answers to see matching pathways.</p>
        )}
      </div>
    </div>
  );
}
