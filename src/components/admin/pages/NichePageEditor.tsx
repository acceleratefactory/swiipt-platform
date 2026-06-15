"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const URL_PREFIX_OPTIONS = [
  { value: "move", label: "Move / Relocate" },
  { value: "work", label: "Work Abroad" },
  { value: "study", label: "Study Abroad" },
  { value: "holiday", label: "Holiday / Travel" },
  { value: "business", label: "Business" },
  { value: "citizenship", label: "Citizenship" },
  { value: "remote", label: "Remote Work" },
  { value: "corporate", label: "Corporate" },
  { value: "student", label: "Student" },
  { value: "parents", label: "Parents / Family" },
];

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

const sectionTitleS: React.CSSProperties = {
  fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif",
  fontSize: "1rem", fontWeight: 700, color: "var(--midnight)", marginBottom: "1rem",
};

interface GoalTemplate {
  id: string;
  name: string;
}

export default function NichePageEditor({
  pkg,
  goalTemplates,
}: {
  pkg?: any;
  goalTemplates?: GoalTemplate[];
}) {
  const router = useRouter();
  const isEdit = !!pkg;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");

  const [form, setForm] = useState({
    url_prefix: pkg?.url_prefix || "move",
    slug: pkg?.slug || "",
    title: pkg?.title || "",
    subtitle: pkg?.subtitle || "",
    destination: pkg?.destination || "",
    category: pkg?.category || "",
    segment: pkg?.segment || "",

    hero_headline: pkg?.hero_headline || "",
    hero_subtext: pkg?.hero_subtext || "",
    hero_cta_label: pkg?.hero_cta_label || "Get started",
    hero_cta_url: pkg?.hero_cta_url || "/signup",

    process_steps: pkg?.process_steps || [{ step: 1, title: "", body: "" }],

    requirements: pkg?.requirements || [""],

    faqs: pkg?.faqs || [{ q: "", a: "" }],

    cost_calculator_destination: pkg?.cost_calculator_destination || "",
    cost_calculator_service_type: pkg?.cost_calculator_service_type || "",

    success_story_name: pkg?.success_story_name || "",
    success_story_role: pkg?.success_story_role || "",
    success_story_quote: pkg?.success_story_quote || "",
    success_story_destination: pkg?.success_story_destination || "",

    related_page_slugs: Array.isArray(pkg?.related_page_slugs)
      ? pkg.related_page_slugs.join(", ")
      : "",

    meta_title: pkg?.meta_title || "",
    meta_description: pkg?.meta_description || "",
    og_image_url: pkg?.og_image_url || "",

    recommended_goal_template_id: pkg?.recommended_goal_template_id || "",

    published: pkg?.published ?? false,
  });

  useEffect(() => {
    if (isEdit) {
      setPreviewUrl(`/${form.url_prefix}/${form.slug}`);
    }
  }, [isEdit, form.url_prefix, form.slug]);

  function handleChange(key: string, value: any) {
    setForm((f) => ({ ...f, [key]: value }));
    if (key === "title" && !isEdit && !form.slug) {
      const autoSlug = (value as string)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      setForm((f) => ({ ...f, slug: autoSlug }));
    }
  }

  function addProcessStep() {
    const nextStep = (form.process_steps.length || 0) + 1;
    setForm((f) => ({
      ...f,
      process_steps: [...f.process_steps, { step: nextStep, title: "", body: "" }],
    }));
  }

  function removeProcessStep(index: number) {
    setForm((f) => ({
      ...f,
      process_steps: f.process_steps.filter((_: any, i: number) => i !== index).map((s: any, i: number) => ({ ...s, step: i + 1 })),
    }));
  }

  function updateProcessStep(index: number, field: string, value: string) {
    setForm((f) => ({
      ...f,
      process_steps: f.process_steps.map((s: any, i: number) => (i === index ? { ...s, [field]: value } : s)),
    }));
  }

  function addRequirement() {
    setForm((f: any) => ({ ...f, requirements: [...f.requirements, ""] }));
  }

  function removeRequirement(index: number) {
    setForm((f: any) => ({
      ...f,
      requirements: f.requirements.filter((_: any, i: number) => i !== index),
    }));
  }

  function updateRequirement(index: number, value: string) {
    setForm((f: any) => ({
      ...f,
      requirements: f.requirements.map((r: string, i: number) => (i === index ? value : r)),
    }));
  }

  function addFaq() {
    setForm((f: any) => ({ ...f, faqs: [...f.faqs, { q: "", a: "" }] }));
  }

  function removeFaq(index: number) {
    setForm((f: any) => ({
      ...f,
      faqs: f.faqs.filter((_: any, i: number) => i !== index),
    }));
  }

  function updateFaq(index: number, field: "q" | "a", value: string) {
    setForm((f: any) => ({
      ...f,
      faqs: f.faqs.map((faq: any, i: number) => (i === index ? { ...faq, [field]: value } : faq)),
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const body: any = { ...form };
    body.related_page_slugs = form.related_page_slugs
      .split(",")
      .map((s: string) => s.trim())
      .filter(Boolean);

    body.process_steps = form.process_steps.filter((s: any) => s.title || s.body);
    body.requirements = form.requirements.filter(Boolean);
    body.faqs = form.faqs.filter((f: any) => f.q || f.a);

    if (isEdit) body.id = pkg.id;

    const res = await fetch("/api/admin/pages/upsert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (!res.ok) { setError(data.error || "Save failed"); setSaving(false); return; }
    router.push("/admin/pages");
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: "840px" }}>
      {/* 1. Basic info */}
      <div style={sectionS}>
        <h2 style={sectionTitleS}>Basic information</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
          <div>
            <label style={labelS}>URL prefix</label>
            <select value={form.url_prefix} onChange={(e) => handleChange("url_prefix", e.target.value)} required style={inputS}>
              {URL_PREFIX_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label style={labelS}>Slug</label>
            <input value={form.slug} onChange={(e) => handleChange("slug", e.target.value)} required style={inputS} placeholder="e.g. uae-dubai-residency" />
          </div>
        </div>
        <div style={{ marginBottom: "0.75rem" }}>
          <label style={labelS}>Title</label>
          <input value={form.title} onChange={(e) => handleChange("title", e.target.value)} required style={inputS} />
        </div>
        <div style={{ marginBottom: "0.75rem" }}>
          <label style={labelS}>Subtitle</label>
          <input value={form.subtitle} onChange={(e) => handleChange("subtitle", e.target.value)} required style={inputS} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div>
            <label style={labelS}>Destination</label>
            <input value={form.destination} onChange={(e) => handleChange("destination", e.target.value)} style={inputS} placeholder="e.g. UAE, Canada" />
          </div>
          <div>
            <label style={labelS}>Category</label>
            <select value={form.category} onChange={(e) => handleChange("category", e.target.value)} required style={inputS}>
              <option value="">Select category</option>
              {CATEGORY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>
        <div style={{ marginTop: "0.75rem" }}>
          <label style={labelS}>Segment (internal grouping key)</label>
          <input value={form.segment} onChange={(e) => handleChange("segment", e.target.value)} style={inputS} placeholder="e.g. uae_worker, canada_seeker" />
        </div>
      </div>

      {/* 2. Hero */}
      <div style={sectionS}>
        <h2 style={sectionTitleS}>Hero section</h2>
        <div style={{ marginBottom: "0.75rem" }}>
          <label style={labelS}>Headline</label>
          <input value={form.hero_headline} onChange={(e) => handleChange("hero_headline", e.target.value)} style={inputS} required />
        </div>
        <div style={{ marginBottom: "0.75rem" }}>
          <label style={labelS}>Subtext</label>
          <textarea value={form.hero_subtext} onChange={(e) => handleChange("hero_subtext", e.target.value)} rows={2} style={inputS} required />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div>
            <label style={labelS}>CTA label</label>
            <input value={form.hero_cta_label} onChange={(e) => handleChange("hero_cta_label", e.target.value)} style={inputS} />
          </div>
          <div>
            <label style={labelS}>CTA URL</label>
            <input value={form.hero_cta_url} onChange={(e) => handleChange("hero_cta_url", e.target.value)} style={inputS} />
          </div>
        </div>
      </div>

      {/* 3. Process steps */}
      <div style={sectionS}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h2 style={sectionTitleS}>Process steps</h2>
          <button type="button" onClick={addProcessStep} style={{ padding: "0.375rem 0.75rem", background: "var(--teal-pale)", border: "1px solid var(--teal)", borderRadius: "var(--radius-sm)", color: "var(--teal)", fontWeight: 600, fontSize: "0.8125rem", cursor: "pointer" }}>
            + Add step
          </button>
        </div>
        {form.process_steps.map((step: any, i: number) => (
          <div key={i} style={{ padding: "0.75rem", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", marginBottom: "0.75rem", position: "relative" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
              <span style={{ fontWeight: 700, fontSize: "0.8125rem", color: "var(--midnight)" }}>Step {i + 1}</span>
              {form.process_steps.length > 1 && (
                <button type="button" onClick={() => removeProcessStep(i)} style={{ background: "none", border: "none", color: "var(--danger)", cursor: "pointer", fontSize: "0.75rem" }}>
                  Remove
                </button>
              )}
            </div>
            <input value={step.title} onChange={(e) => updateProcessStep(i, "title", e.target.value)} placeholder="Step title" style={{ ...inputS, marginBottom: "0.5rem" }} />
            <textarea value={step.body} onChange={(e) => updateProcessStep(i, "body", e.target.value)} placeholder="Step description" rows={2} style={inputS} />
          </div>
        ))}
      </div>

      {/* 4. Requirements */}
      <div style={sectionS}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h2 style={sectionTitleS}>Requirements</h2>
          <button type="button" onClick={addRequirement} style={{ padding: "0.375rem 0.75rem", background: "var(--teal-pale)", border: "1px solid var(--teal)", borderRadius: "var(--radius-sm)", color: "var(--teal)", fontWeight: 600, fontSize: "0.8125rem", cursor: "pointer" }}>
            + Add requirement
          </button>
        </div>
        {form.requirements.map((req: string, i: number) => (
          <div key={i} style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem", alignItems: "center" }}>
            <input value={req} onChange={(e) => updateRequirement(i, e.target.value)} placeholder="e.g. Valid passport" style={{ ...inputS, flex: 1 }} />
            {form.requirements.length > 1 && (
              <button type="button" onClick={() => removeRequirement(i)} style={{ background: "none", border: "none", color: "var(--danger)", cursor: "pointer", fontSize: "0.75rem", whiteSpace: "nowrap" }}>
                Remove
              </button>
            )}
          </div>
        ))}
      </div>

      {/* 5. FAQs */}
      <div style={sectionS}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h2 style={sectionTitleS}>FAQs</h2>
          <button type="button" onClick={addFaq} style={{ padding: "0.375rem 0.75rem", background: "var(--teal-pale)", border: "1px solid var(--teal)", borderRadius: "var(--radius-sm)", color: "var(--teal)", fontWeight: 600, fontSize: "0.8125rem", cursor: "pointer" }}>
            + Add FAQ
          </button>
        </div>
        {form.faqs.map((faq: any, i: number) => (
          <div key={i} style={{ padding: "0.75rem", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", marginBottom: "0.75rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
              <span style={{ fontWeight: 600, fontSize: "0.8125rem", color: "var(--midnight)" }}>FAQ #{i + 1}</span>
              {form.faqs.length > 1 && (
                <button type="button" onClick={() => removeFaq(i)} style={{ background: "none", border: "none", color: "var(--danger)", cursor: "pointer", fontSize: "0.75rem" }}>
                  Remove
                </button>
              )}
            </div>
            <input value={faq.q} onChange={(e) => updateFaq(i, "q", e.target.value)} placeholder="Question" style={{ ...inputS, marginBottom: "0.5rem" }} />
            <textarea value={faq.a} onChange={(e) => updateFaq(i, "a", e.target.value)} placeholder="Answer" rows={2} style={inputS} />
          </div>
        ))}
      </div>

      {/* 6. Cost calculator link */}
      <div style={sectionS}>
        <h2 style={sectionTitleS}>Cost calculator link</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div>
            <label style={labelS}>Calculator destination</label>
            <input value={form.cost_calculator_destination} onChange={(e) => handleChange("cost_calculator_destination", e.target.value)} style={inputS} placeholder="e.g. UAE, Canada" />
          </div>
          <div>
            <label style={labelS}>Calculator service type</label>
            <input value={form.cost_calculator_service_type} onChange={(e) => handleChange("cost_calculator_service_type", e.target.value)} style={inputS} placeholder="e.g. residency_permit" />
          </div>
        </div>
      </div>

      {/* 7. Success story */}
      <div style={sectionS}>
        <h2 style={sectionTitleS}>Success story</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "0.75rem" }}>
          <div>
            <label style={labelS}>Name</label>
            <input value={form.success_story_name} onChange={(e) => handleChange("success_story_name", e.target.value)} style={inputS} />
          </div>
          <div>
            <label style={labelS}>Role / Title</label>
            <input value={form.success_story_role} onChange={(e) => handleChange("success_story_role", e.target.value)} style={inputS} />
          </div>
        </div>
        <div style={{ marginBottom: "0.75rem" }}>
          <label style={labelS}>Quote</label>
          <textarea value={form.success_story_quote} onChange={(e) => handleChange("success_story_quote", e.target.value)} rows={2} style={inputS} />
        </div>
        <div>
          <label style={labelS}>Destination</label>
          <input value={form.success_story_destination} onChange={(e) => handleChange("success_story_destination", e.target.value)} style={inputS} />
        </div>
      </div>

      {/* 8. Related pages */}
      <div style={sectionS}>
        <h2 style={sectionTitleS}>Related pages</h2>
        <label style={labelS}>Page slugs (comma-separated)</label>
        <input value={form.related_page_slugs} onChange={(e) => handleChange("related_page_slugs", e.target.value)} style={inputS} placeholder="e.g. uae-dubai-residency, canada-express-entry" />
      </div>

      {/* 9. Recommended goal template */}
      <div style={sectionS}>
        <h2 style={sectionTitleS}>Recommended goal template</h2>
        <label style={labelS}>Template</label>
        <select value={form.recommended_goal_template_id} onChange={(e) => handleChange("recommended_goal_template_id", e.target.value)} style={inputS}>
          <option value="">None</option>
          {(goalTemplates || []).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>

      {/* 10. SEO */}
      <div style={sectionS}>
        <h2 style={sectionTitleS}>SEO</h2>
        <div style={{ marginBottom: "0.75rem" }}>
          <label style={labelS}>Meta title ({form.meta_title.length}/60 chars)</label>
          <input value={form.meta_title} onChange={(e) => handleChange("meta_title", e.target.value)} maxLength={60} style={{
            ...inputS,
            borderColor: form.meta_title.length > 60 ? "var(--danger)" : form.meta_title.length >= 30 ? "var(--teal)" : "var(--border)",
          }} />
        </div>
        <div style={{ marginBottom: "0.75rem" }}>
          <label style={labelS}>Meta description ({form.meta_description.length}/155 chars)</label>
          <textarea value={form.meta_description} onChange={(e) => handleChange("meta_description", e.target.value)} rows={2} maxLength={155} style={{
            ...inputS,
            borderColor: form.meta_description.length > 155 ? "var(--danger)" : form.meta_description.length >= 120 ? "var(--teal)" : "var(--border)",
          }} />
        </div>
        <div>
          <label style={labelS}>OG image URL</label>
          <input value={form.og_image_url} onChange={(e) => handleChange("og_image_url", e.target.value)} style={inputS} placeholder="https://..." />
        </div>
      </div>

      {/* 11. Status */}
      <div style={sectionS}>
        <h2 style={sectionTitleS}>Status</h2>
        <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", color: "var(--text-secondary)", cursor: "pointer" }}>
          <input type="checkbox" checked={form.published} onChange={(e) => handleChange("published", e.target.checked)} />
          Published
        </label>
        {isEdit && previewUrl && (
          <a
            href={previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-block", marginTop: "0.75rem", fontSize: "0.8125rem",
              color: "var(--teal)", fontWeight: 600, textDecoration: "none",
            }}
          >
            Preview: /{previewUrl} ↗
          </a>
        )}
      </div>

      {error && <p style={{ color: "var(--danger)", fontSize: "0.875rem", marginBottom: "1rem" }}>{error}</p>}

      <div style={{ display: "flex", gap: "1rem", marginBottom: "3rem" }}>
        <button type="submit" disabled={saving} style={{ padding: "0.75rem 2rem", background: "var(--midnight)", color: "white", fontWeight: 700, fontSize: "0.875rem", borderRadius: "var(--radius-md)", border: "none", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.6 : 1 }}>
          {saving ? "Saving..." : isEdit ? "Update page" : "Create page"}
        </button>
        <a href="/admin/pages" style={{ padding: "0.75rem 2rem", background: "var(--gray-100)", color: "var(--text-secondary)", fontWeight: 600, fontSize: "0.875rem", borderRadius: "var(--radius-md)", textDecoration: "none" }}>
          Cancel
        </a>
      </div>
    </form>
  );
}
