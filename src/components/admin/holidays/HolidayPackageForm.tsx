"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const CURRENCIES = [
  { key: "price_per_person_ngn", label: "NGN (₦)" },
  { key: "price_per_person_usd", label: "USD ($)" },
  { key: "price_per_person_aed", label: "AED" },
  { key: "price_per_person_qar", label: "QAR" },
  { key: "price_per_person_gbp", label: "GBP (£)" },
  { key: "price_per_person_cad", label: "CAD (CA$)" },
  { key: "price_per_person_eur", label: "EUR (€)" },
];

export default function HolidayPackageForm({ pkg }: { pkg?: any }) {
  const router = useRouter();
  const isEdit = !!pkg;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [autoCalc, setAutoCalc] = useState(false);

  const [form, setForm] = useState({
    title: pkg?.title || "",
    destination: pkg?.destination || "",
    description: pkg?.description || "",
    duration_nights: pkg?.duration_nights?.toString() || "",
    price_per_person_ngn: pkg?.price_per_person_ngn?.toString() || "",
    price_per_person_usd: pkg?.price_per_person_usd?.toString() || "",
    price_per_person_aed: pkg?.price_per_person_aed?.toString() || "",
    price_per_person_qar: pkg?.price_per_person_qar?.toString() || "",
    price_per_person_gbp: pkg?.price_per_person_gbp?.toString() || "",
    price_per_person_cad: pkg?.price_per_person_cad?.toString() || "",
    price_per_person_eur: pkg?.price_per_person_eur?.toString() || "",
    original_price_ngn: pkg?.original_price_ngn?.toString() || "",
    slots_available: pkg?.slots_available?.toString() || "20",
    inclusions: pkg?.inclusions?.join(", ") || "",
    is_active: pkg?.is_active ?? true,
    is_featured: pkg?.is_featured ?? false,
  });

  async function handleAutoCalc() {
    const ngn = parseFloat(form.price_per_person_ngn);
    if (!ngn) return;
    setForm((f) => ({
      ...f,
      price_per_person_usd: (ngn / 1650).toFixed(0),
      price_per_person_aed: (ngn / 449).toFixed(0),
      price_per_person_qar: (ngn / 453).toFixed(0),
      price_per_person_gbp: (ngn / 2090).toFixed(0),
      price_per_person_cad: (ngn / 1210).toFixed(0),
      price_per_person_eur: (ngn / 1780).toFixed(0),
    }));
  }

  async function handleAutoCalcAction() {
    const next = !autoCalc;
    setAutoCalc(next);
    if (next && form.price_per_person_ngn) {
      handleAutoCalc();
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const body: any = { ...form };
    body.price_per_person_ngn = form.price_per_person_ngn ? parseFloat(form.price_per_person_ngn) : null;
    body.price_per_person_usd = form.price_per_person_usd ? parseFloat(form.price_per_person_usd) : null;
    body.price_per_person_aed = form.price_per_person_aed ? parseFloat(form.price_per_person_aed) : null;
    body.price_per_person_qar = form.price_per_person_qar ? parseFloat(form.price_per_person_qar) : null;
    body.price_per_person_gbp = form.price_per_person_gbp ? parseFloat(form.price_per_person_gbp) : null;
    body.price_per_person_cad = form.price_per_person_cad ? parseFloat(form.price_per_person_cad) : null;
    body.price_per_person_eur = form.price_per_person_eur ? parseFloat(form.price_per_person_eur) : null;
    body.original_price_ngn = form.original_price_ngn ? parseFloat(form.original_price_ngn) : null;
    body.duration_nights = parseInt(form.duration_nights) || 0;
    body.slots_available = parseInt(form.slots_available) || 20;
    body.inclusions = form.inclusions.split(",").map((s: string) => s.trim()).filter(Boolean);
    if (isEdit) body.id = pkg.id;

    const res = await fetch("/api/admin/holidays/upsert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (!res.ok) { setError(data.error || "Save failed"); setSaving(false); return; }
    router.push("/admin/holidays");
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: "720px" }}>
      <div style={{ background: "white", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", padding: "1.5rem", marginBottom: "1.5rem" }}>
        <h2 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1rem", fontWeight: 700, color: "var(--midnight)", marginBottom: "1rem" }}>
          Basic information
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.375rem" }}>Title</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required style={{ width: "100%", padding: "0.625rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", fontSize: "0.875rem" }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.375rem" }}>Destination</label>
            <input value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} required placeholder="e.g. Maldives" style={{ width: "100%", padding: "0.625rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", fontSize: "0.875rem" }} />
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.375rem" }}>Duration (nights)</label>
            <input type="number" value={form.duration_nights} onChange={(e) => setForm({ ...form, duration_nights: e.target.value })} required min={1} style={{ width: "100%", padding: "0.625rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", fontSize: "0.875rem" }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.375rem" }}>Slots available</label>
            <input type="number" value={form.slots_available} onChange={(e) => setForm({ ...form, slots_available: e.target.value })} min={0} style={{ width: "100%", padding: "0.625rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", fontSize: "0.875rem" }} />
          </div>
        </div>
        <div style={{ marginBottom: "0.75rem" }}>
          <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.375rem" }}>Description</label>
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} style={{ width: "100%", padding: "0.625rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", fontSize: "0.875rem" }} />
        </div>
        <div style={{ marginBottom: "0.75rem" }}>
          <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.375rem" }}>Inclusions (comma-separated)</label>
          <input value={form.inclusions} onChange={(e) => setForm({ ...form, inclusions: e.target.value })} placeholder="Flights, Hotel, Breakfast, Airport transfer" style={{ width: "100%", padding: "0.625rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", fontSize: "0.875rem" }} />
        </div>
      </div>

      <div style={{ background: "white", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", padding: "1.5rem", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h2 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1rem", fontWeight: 700, color: "var(--midnight)" }}>
            Multi-currency pricing (per person)
          </h2>
          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8125rem", color: "var(--text-secondary)", cursor: "pointer" }}>
            <input type="checkbox" checked={autoCalc} onChange={handleAutoCalcAction} />
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
        <div style={{ marginTop: "0.75rem" }}>
          <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.375rem" }}>Original price NGN (for discount display, optional)</label>
          <input type="number" value={form.original_price_ngn} onChange={(e) => setForm({ ...form, original_price_ngn: e.target.value })} style={{ width: "100%", padding: "0.625rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", fontSize: "0.875rem" }} />
        </div>
      </div>

      <div style={{ background: "white", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", padding: "1.5rem", marginBottom: "1.5rem" }}>
        <h2 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1rem", fontWeight: 700, color: "var(--midnight)", marginBottom: "1rem" }}>
          Status
        </h2>
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
        <a href="/admin/holidays" style={{ padding: "0.75rem 2rem", background: "var(--gray-100)", color: "var(--text-secondary)", fontWeight: 600, fontSize: "0.875rem", borderRadius: "var(--radius-md)", textDecoration: "none" }}>
          Cancel
        </a>
      </div>
    </form>
  );
}
