"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const CATEGORIES = [
  "general", "fashion", "technology", "manufacturing",
  "healthcare", "agriculture", "energy", "education",
  "finance", "tourism",
];

export default function TradeShowForm({ show }: { show?: any }) {
  const router = useRouter();
  const isEdit = !!show;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function toDateInput(value: string | null | undefined): string {
    if (!value) return "";
    return value.substring(0, 10);
  }

  const [form, setForm] = useState({
    name: show?.name || "",
    location_city: show?.location_city || "",
    location_country: show?.location_country || "",
    venue: show?.venue || "",
    event_date_start: toDateInput(show?.event_date_start),
    event_date_end: toDateInput(show?.event_date_end),
    registration_deadline: toDateInput(show?.registration_deadline),
    category: show?.category || "",
    base_cost_solo_ngn: show?.base_cost_solo_ngn?.toString() || "",
    base_cost_group_ngn: show?.base_cost_group_ngn?.toString() || "",
    min_group_size: show?.min_group_size?.toString() || "",
    max_group_size: show?.max_group_size?.toString() || "",
    description: show?.description || "",
    invitation_letter_fee_ngn: show?.invitation_letter_fee_ngn?.toString() || "",
    image_url: show?.image_url || "",
    is_active: show?.is_active ?? true,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const body: any = {
      name: form.name,
      location_city: form.location_city,
      location_country: form.location_country,
      venue: form.venue || null,
      event_date_start: form.event_date_start,
      event_date_end: form.event_date_end,
      registration_deadline: form.registration_deadline || null,
      category: form.category,
      base_cost_solo_ngn: form.base_cost_solo_ngn ? parseFloat(form.base_cost_solo_ngn) : 0,
      base_cost_group_ngn: form.base_cost_group_ngn ? parseFloat(form.base_cost_group_ngn) : null,
      min_group_size: form.min_group_size ? parseInt(form.min_group_size) : 1,
      max_group_size: form.max_group_size ? parseInt(form.max_group_size) : 1,
      description: form.description || null,
      invitation_letter_fee_ngn: form.invitation_letter_fee_ngn ? parseFloat(form.invitation_letter_fee_ngn) : null,
      image_url: form.image_url || null,
      is_active: form.is_active,
    };
    if (isEdit) body.id = show.id;

    const res = await fetch("/api/admin/trade-shows/upsert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (!res.ok) { setError(data.error || "Save failed"); setSaving(false); return; }
    router.push("/admin/trade-shows");
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: "720px" }}>
      <div style={{ background: "white", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", padding: "1.5rem", marginBottom: "1.5rem" }}>
        <h2 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1rem", fontWeight: 700, color: "var(--midnight)", marginBottom: "1rem" }}>
          Basic information
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.375rem" }}>Name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required style={{ width: "100%", padding: "0.625rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", fontSize: "0.875rem" }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.375rem" }}>Category</label>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required style={{ width: "100%", padding: "0.625rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", fontSize: "0.875rem", background: "white" }}>
              <option value="">Select category</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c.replace(/_/g, " ")}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.375rem" }}>City</label>
            <input value={form.location_city} onChange={(e) => setForm({ ...form, location_city: e.target.value })} required style={{ width: "100%", padding: "0.625rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", fontSize: "0.875rem" }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.375rem" }}>Country</label>
            <input value={form.location_country} onChange={(e) => setForm({ ...form, location_country: e.target.value })} required style={{ width: "100%", padding: "0.625rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", fontSize: "0.875rem" }} />
          </div>
        </div>
        <div style={{ marginBottom: "0.75rem" }}>
          <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.375rem" }}>Venue <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>(optional)</span></label>
          <input value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} style={{ width: "100%", padding: "0.625rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", fontSize: "0.875rem" }} />
        </div>
        <div style={{ marginBottom: "0.75rem" }}>
          <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.375rem" }}>Description <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>(optional)</span></label>
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} style={{ width: "100%", padding: "0.625rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", fontSize: "0.875rem" }} />
        </div>
        <div style={{ marginBottom: "0.75rem" }}>
          <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.375rem" }}>Image URL <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>(optional)</span></label>
          <input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://..." style={{ width: "100%", padding: "0.625rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", fontSize: "0.875rem" }} />
        </div>
      </div>

      <div style={{ background: "white", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", padding: "1.5rem", marginBottom: "1.5rem" }}>
        <h2 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1rem", fontWeight: 700, color: "var(--midnight)", marginBottom: "1rem" }}>
          Dates & deadlines
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.375rem" }}>Event start</label>
            <input type="date" value={form.event_date_start} onChange={(e) => setForm({ ...form, event_date_start: e.target.value })} required style={{ width: "100%", padding: "0.625rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", fontSize: "0.875rem" }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.375rem" }}>Event end</label>
            <input type="date" value={form.event_date_end} onChange={(e) => setForm({ ...form, event_date_end: e.target.value })} required style={{ width: "100%", padding: "0.625rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", fontSize: "0.875rem" }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.375rem" }}>Registration deadline <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>(optional)</span></label>
            <input type="date" value={form.registration_deadline} onChange={(e) => setForm({ ...form, registration_deadline: e.target.value })} style={{ width: "100%", padding: "0.625rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", fontSize: "0.875rem" }} />
          </div>
        </div>
      </div>

      <div style={{ background: "white", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", padding: "1.5rem", marginBottom: "1.5rem" }}>
        <h2 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1rem", fontWeight: 700, color: "var(--midnight)", marginBottom: "1rem" }}>
          Pricing & group size
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.375rem" }}>Solo price (NGN)</label>
            <input type="number" value={form.base_cost_solo_ngn} onChange={(e) => setForm({ ...form, base_cost_solo_ngn: e.target.value })} required min={0} style={{ width: "100%", padding: "0.625rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", fontSize: "0.875rem" }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.375rem" }}>Group price (NGN) <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>(optional)</span></label>
            <input type="number" value={form.base_cost_group_ngn} onChange={(e) => setForm({ ...form, base_cost_group_ngn: e.target.value })} min={0} style={{ width: "100%", padding: "0.625rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", fontSize: "0.875rem" }} />
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.375rem" }}>Min group size</label>
            <input type="number" value={form.min_group_size} onChange={(e) => setForm({ ...form, min_group_size: e.target.value })} required min={1} style={{ width: "100%", padding: "0.625rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", fontSize: "0.875rem" }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.375rem" }}>Max group size</label>
            <input type="number" value={form.max_group_size} onChange={(e) => setForm({ ...form, max_group_size: e.target.value })} required min={1} style={{ width: "100%", padding: "0.625rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", fontSize: "0.875rem" }} />
          </div>
        </div>
        <div>
          <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.375rem" }}>Invitation letter fee (NGN) <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>(optional)</span></label>
          <input type="number" value={form.invitation_letter_fee_ngn} onChange={(e) => setForm({ ...form, invitation_letter_fee_ngn: e.target.value })} min={0} style={{ width: "100%", padding: "0.625rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", fontSize: "0.875rem" }} />
        </div>
      </div>

      <div style={{ background: "white", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", padding: "1.5rem", marginBottom: "1.5rem" }}>
        <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", color: "var(--text-secondary)", cursor: "pointer" }}>
          <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
          Active (visible to users)
        </label>
      </div>

      {error && <p style={{ color: "var(--danger)", fontSize: "0.875rem", marginBottom: "1rem" }}>{error}</p>}

      <div style={{ display: "flex", gap: "1rem" }}>
        <button type="submit" disabled={saving} style={{ padding: "0.75rem 2rem", background: "var(--midnight)", color: "white", fontWeight: 700, fontSize: "0.875rem", borderRadius: "var(--radius-md)", border: "none", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.6 : 1 }}>
          {saving ? "Saving..." : isEdit ? "Update show" : "Create show"}
        </button>
        <a href="/admin/trade-shows" style={{ padding: "0.75rem 2rem", background: "var(--gray-100)", color: "var(--text-secondary)", fontWeight: 600, fontSize: "0.875rem", borderRadius: "var(--radius-md)", textDecoration: "none" }}>
          Cancel
        </a>
      </div>
    </form>
  );
}
