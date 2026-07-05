"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { OpportunityType, CareerSegment } from "@/lib/opportunity-types";

export default function CreateOpportunityForm() {
  const router = useRouter();
  const [oppTypes, setOppTypes] = useState<OpportunityType[]>([]);
  const [segments, setSegments] = useState<CareerSegment[]>([]);
  const [segmentSlug, setSegmentSlug] = useState("");
  const [title, setTitle] = useState("");
  const [organisation, setOrganisation] = useState("");
  const [locationCountry, setLocationCountry] = useState("");
  const [locationCity, setLocationCity] = useState("");
  const [type, setType] = useState("");

  useEffect(() => {
    async function load() {
      const [tRes, sRes] = await Promise.all([
        fetch("/api/opportunity-types"),
        fetch("/api/career-segments"),
      ]);
      const types: OpportunityType[] = await tRes.json();
      const segs: CareerSegment[] = await sRes.json();
      setOppTypes(types);
      setSegments(segs);
      if (types.length > 0) setType(types[0].slug);
      if (segs.length > 0) setSegmentSlug(segs[0].slug);
    }
    load();
  }, []);
  const [description, setDescription] = useState("");
  const [requirements, setRequirements] = useState("");
  const [salaryRange, setSalaryRange] = useState("");
  const [fundingAmount, setFundingAmount] = useState("");
  const [deadline, setDeadline] = useState("");
  const [applicationUrl, setApplicationUrl] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
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
      const res = await fetch("/api/admin/opportunities/create", {
        method: "POST",
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

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '600px' }}>
      {error && (
        <div style={{ padding: '0.75rem 1rem', background: '#FEF2F2', color: '#DC2626', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', marginBottom: '1rem' }}>{error}</div>
      )}

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', fontWeight: 600, color: 'var(--midnight)', fontSize: '0.875rem', marginBottom: '0.375rem' }}>Segment</label>
        <select value={segmentSlug} onChange={e => setSegmentSlug(e.target.value)} style={{ width: '100%', padding: '0.625rem 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontSize: '0.875rem' }}>
          {segments.map(s => <option key={s.slug} value={s.slug}>{s.name}</option>)}
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
          <input value={locationCountry} onChange={e => setLocationCountry(e.target.value)} placeholder="e.g. UK" style={{ width: '100%', padding: '0.625rem 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontSize: '0.875rem' }} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', fontWeight: 600, color: 'var(--midnight)', fontSize: '0.875rem', marginBottom: '0.375rem' }}>City</label>
          <input value={locationCity} onChange={e => setLocationCity(e.target.value)} style={{ width: '100%', padding: '0.625rem 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontSize: '0.875rem' }} />
        </div>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', fontWeight: 600, color: 'var(--midnight)', fontSize: '0.875rem', marginBottom: '0.375rem' }}>Type</label>
        <select value={type} onChange={e => setType(e.target.value)} style={{ width: '100%', padding: '0.625rem 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontSize: '0.875rem' }}>
          {oppTypes.map(t => <option key={t.slug} value={t.slug}>{t.name || t.slug.replace(/_/g, " ")}</option>)}
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
          <input value={salaryRange} onChange={e => setSalaryRange(e.target.value)} placeholder="e.g. $3,000–$8,000/month" style={{ width: '100%', padding: '0.625rem 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontSize: '0.875rem' }} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', fontWeight: 600, color: 'var(--midnight)', fontSize: '0.875rem', marginBottom: '0.375rem' }}>Funding Amount</label>
          <input value={fundingAmount} onChange={e => setFundingAmount(e.target.value)} placeholder="For scholarships" style={{ width: '100%', padding: '0.625rem 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontSize: '0.875rem' }} />
        </div>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', fontWeight: 600, color: 'var(--midnight)', fontSize: '0.875rem', marginBottom: '0.375rem' }}>Deadline</label>
        <input value={deadline} onChange={e => setDeadline(e.target.value)} type="date" style={{ width: '100%', padding: '0.625rem 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontSize: '0.875rem' }} />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', fontWeight: 600, color: 'var(--midnight)', fontSize: '0.875rem', marginBottom: '0.375rem' }}>Application URL *</label>
        <input value={applicationUrl} onChange={e => setApplicationUrl(e.target.value)} placeholder="https://..." style={{ width: '100%', padding: '0.625rem 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontSize: '0.875rem' }} />
      </div>

      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <input id="featured" type="checkbox" checked={isFeatured} onChange={e => setIsFeatured(e.target.checked)} style={{ width: '16px', height: '16px' }} />
        <label htmlFor="featured" style={{ fontWeight: 600, color: 'var(--midnight)', fontSize: '0.875rem' }}>Featured opportunity</label>
      </div>

      <button type="submit" disabled={saving} style={{ padding: '0.75rem 2rem', background: saving ? 'var(--text-muted)' : 'var(--midnight)', color: 'white', fontWeight: 700, fontSize: '0.875rem', borderRadius: 'var(--radius-md)', border: 'none', cursor: saving ? 'not-allowed' : 'pointer' }}>
        {saving ? "Saving..." : "Create Opportunity"}
      </button>
    </form>
  );
}
