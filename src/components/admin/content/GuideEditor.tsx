"use client";

import { useState, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface GuideData {
  id?: string;
  slug: string;
  title: string;
  subtitle: string | null;
  category: string;
  destination: string | null;
  content: string;
  meta_description: string | null;
  reading_time_minutes: number;
  featured: boolean;
  published: boolean;
  created_by?: string | null;
}

const categories = [
  "visa_residency", "company_registration", "study_abroad",
  "work_abroad", "holiday_travel", "citizenship",
  "remote_work", "trade_business", "financial_planning",
];

const categoryLabels: Record<string, string> = {
  visa_residency: "Visas & Residency",
  company_registration: "Company Setup",
  study_abroad: "Study Abroad",
  work_abroad: "Work Abroad",
  holiday_travel: "Holiday Travel",
  citizenship: "Citizenship",
  remote_work: "Remote Work",
  trade_business: "Business & Trade",
  financial_planning: "Financial Planning",
};

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export default function GuideEditor({
  guide,
}: {
  guide?: GuideData | null;
}) {
  const supabase = createClient();
  const router = useRouter();
  const isEdit = !!guide?.id;

  const [form, setForm] = useState<GuideData>({
    id: guide?.id || undefined,
    slug: guide?.slug || "",
    title: guide?.title || "",
    subtitle: guide?.subtitle || null,
    category: guide?.category || "visa_residency",
    destination: guide?.destination || null,
    content: guide?.content || "",
    meta_description: guide?.meta_description || null,
    reading_time_minutes: guide?.reading_time_minutes || 5,
    featured: guide?.featured || false,
    published: guide?.published || false,
  });

  const [slugManuallyEdited, setSlugManuallyEdited] = useState(!!guide?.slug);
  const [saving, setSaving] = useState(false);

  const handleChange = useCallback(
    (field: keyof GuideData, value: string | number | boolean) => {
      setForm(prev => {
        const next = { ...prev, [field]: value };
        if (field === "title" && !slugManuallyEdited) {
          next.slug = generateSlug(String(value));
        }
        return next;
      });
    },
    [slugManuallyEdited]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: { user } } = await supabase.auth.getUser();

    const payload = {
      slug: form.slug,
      title: form.title,
      subtitle: form.subtitle || null,
      category: form.category,
      destination: form.destination || null,
      content: form.content,
      meta_description: form.meta_description || null,
      reading_time_minutes: form.reading_time_minutes,
      featured: form.featured,
      published: form.published,
      created_by: user?.id,
    };

    if (isEdit) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from("resource_guides")
        .update(payload)
        .eq("id", guide!.id);
      setSaving(false);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from("resource_guides")
        .insert(payload)
        .select("id")
        .single();
      setSaving(false);
      if (data) {
        router.push(`/admin/content/guides/${data.id}`);
      }
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.625rem 0.875rem",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-md)",
    fontSize: "0.875rem",
    fontFamily: "inherit",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontWeight: 600,
    fontSize: "0.8125rem",
    color: "var(--midnight)",
    marginBottom: "0.375rem",
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markdownComponents: Record<string, any> = {
    h2: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) => (
      <h2 {...props} style={{
        fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif",
        fontSize: "1.375rem", fontWeight: 700, color: "var(--midnight)",
        margin: "2rem 0 0.75rem",
      }}>{children}</h2>
    ),
    h3: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) => (
      <h3 {...props} style={{
        fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif",
        fontSize: "1.125rem", fontWeight: 700, color: "var(--midnight)",
        margin: "1.5rem 0 0.5rem",
      }}>{children}</h3>
    ),
    p: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) => (
      <p {...props} style={{ marginBottom: "1rem", lineHeight: 1.7 }}>{children}</p>
    ),
    ul: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) => (
      <ul {...props} style={{ paddingLeft: "1.5rem", marginBottom: "1rem" }}>{children}</ul>
    ),
    ol: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) => (
      <ol {...props} style={{ paddingLeft: "1.5rem", marginBottom: "1rem" }}>{children}</ol>
    ),
    li: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) => (
      <li {...props} style={{ marginBottom: "0.375rem" }}>{children}</li>
    ),
    strong: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) => (
      <strong {...props} style={{ fontWeight: 700, color: "var(--midnight)" }}>{children}</strong>
    ),
    a: ({ href, children, ...props }: { href?: string; children?: React.ReactNode; [key: string]: unknown }) => (
      <a href={href} {...props} style={{ color: "var(--teal)", textDecoration: "underline" }}
        target={href?.startsWith("http") ? "_blank" : undefined}>{children}</a>
    ),
    blockquote: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) => (
      <blockquote {...props} style={{
        borderLeft: "4px solid var(--teal)", paddingLeft: "1rem",
        margin: "1rem 0", color: "var(--text-muted)", fontStyle: "italic",
      }}>{children}</blockquote>
    ),
  };

  return (
    <div style={{ maxWidth: "800px" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <a href="/admin/content/guides"
          style={{
            color: "var(--text-muted)", fontSize: "0.8125rem",
            textDecoration: "none", display: "inline-flex",
            alignItems: "center", gap: "0.25rem", marginBottom: "0.75rem",
          }}
        >
          ← Back to guides
        </a>
        <h1 style={{
          fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif",
          fontSize: "1.375rem", fontWeight: 800, color: "var(--midnight)",
          marginBottom: "0.5rem",
        }}>
          {isEdit ? "Edit Guide" : "Create New Guide"}
        </h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: "grid", gap: "1.25rem" }}>
          <div>
            <label style={labelStyle}>Title *</label>
            <input style={inputStyle} value={form.title}
              onChange={e => handleChange("title", e.target.value)} required />
          </div>

          <div>
            <label style={labelStyle}>Slug</label>
            <input style={inputStyle} value={form.slug}
              onChange={e => {
                setSlugManuallyEdited(true);
                setForm(prev => ({ ...prev, slug: e.target.value }));
              }}
              placeholder="auto-generated from title" />
          </div>

          <div>
            <label style={labelStyle}>Subtitle</label>
            <input style={inputStyle} value={form.subtitle || ""}
              onChange={e => handleChange("subtitle", e.target.value)} />
          </div>

          <div>
            <label style={labelStyle}>Category *</label>
            <select style={inputStyle} value={form.category}
              onChange={e => handleChange("category", e.target.value)}>
              {categories.map(c => (
                <option key={c} value={c}>{categoryLabels[c]}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Destination (optional)</label>
            <input style={inputStyle} value={form.destination || ""}
              onChange={e => handleChange("destination", e.target.value)}
              placeholder="e.g. UAE, Canada" />
          </div>

          <div>
            <label style={labelStyle}>Meta Description</label>
            <textarea style={{ ...inputStyle, resize: "vertical", minHeight: "60px" }}
              value={form.meta_description || ""}
              onChange={e => handleChange("meta_description", e.target.value)}
              maxLength={155} />
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
              {(form.meta_description || "").length}/155 characters
            </p>
          </div>

          <div>
            <label style={labelStyle}>Reading Time (minutes)</label>
            <input type="number" style={inputStyle}
              value={form.reading_time_minutes}
              onChange={e => handleChange("reading_time_minutes", Number(e.target.value))}
              min={1} />
          </div>

          <div style={{ display: "flex", gap: "1.5rem" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", cursor: "pointer" }}>
              <input type="checkbox" checked={form.featured}
                onChange={e => handleChange("featured", e.target.checked)} />
              Featured
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", cursor: "pointer" }}>
              <input type="checkbox" checked={form.published}
                onChange={e => handleChange("published", e.target.checked)} />
              Published
            </label>
          </div>

          <div>
            <label style={labelStyle}>Content (Markdown) *</label>
            <textarea style={{ ...inputStyle, resize: "vertical", minHeight: "300px", fontFamily: "monospace" }}
              value={form.content}
              onChange={e => handleChange("content", e.target.value)}
              required />
          </div>

          {form.content && (
            <div>
              <label style={labelStyle}>Preview</label>
              <div style={{
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-md)",
                padding: "1.5rem",
                background: "white",
                fontSize: "0.9375rem",
                lineHeight: 1.7,
                color: "var(--text-secondary)",
              }}>
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                  {form.content}
                </ReactMarkdown>
              </div>
            </div>
          )}

          <div style={{ paddingTop: "0.5rem" }}>
            <button type="submit" disabled={saving}
              style={{
                padding: "0.75rem 2rem", background: "var(--teal)",
                color: "var(--midnight)", fontWeight: 700,
                fontSize: "0.9375rem", borderRadius: "var(--radius-md)",
                border: "none", cursor: saving ? "not-allowed" : "pointer",
                opacity: saving ? 0.6 : 1,
              }}>
              {saving ? "Saving..." : isEdit ? "Save changes" : "Create guide"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
