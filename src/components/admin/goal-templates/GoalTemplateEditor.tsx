"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const CATEGORY_OPTIONS = [
  { value: "residency_permit", label: "Residency Permit" },
  { value: "work_visa", label: "Work Visa" },
  { value: "remote_work_visa", label: "Remote Work Visa" },
  { value: "second_citizenship", label: "2nd Citizenship" },
  { value: "company_registration", label: "Company Registration" },
  { value: "holiday_package", label: "Holiday Package" },
  { value: "general_travel", label: "General Travel" },
  { value: "relocation_concierge", label: "Relocation Concierge" },
];

const LOCK_TYPE_OPTIONS = [
  { value: "locked", label: "Locked" },
  { value: "flexible", label: "Flexible" },
];

const labelS: React.CSSProperties = {
  display: "block", fontSize: "0.75rem", fontWeight: 600,
  color: "var(--text-muted)", marginBottom: "0.375rem",
};

const inputS: React.CSSProperties = {
  width: "100%", padding: "0.625rem", borderRadius: "var(--radius-sm)",
  border: "1px solid var(--border)", fontSize: "0.875rem", background: "white",
};

const sectionS: React.CSSProperties = {
  background: "white", borderRadius: "var(--radius-lg)",
  border: "1px solid var(--border)", padding: "1.5rem", marginBottom: "1.5rem",
};

export default function GoalTemplateEditor({ template }: { template?: any }) {
  const router = useRouter();
  const isEdit = !!template;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: template?.name || "",
    description: template?.description || "",
    category: template?.category || "",
    destination: template?.destination || "",
    target_amount_ngn: template?.target_amount_ngn?.toString() || "",
    lock_type: template?.lock_type || "locked",
    lock_months: template?.lock_months?.toString() || "12",
    icon: template?.icon || "🌍",
    segment: template?.segment || "",
    related_niche_page_slug: template?.related_niche_page_slug || "",
    sort_order: template?.sort_order?.toString() || "10",
    is_active: template?.is_active ?? true,
  });

  function handleChange(key: string, value: any) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const body: any = { ...form };
    body.target_amount_ngn = form.target_amount_ngn ? parseFloat(form.target_amount_ngn) : null;
    body.lock_months = form.lock_type === "locked" && form.lock_months ? parseInt(form.lock_months) : null;
    body.sort_order = parseInt(form.sort_order);
    if (isEdit) body.id = template.id;

    const res = await fetch("/api/admin/goal-templates/upsert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (!res.ok) { setError(data.error || "Save failed"); setSaving(false); return; }
    router.push("/admin/goal-templates");
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: "640px" }}>
      <div style={sectionS}>
        <h2 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1rem", fontWeight: 700, color: "var(--midnight)", marginBottom: "1rem" }}>
          Template details
        </h2>

        <div style={{ marginBottom: "0.75rem" }}>
          <label style={labelS}>Name</label>
          <input value={form.name} onChange={(e) => handleChange("name", e.target.value)} required style={inputS} placeholder="e.g. Dubai Work Visa + Setup Fund" />
        </div>

        <div style={{ marginBottom: "0.75rem" }}>
          <label style={labelS}>Description</label>
          <textarea value={form.description} onChange={(e) => handleChange("description", e.target.value)} required rows={2} style={inputS} placeholder="Brief description shown to users" />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "0.75rem" }}>
          <div>
            <label style={labelS}>Category</label>
            <select value={form.category} onChange={(e) => handleChange("category", e.target.value)} required style={inputS}>
              <option value="">Select category</option>
              {CATEGORY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label style={labelS}>Destination</label>
            <input value={form.destination} onChange={(e) => handleChange("destination", e.target.value)} style={inputS} placeholder="e.g. UAE, Canada" />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "0.75rem" }}>
          <div>
            <label style={labelS}>Target amount (NGN)</label>
            <input type="number" value={form.target_amount_ngn} onChange={(e) => handleChange("target_amount_ngn", e.target.value)} required min={0} style={inputS} />
          </div>
          <div>
            <label style={labelS}>Icon (emoji)</label>
            <input value={form.icon} onChange={(e) => handleChange("icon", e.target.value)} style={inputS} placeholder="e.g. 🇦🇪 🌍" />
          </div>
        </div>
      </div>

      <div style={sectionS}>
        <h2 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1rem", fontWeight: 700, color: "var(--midnight)", marginBottom: "1rem" }}>
          Savings settings
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "0.75rem" }}>
          <div>
            <label style={labelS}>Lock type</label>
            <select value={form.lock_type} onChange={(e) => handleChange("lock_type", e.target.value)} required style={inputS}>
              {LOCK_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label style={labelS}>Lock months</label>
            <input
              type="number"
              value={form.lock_months}
              onChange={(e) => handleChange("lock_months", e.target.value)}
              min={1}
              style={{
                ...inputS,
                opacity: form.lock_type === "flexible" ? 0.4 : 1,
              }}
              disabled={form.lock_type === "flexible"}
            />
            {form.lock_type === "flexible" && (
              <span style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>Not used for flexible goals</span>
            )}
          </div>
        </div>
      </div>

      <div style={sectionS}>
        <h2 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1rem", fontWeight: 700, color: "var(--midnight)", marginBottom: "1rem" }}>
          Classification
        </h2>

        <div style={{ marginBottom: "0.75rem" }}>
          <label style={labelS}>Segment (internal grouping)</label>
          <input value={form.segment} onChange={(e) => handleChange("segment", e.target.value)} style={inputS} placeholder="e.g. uae_worker, holiday_traveller" />
        </div>

        <div style={{ marginBottom: "0.75rem" }}>
          <label style={labelS}>Related niche page slug</label>
          <input value={form.related_niche_page_slug} onChange={(e) => handleChange("related_niche_page_slug", e.target.value)} style={inputS} placeholder="e.g. uae-dubai-residency" />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "0.75rem" }}>
          <div>
            <label style={labelS}>Sort order</label>
            <input type="number" value={form.sort_order} onChange={(e) => handleChange("sort_order", e.target.value)} style={inputS} />
          </div>
          <div>
            <label style={{ ...labelS, marginBottom: "0.75rem" }}>Active</label>
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", color: "var(--text-secondary)", cursor: "pointer", marginTop: "0.375rem" }}>
              <input type="checkbox" checked={form.is_active} onChange={(e) => handleChange("is_active", e.target.checked)} />
              Visible to users
            </label>
          </div>
        </div>
      </div>

      {error && <p style={{ color: "var(--danger)", fontSize: "0.875rem", marginBottom: "1rem" }}>{error}</p>}

      <div style={{ display: "flex", gap: "1rem", marginBottom: "3rem" }}>
        <button type="submit" disabled={saving} style={{ padding: "0.75rem 2rem", background: "var(--midnight)", color: "white", fontWeight: 700, fontSize: "0.875rem", borderRadius: "var(--radius-md)", border: "none", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.6 : 1 }}>
          {saving ? "Saving..." : isEdit ? "Update template" : "Create template"}
        </button>
        <a href="/admin/goal-templates" style={{ padding: "0.75rem 2rem", background: "var(--gray-100)", color: "var(--text-secondary)", fontWeight: 600, fontSize: "0.875rem", borderRadius: "var(--radius-md)", textDecoration: "none" }}>
          Cancel
        </a>
      </div>
    </form>
  );
}
