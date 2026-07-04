"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/* eslint-disable @typescript-eslint/no-explicit-any */

const CONTENT_TYPES = ["article", "video", "template"];

export default function ModuleForm({
  mode,
  initialData,
}: {
  mode: "create" | "edit";
  initialData: any;
}) {
  const router = useRouter();
  const isCreate = mode === "create";

  const [title, setTitle] = useState(initialData?.title || "");
  const [subtitle, setSubtitle] = useState(initialData?.subtitle || "");
  const [contentType, setContentType] = useState(initialData?.content_type || "article");
  const [contentBody, setContentBody] = useState(initialData?.content_body || "");
  const [durationMinutes, setDurationMinutes] = useState(initialData?.duration_minutes || 10);
  const [orderInCourse, setOrderInCourse] = useState(initialData?.order_in_course || 0);
  const [isFree, setIsFree] = useState(initialData?.is_free !== undefined ? initialData.is_free : true);
  const [pointsOnCompletion, setPointsOnCompletion] = useState(initialData?.points_on_completion || 20);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !contentBody.trim()) {
      setError("Title and content body are required");
      return;
    }
    setSubmitting(true);
    setError("");

    const url = isCreate
      ? "/api/admin/affiliates/modules"
      : `/api/admin/affiliates/modules/${initialData.id}`;

    const method = isCreate ? "POST" : "PUT";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          subtitle: subtitle.trim(),
          content_type: contentType,
          content_body: contentBody,
          duration_minutes: Number(durationMinutes),
          order_in_course: Number(orderInCourse),
          is_free: isFree,
          points_on_completion: Number(pointsOnCompletion),
        }),
      });

      if (res.ok) {
        router.push("/admin/affiliates/modules");
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to save module");
      }
    } catch (err: any) {
      setError(err.message || "Network error");
    }
    setSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} style={{ background: "white", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", padding: "1.5rem", maxWidth: 640 }}>
      <div style={{ display: "grid", gap: "1rem" }}>
        {/* Title */}
        <div>
          <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.25rem" }}>
            Title <span style={{ color: "var(--danger)" }}>*</span>
          </label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", fontSize: "0.8125rem" }} />
        </div>

        {/* Subtitle */}
        <div>
          <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.25rem" }}>Subtitle</label>
          <input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", fontSize: "0.8125rem" }} />
        </div>

        {/* Content type */}
        <div>
          <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.25rem" }}>
            Content type <span style={{ color: "var(--danger)" }}>*</span>
          </label>
          <select value={contentType} onChange={(e) => setContentType(e.target.value)} style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", fontSize: "0.8125rem" }}>
            {CONTENT_TYPES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
          </select>
        </div>

        {/* Content body */}
        <div>
          <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.25rem" }}>
            Content body <span style={{ color: "var(--danger)" }}>*</span>
          </label>
          <textarea value={contentBody} onChange={(e) => setContentBody(e.target.value)} rows={12} style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", fontSize: "0.8125rem", resize: "vertical", fontFamily: "monospace" }} />
          <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>Supports Markdown formatting</p>
        </div>

        {/* Row: Duration + Order + Points */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.25rem" }}>Duration (min)</label>
            <input type="number" value={durationMinutes} onChange={(e) => setDurationMinutes(Number(e.target.value))} min={1} style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", fontSize: "0.8125rem" }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.25rem" }}>Order</label>
            <input type="number" value={orderInCourse} onChange={(e) => setOrderInCourse(Number(e.target.value))} min={0} style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", fontSize: "0.8125rem" }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.25rem" }}>Points</label>
            <input type="number" value={pointsOnCompletion} onChange={(e) => setPointsOnCompletion(Number(e.target.value))} min={0} style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", fontSize: "0.8125rem" }} />
          </div>
        </div>

        {/* Free checkbox */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <input type="checkbox" checked={isFree} onChange={(e) => setIsFree(e.target.checked)} id="is_free" style={{ cursor: "pointer" }} />
          <label htmlFor="is_free" style={{ fontSize: "0.8125rem", cursor: "pointer" }}>Free (uncheck for premium)</label>
        </div>
      </div>

      {error && (
        <div style={{ marginTop: "1rem", padding: "0.75rem", borderRadius: "var(--radius-md)", background: "#FEF2F2", color: "var(--danger)", fontSize: "0.8125rem", fontWeight: 600 }}>{error}</div>
      )}

      <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem" }}>
        <button type="button" onClick={() => router.push("/admin/affiliates/modules")} style={{ padding: "0.5rem 1rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", background: "white", fontSize: "0.8125rem", cursor: "pointer" }}>
          Cancel
        </button>
        <button type="submit" disabled={submitting} style={{ padding: "0.5rem 1.5rem", borderRadius: "var(--radius-md)", border: "none", background: "var(--midnight)", color: "white", fontWeight: 700, fontSize: "0.8125rem", cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.6 : 1 }}>
          {submitting ? "Saving..." : isCreate ? "Create module" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
/* eslint-enable @typescript-eslint/no-explicit-any */
