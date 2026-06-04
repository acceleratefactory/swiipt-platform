"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useRouter } from "next/navigation";
import SpinWheelConfig from "./SpinWheelConfig";

const promotionTypes = [
  { value: "flash_voucher", label: "Flash Voucher" },
  { value: "referral_sprint", label: "Referral Sprint" },
  { value: "milestone_boost", label: "Milestone Boost" },
  { value: "destination_spotlight", label: "Destination Spotlight" },
  { value: "spin_win", label: "Spin & Win" },
  { value: "custom", label: "Custom" },
];

const triggerTypes = [
  { value: "deposit_amount", label: "Deposit amount" },
  { value: "referral_count", label: "Referral count" },
  { value: "milestone_unlock", label: "Milestone unlock" },
  { value: "score_threshold", label: "Mobility Score threshold" },
];

export default function CreatePromotionForm() {
  const router = useRouter();
  const [type, setType] = useState<string>("flash_voucher");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    prize_label: "",
    prize_value_ngn: "",
    trigger_type: "deposit_amount",
    trigger_value: "",
    trigger_category: "",
    quantity_cap: "",
    starts_at: "",
    ends_at: "",
  });
  const [wheelSlots, setWheelSlots] = useState([
    { label: "₦5,000 credit", value_ngn: 5000, probability: 30 },
    { label: "₦10,000 credit", value_ngn: 10000, probability: 20 },
    { label: "₦2,000 credit", value_ngn: 2000, probability: 40 },
    { label: "Free visa photos", value_ngn: 5000, probability: 10 },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const totalProbability = wheelSlots.reduce((sum, s) => sum + s.probability, 0);
  const probabilityValid = type === "spin_win" ? totalProbability === 100 : true;

  function updateField(field: string, value: string) {
    setFormData(prev => ({ ...prev, [field]: value }));
  }

  async function handleSubmit() {
    setError("");
    if (!formData.title.trim()) { setError("Title is required"); return; }
    if (!formData.prize_label.trim()) { setError("Prize label is required"); return; }
    if (!probabilityValid) { setError("Spin wheel probabilities must sum to 100%"); return; }

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/promotions/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          promotion_type: type,
          prize_value_ngn: formData.prize_value_ngn ? Number(formData.prize_value_ngn) : null,
          quantity_cap: formData.quantity_cap ? Number(formData.quantity_cap) : null,
          wheelSlots: type === "spin_win" ? wheelSlots : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create promotion");
      router.push("/admin/promotions");
    } catch (err: any) {
      setError(err.message || "Failed to create promotion");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ maxWidth: '720px' }}>
      <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', padding: '1.5rem' }}>
        {/* Type selector */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--midnight)', display: 'block', marginBottom: '0.75rem' }}>Promotion type</label>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {promotionTypes.map(pt => (
              <button
                key={pt.value}
                onClick={() => setType(pt.value)}
                style={{ padding: '0.5rem 1rem', borderRadius: '20px', border: type === pt.value ? '2px solid var(--teal)' : '1px solid var(--border)', background: type === pt.value ? 'var(--teal-pale)' : 'white', color: type === pt.value ? 'var(--teal)' : 'var(--text-secondary)', fontSize: '0.8125rem', cursor: 'pointer', fontWeight: type === pt.value ? 600 : 400 }}
              >
                {pt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Basic details */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--midnight)', display: 'block', marginBottom: '0.5rem' }}>Title</label>
          <input value={formData.title} onChange={e => updateField("title", e.target.value)} placeholder="e.g. Ramadan Flash Voucher" style={{ width: '100%', padding: '0.625rem 0.875rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem' }} />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--midnight)', display: 'block', marginBottom: '0.5rem' }}>Description</label>
          <textarea value={formData.description} onChange={e => updateField("description", e.target.value)} rows={3} placeholder="Describe the promotion..." style={{ width: '100%', padding: '0.625rem 0.875rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', resize: 'vertical', fontFamily: 'inherit' }} />
        </div>

        {/* Prize */}
        <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'var(--off-white)', borderRadius: 'var(--radius-md)' }}>
          <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--midnight)', display: 'block', marginBottom: '0.75rem' }}>Prize</label>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>Prizes always convert to locked credit — cannot be changed.</p>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            <input value={formData.prize_label} onChange={e => updateField("prize_label", e.target.value)} placeholder="Prize label (e.g. ₦5,000 credit)" style={{ width: '100%', padding: '0.625rem 0.875rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem' }} />
            <input value={formData.prize_value_ngn} onChange={e => updateField("prize_value_ngn", e.target.value)} type="number" placeholder="Value in NGN" style={{ width: '100%', padding: '0.625rem 0.875rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem' }} />
          </div>
        </div>

        {/* Trigger */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--midnight)', display: 'block', marginBottom: '0.5rem' }}>Trigger</label>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            <select value={formData.trigger_type} onChange={e => updateField("trigger_type", e.target.value)} style={{ width: '100%', padding: '0.625rem 0.875rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', background: 'white' }}>
              {triggerTypes.map(tt => <option key={tt.value} value={tt.value}>{tt.label}</option>)}
            </select>
            <input value={formData.trigger_value} onChange={e => updateField("trigger_value", e.target.value)} placeholder="Trigger value (e.g. 50000 for NGN amount)" style={{ width: '100%', padding: '0.625rem 0.875rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem' }} />
            <input value={formData.trigger_category} onChange={e => updateField("trigger_category", e.target.value)} placeholder="Goal category (optional)" style={{ width: '100%', padding: '0.625rem 0.875rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem' }} />
          </div>
        </div>

        {/* Spin wheel config */}
        {type === "spin_win" && (
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', fontSize: '0.9375rem', fontWeight: 700, color: 'var(--midnight)', marginBottom: '0.75rem' }}>Spin wheel slots</h3>
            {!probabilityValid && (
              <p style={{ fontSize: '0.8125rem', color: '#EF4444', marginBottom: '0.5rem' }}>
                ⚠️ Probabilities must sum to exactly 100% (currently {totalProbability}%)
              </p>
            )}
            <SpinWheelConfig slots={wheelSlots} onChange={setWheelSlots} />
          </div>
        )}

        {/* Availability */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--midnight)', display: 'block', marginBottom: '0.75rem' }}>Availability</label>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            <input value={formData.quantity_cap} onChange={e => updateField("quantity_cap", e.target.value)} type="number" placeholder="Quantity cap (leave empty for unlimited)" style={{ width: '100%', padding: '0.625rem 0.875rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem' }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Start date/time</label>
                <input value={formData.starts_at} onChange={e => updateField("starts_at", e.target.value)} type="datetime-local" style={{ width: '100%', padding: '0.625rem 0.875rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>End date/time</label>
                <input value={formData.ends_at} onChange={e => updateField("ends_at", e.target.value)} type="datetime-local" style={{ width: '100%', padding: '0.625rem 0.875rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem' }} />
              </div>
            </div>
          </div>
        </div>

        {error && (
          <p style={{ fontSize: '0.8125rem', color: '#EF4444', marginBottom: '1rem' }}>{error}</p>
        )}

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={handleSubmit}
            disabled={submitting || !probabilityValid}
            style={{ padding: '0.75rem 1.5rem', background: 'var(--midnight)', color: 'white', fontWeight: 700, fontSize: '0.875rem', borderRadius: 'var(--radius-md)', border: 'none', cursor: (submitting || !probabilityValid) ? 'not-allowed' : 'pointer', opacity: (submitting || !probabilityValid) ? 0.6 : 1 }}
          >
            {submitting ? "Creating..." : "Create promotion"}
          </button>
          <a href="/admin/promotions" style={{ padding: '0.75rem 1.5rem', background: 'transparent', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.875rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
            Cancel
          </a>
        </div>
      </div>
    </div>
  );
}
/* eslint-enable @typescript-eslint/no-explicit-any */
