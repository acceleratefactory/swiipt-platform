"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { OpportunityType, CareerSegment } from "@/lib/opportunity-types";

interface FailedItem {
  id: string;
  segment_slug: string | null;
  title: string | null;
  organisation: string | null;
  location_country: string | null;
  location_city: string | null;
  type: string | null;
  description: string | null;
  full_description: string | null;
  requirements: string | null;
  salary_range: string | null;
  funding_amount: string | null;
  deadline: string | null;
  application_url: string | null;
  is_featured: boolean | null;
  review_reason: string | null;
}

export default function FailedCleanupList({ items }: { items: FailedItem[] }) {
  const router = useRouter();
  const [oppTypes, setOppTypes] = useState<OpportunityType[]>([]);
  const [segments, setSegments] = useState<CareerSegment[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [edits, setEdits] = useState<Record<string, Record<string, string>>>({});
  const [featured, setFeatured] = useState<Record<string, boolean>>({});

  const fieldKeys = ["title", "organisation", "location_country", "location_city", "description", "full_description", "requirements", "salary_range", "funding_amount", "application_url"] as const;
  const selectKeys = ["segment_slug", "type"] as const;

  useEffect(() => {
    async function load() {
      const [tRes, sRes] = await Promise.all([
        fetch("/api/opportunity-types"),
        fetch("/api/career-segments"),
      ]);
      if (tRes.ok) setOppTypes(await tRes.json());
      if (sRes.ok) setSegments(await sRes.json());
    }
    load();
  }, []);

  const getEdit = (id: string, field: string) =>
    edits[id]?.[field] ?? "";

  const setEdit = (id: string, field: string, value: string) => {
    setEdits((prev) => ({
      ...prev,
      [id]: { ...(prev[id] || {}), [field]: value },
    }));
  };

  const handleApprove = async (item: FailedItem) => {
    const id = item.id;
    setProcessingId(id);
    const itemEdits = edits[id];
    const fields: Record<string, string | boolean | null> = {};
    if (itemEdits) {
      for (const key of fieldKeys) {
        if (itemEdits[key] !== undefined && itemEdits[key] !== (item as any)[key]) {
          fields[key] = itemEdits[key];
        }
      }
      for (const key of selectKeys) {
        if (itemEdits[key] !== undefined && itemEdits[key] !== (item as any)[key]) {
          fields[key] = itemEdits[key];
        }
      }
    }
    if (featured[id] !== undefined && featured[id] !== item.is_featured) {
      fields.is_featured = featured[id];
    }
    try {
      await fetch("/api/admin/opportunities/approve-cleanup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "approve", fields: Object.keys(fields).length ? fields : undefined }),
      });
      router.refresh();
    } catch {
      // silent
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string) => {
    setProcessingId(id);
    try {
      await fetch("/api/admin/opportunities/approve-cleanup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "reject" }),
      });
      router.refresh();
    } catch {
      // silent
    } finally {
      setProcessingId(null);
    }
  };

  if (items.length === 0) return null;

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.5rem 0.625rem",
    borderRadius: "var(--radius-sm)",
    border: "1px solid var(--border)",
    fontSize: "0.8125rem",
    fontFamily: "inherit",
    color: "var(--midnight)",
    background: "white",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontWeight: 600,
    color: "var(--midnight)",
    fontSize: "0.75rem",
    marginBottom: "0.25rem",
  };

  return (
    <div style={{ marginTop: "2rem" }}>
      <h2 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1.125rem", fontWeight: 700, color: "var(--midnight)", marginBottom: "0.25rem" }}>
        Needs Review
      </h2>
      <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
        {items.length} opportunities needing review. Click to expand, edit the fields, then approve to show in feed or keep hidden.
      </p>

      {items.map((item) => {
        const isExpanded = expandedId === item.id;
        const isProcessing = processingId === item.id;
        const activeFeatured = featured[item.id] ?? item.is_featured ?? false;

        return (
          <div
            key={item.id}
            style={{
              background: "white",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--border)",
              marginBottom: "0.75rem",
              overflow: "hidden",
            }}
          >
            <div
              onClick={() => setExpandedId(isExpanded ? null : item.id)}
              style={{
                padding: "1rem 1.25rem",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                cursor: "pointer",
                gap: "1rem",
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: "0.9375rem", color: "var(--midnight)", marginBottom: "0.25rem" }}>
                  {item.title || "Untitled"}
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  {item.organisation ? `${item.organisation} · ` : ""}{item.review_reason ? item.review_reason.substring(0, 100) : "No reason"}
                </div>
              </div>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", flexShrink: 0 }}>
                {isExpanded ? "▲" : "▼"}
              </span>
            </div>

            {isExpanded && (
              <div style={{ padding: "0 1.25rem 1rem 1.25rem", borderTop: "1px solid #f1f5f9", paddingTop: "0.75rem" }}>
                <div style={{ fontSize: "0.8125rem", color: "#92400e", background: "#fffbeb", padding: "0.5rem 0.75rem", borderRadius: "var(--radius-sm)", marginBottom: "1rem" }}>
                  {item.review_reason || "No reason provided"}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1rem", maxWidth: "600px" }}>
                  <div>
                    <label style={labelStyle}>Segment</label>
                    <select
                      value={getEdit(item.id, "segment_slug") || item.segment_slug || ""}
                      onChange={(e) => setEdit(item.id, "segment_slug", e.target.value)}
                      style={{ width: "100%", padding: "0.5rem 0.625rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", fontSize: "0.8125rem", fontFamily: "inherit", color: "var(--midnight)", background: "white" }}
                    >
                      {segments.map((s) => <option key={s.slug} value={s.slug}>{s.name}</option>)}
                    </select>
                  </div>

                  <div>
                    <label style={labelStyle}>Title *</label>
                    <input style={inputStyle} value={getEdit(item.id, "title") || item.title || ""} onChange={(e) => setEdit(item.id, "title", e.target.value)} />
                  </div>

                  <div>
                    <label style={labelStyle}>Organisation *</label>
                    <input style={inputStyle} value={getEdit(item.id, "organisation") || item.organisation || ""} onChange={(e) => setEdit(item.id, "organisation", e.target.value)} />
                  </div>

                  <div style={{ display: "flex", gap: "0.75rem" }}>
                    <div style={{ flex: 1 }}>
                      <label style={labelStyle}>Country</label>
                      <input style={inputStyle} value={getEdit(item.id, "location_country") || item.location_country || ""} placeholder="e.g. UK" onChange={(e) => setEdit(item.id, "location_country", e.target.value)} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={labelStyle}>City</label>
                      <input style={inputStyle} value={getEdit(item.id, "location_city") || item.location_city || ""} onChange={(e) => setEdit(item.id, "location_city", e.target.value)} />
                    </div>
                  </div>

                  <div>
                    <label style={labelStyle}>Type</label>
                    <select
                      value={getEdit(item.id, "type") || item.type || ""}
                      onChange={(e) => setEdit(item.id, "type", e.target.value)}
                      style={{ width: "100%", padding: "0.5rem 0.625rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", fontSize: "0.8125rem", fontFamily: "inherit", color: "var(--midnight)", background: "white" }}
                    >
                      {oppTypes.map((t) => <option key={t.slug} value={t.slug}>{t.name || t.slug.replace(/_/g, " ")}</option>)}
                    </select>
                  </div>

                  <div>
                    <label style={labelStyle}>Description *</label>
                    <textarea style={{ ...inputStyle, resize: "vertical", minHeight: "4rem" }} rows={4} value={getEdit(item.id, "description") || item.description || ""} onChange={(e) => setEdit(item.id, "description", e.target.value)} />
                  </div>

                  <div>
                    <label style={labelStyle}>Full Description</label>
                    <textarea style={{ ...inputStyle, resize: "vertical", minHeight: "4rem" }} rows={3} value={getEdit(item.id, "full_description") || item.full_description || ""} onChange={(e) => setEdit(item.id, "full_description", e.target.value)} />
                  </div>

                  <div>
                    <label style={labelStyle}>Requirements</label>
                    <textarea style={{ ...inputStyle, resize: "vertical", minHeight: "3rem" }} rows={3} value={getEdit(item.id, "requirements") || item.requirements || ""} onChange={(e) => setEdit(item.id, "requirements", e.target.value)} />
                  </div>

                  <div style={{ display: "flex", gap: "0.75rem" }}>
                    <div style={{ flex: 1 }}>
                      <label style={labelStyle}>Salary Range</label>
                      <input style={inputStyle} value={getEdit(item.id, "salary_range") || item.salary_range || ""} placeholder="e.g. $3,000–$8,000/month" onChange={(e) => setEdit(item.id, "salary_range", e.target.value)} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={labelStyle}>Funding Amount</label>
                      <input style={inputStyle} value={getEdit(item.id, "funding_amount") || item.funding_amount || ""} placeholder="For scholarships" onChange={(e) => setEdit(item.id, "funding_amount", e.target.value)} />
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "0.75rem" }}>
                    <div style={{ flex: 1 }}>
                      <label style={labelStyle}>Deadline</label>
                      <input type="date" style={inputStyle} value={getEdit(item.id, "deadline") || item.deadline?.split("T")[0] || ""} onChange={(e) => setEdit(item.id, "deadline", e.target.value)} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={labelStyle}>Application URL *</label>
                      <input style={inputStyle} value={getEdit(item.id, "application_url") || item.application_url || ""} placeholder="https://..." onChange={(e) => setEdit(item.id, "application_url", e.target.value)} />
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <input id={`featured-${item.id}`} type="checkbox" checked={activeFeatured} onChange={(e) => setFeatured((prev) => ({ ...prev, [item.id]: e.target.checked }))} style={{ width: "16px", height: "16px" }} />
                    <label htmlFor={`featured-${item.id}`} style={{ fontWeight: 600, color: "var(--midnight)", fontSize: "0.8125rem" }}>Featured opportunity</label>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    onClick={() => handleApprove(item)}
                    disabled={isProcessing}
                    style={{ padding: "0.5rem 1.25rem", background: isProcessing ? "#e2e8f0" : "var(--teal)", color: isProcessing ? "#94a3b8" : "white", fontWeight: 700, fontSize: "0.8125rem", borderRadius: "var(--radius-md)", border: "none", cursor: isProcessing ? "not-allowed" : "pointer" }}
                  >
                    {isProcessing ? "Saving..." : "Approve & Show in Feed"}
                  </button>
                  <button
                    onClick={() => handleReject(item.id)}
                    disabled={isProcessing}
                    style={{ padding: "0.5rem 1.25rem", background: "transparent", color: "#ef4444", fontWeight: 600, fontSize: "0.8125rem", borderRadius: "var(--radius-md)", border: "1px solid #fecaca", cursor: isProcessing ? "not-allowed" : "pointer" }}
                  >
                    Keep Hidden
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
