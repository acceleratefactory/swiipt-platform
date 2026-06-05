"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const CATEGORIES = [
  "residency_permit", "second_citizenship", "company_registration",
  "work_visa", "remote_work_visa", "holiday_package",
  "relocation_concierge", "landing_package", "diaspora_services", "corporate_mobility",
];

const CURRENCIES = [
  { key: "price_ngn", label: "NGN (₦)" },
  { key: "price_usd", label: "USD ($)" },
  { key: "price_aed", label: "AED" },
  { key: "price_qar", label: "QAR" },
  { key: "price_gbp", label: "GBP (£)" },
  { key: "price_cad", label: "CAD (CA$)" },
  { key: "price_eur", label: "EUR (€)" },
];

export default function ServicePackageForm({ pkg }: { pkg?: any }) {
  const router = useRouter();
  const isEdit = !!pkg;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [autoCalc, setAutoCalc] = useState(false);

  const [form, setForm] = useState({
    category: pkg?.category || "",
    destination: pkg?.destination || "",
    name: pkg?.name || "",
    short_description: pkg?.short_description || "",
    full_description: pkg?.full_description || "",
    price_ngn: pkg?.price_ngn?.toString() || "",
    price_usd: pkg?.price_usd?.toString() || "",
    price_aed: pkg?.price_aed?.toString() || "",
    price_qar: pkg?.price_qar?.toString() || "",
    price_gbp: pkg?.price_gbp?.toString() || "",
    price_cad: pkg?.price_cad?.toString() || "",
    price_eur: pkg?.price_eur?.toString() || "",
    processing_weeks_min: pkg?.processing_weeks_min?.toString() || "",
    processing_weeks_max: pkg?.processing_weeks_max?.toString() || "",
    is_active: pkg?.is_active ?? true,
    is_featured: pkg?.is_featured ?? false,
    badge_text: pkg?.badge_text || "",
    sort_order: pkg?.sort_order?.toString() || "0",
  });

  async function handleAutoCalc() {
    const ngn = parseFloat(form.price_ngn);
    if (!ngn) return;
    try {
      await fetch("/api/admin/currencies/update-rate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
    } catch {}
    setForm((f) => ({
      ...f,
      price_usd: (ngn / 1650).toFixed(0),
      price_aed: (ngn / 449).toFixed(0),
      price_qar: (ngn / 453).toFixed(0),
      price_gbp: (ngn / 2090).toFixed(0),
      price_cad: (ngn / 1210).toFixed(0),
      price_eur: (ngn / 1780).toFixed(0),
    }));
  }

  useEffect(() => {
    if (autoCalc && form.price_ngn) {
      handleAutoCalc();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoCalc, form.price_ngn]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const body: any = { ...form };
    body.price_ngn = form.price_ngn ? parseFloat(form.price_ngn) : null;
    body.price_usd = form.price_usd ? parseFloat(form.price_usd) : null;
    body.price_aed = form.price_aed ? parseFloat(form.price_aed) : null;
    body.price_qar = form.price_qar ? parseFloat(form.price_qar) : null;
    body.price_gbp = form.price_gbp ? parseFloat(form.price_gbp) : null;
    body.price_cad = form.price_cad ? parseFloat(form.price_cad) : null;
    body.price_eur = form.price_eur ? parseFloat(form.price_eur) : null;
    body.processing_weeks_min = form.processing_weeks_min ? parseInt(form.processing_weeks_min) : null;
    body.processing_weeks_max = form.processing_weeks_max ? parseInt(form.processing_weeks_max) : null;
    body.sort_order = parseInt(form.sort_order);
    if (isEdit) body.id = pkg.id;

    const res = await fetch("/api/admin/services/upsert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (!res.ok) { setError(data.error || "Save failed"); setSaving(false); return; }
    router.push("/admin/services");
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: "720px" }}>
      <div style={{ background: "white", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", padding: "1.5rem", marginBottom: "1.5rem" }}>
        <h2 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1rem", fontWeight: 700, color: "var(--midnight)", marginBottom: "1rem" }}>
          Basic information
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.375rem" }}>Category</label>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required style={{ width: "100%", padding: "0.625rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", fontSize: "0.875rem", background: "white" }}>
              <option value="">Select category</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c.replace(/_/g, " ")}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.375rem" }}>Destination</label>
            <input value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} required style={{ width: "100%", padding: "0.625rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", fontSize: "0.875rem" }} />
          </div>
        </div>
        <div style={{ marginBottom: "0.75rem" }}>
          <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.375rem" }}>Package name</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required style={{ width: "100%", padding: "0.625rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", fontSize: "0.875rem" }} />
        </div>
        <div style={{ marginBottom: "0.75rem" }}>
          <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.375rem" }}>Short description (max 120 chars)</label>
          <input value={form.short_description} onChange={(e) => setForm({ ...form, short_description: e.target.value })} maxLength={120} style={{ width: "100%", padding: "0.625rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", fontSize: "0.875rem" }} />
        </div>
        <div style={{ marginBottom: "0.75rem" }}>
          <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.375rem" }}>Full description</label>
          <textarea value={form.full_description} onChange={(e) => setForm({ ...form, full_description: e.target.value })} rows={4} style={{ width: "100%", padding: "0.625rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", fontSize: "0.875rem" }} />
        </div>
      </div>

      <div style={{ background: "white", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", padding: "1.5rem", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h2 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1rem", fontWeight: 700, color: "var(--midnight)" }}>
            Multi-currency pricing
          </h2>
          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8125rem", color: "var(--text-secondary)", cursor: "pointer" }}>
            <input type="checkbox" checked={autoCalc} onChange={() => setAutoCalc(!autoCalc)} />
            Auto-calculate from NGN
          </label>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          {CURRENCIES.map((cur) => (
            <div key={cur.key}>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.25rem" }}>{cur.label}</label>
              <input type="number" value={(form as any)[cur.key]} onChange={(e) => setForm({ ...form, [cur.key]: e.target.value })} style={{ width: "100%", padding: "0.625rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", fontSize: "0.875rem" }} />
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: "white", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", padding: "1.5rem", marginBottom: "1.5rem" }}>
        <h2 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1rem", fontWeight: 700, color: "var(--midnight)", marginBottom: "1rem" }}>
          Processing & display
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.375rem" }}>Processing weeks (min)</label>
            <input type="number" value={form.processing_weeks_min} onChange={(e) => setForm({ ...form, processing_weeks_min: e.target.value })} style={{ width: "100%", padding: "0.625rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", fontSize: "0.875rem" }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.375rem" }}>Processing weeks (max)</label>
            <input type="number" value={form.processing_weeks_max} onChange={(e) => setForm({ ...form, processing_weeks_max: e.target.value })} style={{ width: "100%", padding: "0.625rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", fontSize: "0.875rem" }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.375rem" }}>Sort order</label>
            <input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} style={{ width: "100%", padding: "0.625rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", fontSize: "0.875rem" }} />
          </div>
        </div>
        <div style={{ marginBottom: "0.75rem" }}>
          <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.375rem" }}>Badge text (optional)</label>
          <input value={form.badge_text} onChange={(e) => setForm({ ...form, badge_text: e.target.value })} placeholder="e.g. Most Popular" style={{ width: "100%", padding: "0.625rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", fontSize: "0.875rem" }} />
        </div>
        <div style={{ display: "flex", gap: "1.5rem" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", color: "var(--text-secondary)", cursor: "pointer" }}>
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
            Active
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", color: "var(--text-secondary)", cursor: "pointer" }}>
            <input type="checkbox" checked={form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} />
            Featured
          </label>
        </div>
      </div>

      {error && <p style={{ color: "var(--danger)", fontSize: "0.875rem", marginBottom: "1rem" }}>{error}</p>}

      <div style={{ display: "flex", gap: "1rem" }}>
        <button type="submit" disabled={saving} style={{ padding: "0.75rem 2rem", background: "var(--midnight)", color: "white", fontWeight: 700, fontSize: "0.875rem", borderRadius: "var(--radius-md)", border: "none", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.6 : 1 }}>
          {saving ? "Saving..." : isEdit ? "Update package" : "Create package"}
        </button>
        <a href="/admin/services" style={{ padding: "0.75rem 2rem", background: "var(--gray-100)", color: "var(--text-secondary)", fontWeight: 600, fontSize: "0.875rem", borderRadius: "var(--radius-md)", textDecoration: "none" }}>
          Cancel
        </a>
      </div>
    </form>
  );
}
