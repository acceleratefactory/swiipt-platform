"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface GoalTemplateEditorProps {
  template?: {
    id: string;
    name: string;
    description: string;
    category: string;
    destination: string | null;
    target_amount_ngn: number;
    lock_type: string;
    lock_months: number | null;
    icon: string;
    segment: string | null;
    related_niche_page_slug: string | null;
    sort_order: number;
    is_active: boolean;
  };
}

const CATEGORIES = [
  { value: "residency_permit", label: "Residency Permit" },
  { value: "work_visa", label: "Work Visa" },
  { value: "remote_work_visa", label: "Remote Work Visa" },
  { value: "second_citizenship", label: "Second Citizenship" },
  { value: "company_registration", label: "Company Registration" },
  { value: "holiday_package", label: "Holiday Package" },
  { value: "general_travel", label: "General Travel" },
  { value: "relocation_concierge", label: "Relocation Concierge" },
];

export default function GoalTemplateEditor({ template }: GoalTemplateEditorProps) {
  const router = useRouter();
  const isEditing = !!template?.id;

  const [form, setForm] = useState({
    name: template?.name || "",
    description: template?.description || "",
    category: template?.category || "residency_permit",
    destination: template?.destination || "",
    target_amount_ngn: template?.target_amount_ngn?.toString() || "",
    lock_type: template?.lock_type || "locked",
    lock_months: template?.lock_months?.toString() || "",
    icon: template?.icon || "🌍",
    segment: template?.segment || "",
    related_niche_page_slug: template?.related_niche_page_slug || "",
    sort_order: template?.sort_order?.toString() || "10",
    is_active: template?.is_active !== false,
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function update(field: string, value: string | boolean) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleSubmit() {
    setError("");

    if (!form.name.trim()) { setError("Name is required."); return; }
    if (!form.description.trim()) { setError("Description is required."); return; }
    if (!form.target_amount_ngn || isNaN(Number(form.target_amount_ngn))) {
      setError("Target amount must be a valid number.");
      return;
    }
    if (form.lock_type === "locked" && (!form.lock_months || isNaN(Number(form.lock_months)))) {
      setError("Lock months is required for locked goals.");
      return;
    }

    setSaving(true);

    // Use browser Supabase client — carries user session for RLS
    const supabase = createClient();

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      category: form.category,
      destination: form.destination.trim() || null,
      target_amount_ngn: Number(form.target_amount_ngn),
      lock_type: form.lock_type,
      lock_months: form.lock_type === "locked" ? Number(form.lock_months) : null,
      icon: form.icon.trim() || "🌍",
      segment: form.segment.trim() || null,
      related_niche_page_slug: form.related_niche_page_slug.trim() || null,
      sort_order: Number(form.sort_order) || 10,
      is_active: form.is_active,
      updated_at: new Date().toISOString(),
    };

    if (isEditing) {
      // UPDATE — use .eq("id", template.id) only, do NOT use .single() on update
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: updateError } = await (supabase as any)
        .from("goal_templates")
        .update(payload)
        .eq("id", template!.id);

      setSaving(false);

      if (updateError) {
        setError("Failed to update: " + updateError.message);
        return;
      }

      router.push("/admin/goal-templates");
      router.refresh();

    } else {
      // INSERT — do NOT use .single() if you do not need the returned row
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: insertError } = await (supabase as any)
        .from("goal_templates")
        .insert(payload);

      setSaving(false);

      if (insertError) {
        setError("Failed to create: " + insertError.message);
        return;
      }

      router.push("/admin/goal-templates");
      router.refresh();
    }
  }

  const fieldStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.625rem 0.875rem",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-md)",
    fontSize: "0.875rem",
    color: "var(--midnight)",
    outline: "none",
    background: "white",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: "0.8125rem",
    fontWeight: 600,
    color: "var(--midnight)",
    display: "block",
    marginBottom: "0.375rem",
  };

  const sectionStyle: React.CSSProperties = {
    background: "white",
    borderRadius: "var(--radius-lg)",
    border: "1px solid var(--border)",
    padding: "1.5rem",
    marginBottom: "1rem",
  };

  return (
    <div style={{ maxWidth: "640px" }}>
      {/* Template details */}
      <div style={sectionStyle}>
        <h3 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontWeight: 700, color: "var(--midnight)", marginBottom: "1.25rem" }}>
          Template details
        </h3>
        <div style={{ marginBottom: "1rem" }}>
          <label style={labelStyle}>Name *</label>
          <input value={form.name} onChange={e => update("name", e.target.value)}
            placeholder="e.g. Dubai Work Visa + Setup Fund" style={fieldStyle} />
        </div>
        <div style={{ marginBottom: "1rem" }}>
          <label style={labelStyle}>Description *</label>
          <textarea value={form.description} onChange={e => update("description", e.target.value)}
            placeholder="Shown to users when they select this template" rows={3}
            style={{ ...fieldStyle, resize: "vertical" as const }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
          <div>
            <label style={labelStyle}>Category *</label>
            <select value={form.category} onChange={e => update("category", e.target.value)} style={fieldStyle}>
              {CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Destination</label>
            <input value={form.destination} onChange={e => update("destination", e.target.value)}
              placeholder="e.g. UAE, Canada (leave empty for any)" style={fieldStyle} />
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          <div>
            <label style={labelStyle}>Target amount (₦) *</label>
            <input type="number" value={form.target_amount_ngn} onChange={e => update("target_amount_ngn", e.target.value)}
              placeholder="1200000" style={fieldStyle} />
          </div>
          <div>
            <label style={labelStyle}>Icon (emoji or text)</label>
            <input value={form.icon} onChange={e => update("icon", e.target.value)}
              placeholder="🇦🇪" style={fieldStyle} />
          </div>
        </div>
      </div>

      {/* Savings settings */}
      <div style={sectionStyle}>
        <h3 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontWeight: 700, color: "var(--midnight)", marginBottom: "1.25rem" }}>
          Savings settings
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          <div>
            <label style={labelStyle}>Lock type</label>
            <select value={form.lock_type} onChange={e => update("lock_type", e.target.value)} style={fieldStyle}>
              <option value="locked">Locked</option>
              <option value="flexible">Flexible</option>
            </select>
          </div>
          {form.lock_type === "locked" && (
            <div>
              <label style={labelStyle}>Lock months *</label>
              <input type="number" value={form.lock_months} onChange={e => update("lock_months", e.target.value)}
                placeholder="6" min="1" max="36" style={fieldStyle} />
            </div>
          )}
        </div>
      </div>

      {/* Classification */}
      <div style={sectionStyle}>
        <h3 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontWeight: 700, color: "var(--midnight)", marginBottom: "1.25rem" }}>
          Classification
        </h3>
        <div style={{ marginBottom: "1rem" }}>
          <label style={labelStyle}>Segment (internal grouping)</label>
          <input value={form.segment} onChange={e => update("segment", e.target.value)}
            placeholder="e.g. uae_worker, canada_seeker" style={fieldStyle} />
        </div>
        <div style={{ marginBottom: "1rem" }}>
          <label style={labelStyle}>Related niche page slug</label>
          <input value={form.related_niche_page_slug} onChange={e => update("related_niche_page_slug", e.target.value)}
            placeholder="e.g. uae-dubai-residency" style={fieldStyle} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          <div>
            <label style={labelStyle}>Sort order</label>
            <input type="number" value={form.sort_order} onChange={e => update("sort_order", e.target.value)}
              placeholder="10" style={fieldStyle} />
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", paddingBottom: "2px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.875rem" }}>
              <input type="checkbox" checked={form.is_active} onChange={e => update("is_active", e.target.checked)}
                style={{ accentColor: "var(--teal)", width: 16, height: 16 }} />
              Visible to users
            </label>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "var(--radius-md)", padding: "0.75rem 1rem", fontSize: "0.875rem", color: "var(--danger)", marginBottom: "1rem" }}>
          {error}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: "0.75rem" }}>
        <button
          onClick={handleSubmit}
          disabled={saving}
          style={{
            padding: "0.875rem 1.75rem",
            background: saving ? "var(--gray-300)" : "var(--midnight)",
            color: saving ? "var(--text-muted)" : "white",
            fontWeight: 700,
            fontSize: "0.9375rem",
            borderRadius: "var(--radius-md)",
            border: "none",
            cursor: saving ? "not-allowed" : "pointer",
          }}
        >
          {saving ? "Saving..." : isEditing ? "Update template" : "Create template"}
        </button>
        <a href="/admin/goal-templates" style={{ padding: "0.875rem 1.25rem", background: "var(--gray-100)", color: "var(--text-secondary)", fontWeight: 600, fontSize: "0.9375rem", borderRadius: "var(--radius-md)", textDecoration: "none" }}>
          Cancel
        </a>
      </div>
    </div>
  );
}
