"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const SEGMENTS = [
  "job_seeker", "student", "footballer", "healthcare",
  "tech_professional", "freelancer", "entrepreneur", "trade_worker",
];

const TYPES = ["job", "scholarship", "visa_programme", "sports_trial", "remote_work", "training"];

export default function EditOpportunityForm({ opportunity }: { opportunity: any }) {
  const router = useRouter();
  const [segmentSlug, setSegmentSlug] = useState(opportunity.segment_slug);
  const [title, setTitle] = useState(opportunity.title);
  const [organisation, setOrganisation] = useState(opportunity.organisation);
  const [locationCountry, setLocationCountry] = useState(opportunity.location_country);
  const [locationCity, setLocationCity] = useState(opportunity.location_city || "");
  const [type, setType] = useState(opportunity.type);
  const [description, setDescription] = useState(opportunity.description);
  const [requirements, setRequirements] = useState(opportunity.requirements || "");
  const [salaryRange, setSalaryRange] = useState(opportunity.salary_range || "");
  const [fundingAmount, setFundingAmount] = useState(opportunity.funding_amount || "");
  const [deadline, setDeadline] = useState(opportunity.deadline ? opportunity.deadline.split("T")[0] : "");
  const [applicationUrl, setApplicationUrl] = useState(opportunity.application_url);
  const [isFeatured, setIsFeatured] = useState(opportunity.is_featured);
  const [isActive, setIsActive] = useState(opportunity.is_active);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!title || !organisation || !description || !applicationUrl) {
      setError("Title, organisation, description, and application URL are required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/opportunities/${opportunity.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          segment_slug: segmentSlug,
          title, organisation,
          location_country: locationCountry,
          location_city: locationCity || null,
          type,
          description, requirements: requirements || null,
          salary_range: salaryRange || null,
          funding_amount: fundingAmount || null,
          deadline: deadline || null,
          application_url: applicationUrl,
          is_featured: isFeatured,
          is_active: isActive,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      router.push("/admin/opportunities");
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/opportunities/${opportunity.id}`, { method: "DELETE" });
      if (!res.ok) { const d = await res.json(); setError(d.error); return; }
      router.push("/admin/opportunities");
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '1.5rem', alignItems: 'start' }}>
      <form onSubmit={handleSubmit}>
        {error && (
          <div style={{ padding: '0.75rem 1rem', background: '#FEF2F2', color: '#DC2626', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', marginBottom: '1rem' }}>{error}</div>
        )}

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontWeight: 600, color: 'var(--midnight)', fontSize: '0.875rem', marginBottom: '0.375rem' }}>Segment</label>
          <select value={segmentSlug} onChange={e => setSegmentSlug(e.target.value)} style={{ width: '100%', padding: '0.625rem 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontSize: '0.875rem' }}>
            {SEGMENTS.map(s => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
          </select>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontWeight: 600, color: 'var(--midnight)', fontSize: '0.875rem', marginBottom: '0.375rem' }}>Title *</label>
          <input value={title} onChange={e => setTitle(e.target.value)} style={{ width: '100%', padding: '0.625rem 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontSize: '0.875rem' }} />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontWeight: 600, color: 'var(--midnight)', fontSize: '0.875rem', marginBottom: '0.375rem' }}>Organisation *</label>
          <input value={organisation} onChange={e => setOrganisation(e.target.value)} style={{ width: '100%', padding: '0.625rem 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontSize: '0.875rem' }} />
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontWeight: 600, color: 'var(--midnight)', fontSize: '0.875rem', marginBottom: '0.375rem' }}>Country</label>
            <input value={locationCountry} onChange={e => setLocationCountry(e.target.value)} style={{ width: '100%', padding: '0.625rem 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontSize: '0.875rem' }} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontWeight: 600, color: 'var(--midnight)', fontSize: '0.875rem', marginBottom: '0.375rem' }}>City</label>
            <input value={locationCity} onChange={e => setLocationCity(e.target.value)} style={{ width: '100%', padding: '0.625rem 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontSize: '0.875rem' }} />
          </div>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontWeight: 600, color: 'var(--midnight)', fontSize: '0.875rem', marginBottom: '0.375rem' }}>Type</label>
          <select value={type} onChange={e => setType(e.target.value)} style={{ width: '100%', padding: '0.625rem 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontSize: '0.875rem' }}>
            {TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
          </select>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontWeight: 600, color: 'var(--midnight)', fontSize: '0.875rem', marginBottom: '0.375rem' }}>Description *</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} style={{ width: '100%', padding: '0.625rem 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontSize: '0.875rem', resize: 'vertical', fontFamily: 'inherit' }} />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontWeight: 600, color: 'var(--midnight)', fontSize: '0.875rem', marginBottom: '0.375rem' }}>Requirements</label>
          <textarea value={requirements} onChange={e => setRequirements(e.target.value)} rows={3} style={{ width: '100%', padding: '0.625rem 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontSize: '0.875rem', resize: 'vertical', fontFamily: 'inherit' }} />
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontWeight: 600, color: 'var(--midnight)', fontSize: '0.875rem', marginBottom: '0.375rem' }}>Salary Range</label>
            <input value={salaryRange} onChange={e => setSalaryRange(e.target.value)} style={{ width: '100%', padding: '0.625rem 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontSize: '0.875rem' }} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontWeight: 600, color: 'var(--midnight)', fontSize: '0.875rem', marginBottom: '0.375rem' }}>Funding Amount</label>
            <input value={fundingAmount} onChange={e => setFundingAmount(e.target.value)} style={{ width: '100%', padding: '0.625rem 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontSize: '0.875rem' }} />
          </div>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontWeight: 600, color: 'var(--midnight)', fontSize: '0.875rem', marginBottom: '0.375rem' }}>Deadline</label>
          <input value={deadline} onChange={e => setDeadline(e.target.value)} type="date" style={{ width: '100%', padding: '0.625rem 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontSize: '0.875rem' }} />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontWeight: 600, color: 'var(--midnight)', fontSize: '0.875rem', marginBottom: '0.375rem' }}>Application URL *</label>
          <input value={applicationUrl} onChange={e => setApplicationUrl(e.target.value)} style={{ width: '100%', padding: '0.625rem 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontSize: '0.875rem' }} />
        </div>

        <div style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input id="featured" type="checkbox" checked={isFeatured} onChange={e => setIsFeatured(e.target.checked)} style={{ width: '16px', height: '16px' }} />
          <label htmlFor="featured" style={{ fontWeight: 600, color: 'var(--midnight)', fontSize: '0.875rem' }}>Featured opportunity</label>
        </div>
        <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input id="isActive" type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} style={{ width: '16px', height: '16px' }} />
          <label htmlFor="isActive" style={{ fontWeight: 600, color: 'var(--midnight)', fontSize: '0.875rem' }}>Active</label>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button type="submit" disabled={saving} style={{ padding: '0.75rem 2rem', background: saving ? 'var(--text-muted)' : 'var(--midnight)', color: 'white', fontWeight: 700, fontSize: '0.875rem', borderRadius: 'var(--radius-md)', border: 'none', cursor: saving ? 'not-allowed' : 'pointer' }}>
            {saving ? "Saving..." : "Save Changes"}
          </button>
          <button type="button" onClick={handleDelete} disabled={saving} style={{ padding: '0.75rem 1.25rem', background: 'transparent', color: '#DC2626', fontWeight: 600, fontSize: '0.875rem', borderRadius: 'var(--radius-md)', border: '1px solid #FECACA', cursor: saving ? 'not-allowed' : 'pointer' }}>
            Delete Opportunity
          </button>
        </div>
      </form>

      <div style={{ background: 'var(--off-white)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', border: '1px solid var(--border)' }}>
        <h3 style={{ fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', fontSize: '0.9375rem', fontWeight: 700, color: 'var(--midnight)', marginBottom: '1rem' }}>Stats</h3>
        <div style={{ marginBottom: '1rem' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>View Count</p>
          <p style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--midnight)' }}>{opportunity.view_count || 0}</p>
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Apply Clicks</p>
          <p style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--teal)' }}>{opportunity.apply_click_count || 0}</p>
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>AI Generated</p>
          <p style={{ fontSize: '0.875rem', fontWeight: 600, color: opportunity.ai_generated ? '#D97706' : 'var(--text-muted)' }}>{opportunity.ai_generated ? "Yes" : "No"}</p>
        </div>
        <div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Source</p>
          <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--midnight)' }}>{opportunity.source_name || "—"}</p>
        </div>
      </div>
    </div>
  );
}
