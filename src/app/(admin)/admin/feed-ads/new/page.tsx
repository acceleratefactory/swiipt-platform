"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewFeedAdPage() {
  const router = useRouter();
  const [headline, setHeadline] = useState("");
  const [body, setBody] = useState("");
  const [ctaLabel, setCtaLabel] = useState("Learn more");
  const [ctaUrl, setCtaUrl] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [adType, setAdType] = useState("internal");
  const [status, setStatus] = useState("draft");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!headline.trim() || !ctaUrl.trim()) {
      setError("Headline and CTA URL are required");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/feed-ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          headline: headline.trim(),
          body: body.trim() || null,
          cta_label: ctaLabel,
          cta_url: ctaUrl.trim(),
          cover_image_url: coverImageUrl.trim() || null,
          ad_type: adType,
          status,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to create");
      }
      router.push("/admin/feed-ads");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "0.5rem 0.75rem", borderRadius: 8,
    border: "1px solid #e2e8f0", fontSize: "0.875rem", outline: "none",
    boxSizing: "border-box",
  };

  return (
    <div style={{ maxWidth: 600 }}>
      <h1 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1.25rem", fontWeight: 800, marginBottom: "1.5rem" }}>Create Feed Ad</h1>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div>
          <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, marginBottom: "0.25rem" }}>Headline *</label>
          <input value={headline} onChange={(e) => setHeadline(e.target.value)} style={inputStyle} placeholder="e.g. Apply for UK Healthcare Jobs" />
        </div>
        <div>
          <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, marginBottom: "0.25rem" }}>Body</label>
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} style={inputStyle} placeholder="Optional description for the ad" />
        </div>
        <div>
          <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, marginBottom: "0.25rem" }}>CTA Label</label>
          <input value={ctaLabel} onChange={(e) => setCtaLabel(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, marginBottom: "0.25rem" }}>CTA URL *</label>
          <input value={ctaUrl} onChange={(e) => setCtaUrl(e.target.value)} style={inputStyle} placeholder="https://..." />
        </div>
        <div>
          <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, marginBottom: "0.25rem" }}>Cover Image URL</label>
          <input value={coverImageUrl} onChange={(e) => setCoverImageUrl(e.target.value)} style={inputStyle} placeholder="https://..." />
        </div>
        <div style={{ display: "flex", gap: "1rem" }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, marginBottom: "0.25rem" }}>Type</label>
            <select value={adType} onChange={(e) => setAdType(e.target.value)} style={inputStyle}>
              <option value="internal">Internal</option>
              <option value="external">External</option>
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, marginBottom: "0.25rem" }}>Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} style={inputStyle}>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
            </select>
          </div>
        </div>
        {error && <p style={{ color: "#ef4444", fontSize: "0.8125rem", margin: 0 }}>{error}</p>}
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button type="submit" disabled={saving} style={{ padding: "0.5rem 1.5rem", background: "var(--midnight)", color: "white", borderRadius: "var(--radius-md)", border: "none", fontWeight: 600, fontSize: "0.875rem", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
            {saving ? "Saving..." : "Create ad"}
          </button>
          <button type="button" onClick={() => router.push("/admin/feed-ads")} style={{ padding: "0.5rem 1.5rem", background: "white", color: "var(--text-muted)", borderRadius: "var(--radius-md)", border: "1px solid #e2e8f0", fontWeight: 600, fontSize: "0.875rem", cursor: "pointer" }}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
