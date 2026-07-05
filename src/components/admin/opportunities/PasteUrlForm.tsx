"use client";

import { useState } from "react";

interface PrefilledData {
  title?: string;
  organisation?: string;
  location_country?: string;
  location_city?: string | null;
  type?: string;
  segment_slug?: string;
  description?: string;
  requirements?: string | null;
  salary_range?: string | null;
  funding_amount?: string | null;
  deadline?: string | null;
  cover_image_url?: string | null;
  media_type?: string;
}

export default function PasteUrlForm({ onPublished }: { onPublished?: () => void }) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [prefilled, setPrefilled] = useState<PrefilledData | null>(null);
  const [error, setError] = useState("");
  const [publishing, setPublishing] = useState(false);

  const handleFetch = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setError("");
    setPrefilled(null);

    try {
      const res = await fetch("/api/opportunities/paste-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      if (!res.ok) {
        const err = await res.json();
        setError(err.error || "Failed to parse URL");
        return;
      }

      const data = await res.json();
      setPrefilled(data);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!prefilled) return;
    setPublishing(true);

    try {
      const res = await fetch("/api/admin/opportunities/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          segment_slug: prefilled.segment_slug || "job_seeker",
          title: prefilled.title,
          organisation: prefilled.organisation,
          location_country: prefilled.location_country,
          location_city: prefilled.location_city || null,
          type: prefilled.type,
          description: prefilled.description,
          requirements: prefilled.requirements || null,
          salary_range: prefilled.salary_range || null,
          funding_amount: prefilled.funding_amount || null,
          deadline: prefilled.deadline || null,
          application_url: url,
          cover_image_url: prefilled.cover_image_url || null,
          media_type: prefilled.media_type || "none",
          is_featured: false,
          ai_generated: true,
        }),
      });

      if (res.ok) {
        onPublished?.();
        setUrl("");
        setPrefilled(null);
        alert("Opportunity published successfully!");
      } else {
        const err = await res.json();
        alert(`Error: ${err.error || "Publish failed"}`);
      }
    } catch {
      alert("Network error");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Paste opportunity URL..."
          style={{ flex: 1, padding: "0.625rem 0.75rem", borderRadius: "var(--radius-md)", border: "1px solid #d1d5db", fontSize: "0.875rem" }}
        />
        <button
          onClick={handleFetch}
          disabled={loading || !url.trim()}
          style={{ padding: "0.625rem 1.25rem", borderRadius: "var(--radius-md)", border: "none", background: loading ? "#e2e8f0" : "var(--teal)", color: "white", fontWeight: 600, fontSize: "0.8125rem", cursor: loading ? "default" : "pointer" }}
        >
          {loading ? "Parsing..." : "Parse URL"}
        </button>
      </div>

      {error && (
        <div style={{ padding: "0.75rem", background: "#fef2f2", borderRadius: "var(--radius-md)", color: "#dc2626", fontSize: "0.8125rem" }}>
          {error}
        </div>
      )}

      {prefilled && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <InputField label="Title" value={prefilled.title} onChange={(v) => setPrefilled(p => ({ ...p!, title: v }))} />
            <InputField label="Organisation" value={prefilled.organisation} onChange={(v) => setPrefilled(p => ({ ...p!, organisation: v }))} />
            <InputField label="Country" value={prefilled.location_country} onChange={(v) => setPrefilled(p => ({ ...p!, location_country: v }))} />
            <InputField label="Type" value={prefilled.type} onChange={(v) => setPrefilled(p => ({ ...p!, type: v }))} />
            <InputField label="Segment" value={prefilled.segment_slug} onChange={(v) => setPrefilled(p => ({ ...p!, segment_slug: v }))} />
            <InputField label="Deadline" value={prefilled.deadline || ""} onChange={(v) => setPrefilled(p => ({ ...p!, deadline: v || null }))} />
            <InputField label="Salary/Range" value={prefilled.salary_range || ""} onChange={(v) => setPrefilled(p => ({ ...p!, salary_range: v || null }))} />
            <InputField label="Requirements" value={prefilled.requirements || ""} onChange={(v) => setPrefilled(p => ({ ...p!, requirements: v || null }))} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#374151" }}>Description</label>
            <textarea
              value={prefilled.description || ""}
              onChange={(e) => setPrefilled(p => ({ ...p!, description: e.target.value }))}
              rows={4}
              style={{ padding: "0.5rem 0.75rem", borderRadius: "var(--radius-md)", border: "1px solid #d1d5db", fontSize: "0.8125rem", lineHeight: 1.4, resize: "vertical" }}
            />
          </div>

          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button
              onClick={handlePublish}
              disabled={publishing}
              style={{ padding: "0.625rem 1.5rem", borderRadius: "var(--radius-md)", border: "none", background: publishing ? "#e2e8f0" : "var(--teal)", color: "white", fontWeight: 600, fontSize: "0.8125rem", cursor: publishing ? "default" : "pointer" }}
            >
              {publishing ? "Publishing..." : "Publish opportunity"}
            </button>
            <button
              onClick={() => { setPrefilled(null); setUrl(""); }}
              style={{ padding: "0.625rem 1.5rem", borderRadius: "var(--radius-md)", border: "1px solid #d1d5db", background: "white", color: "#374151", fontWeight: 600, fontSize: "0.8125rem", cursor: "pointer" }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function InputField({ label, value, onChange }: { label: string; value?: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
      <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#374151" }}>{label}</label>
      <input
        type="text"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        style={{ padding: "0.5rem 0.75rem", borderRadius: "var(--radius-md)", border: "1px solid #d1d5db", fontSize: "0.8125rem" }}
      />
    </div>
  );
}
