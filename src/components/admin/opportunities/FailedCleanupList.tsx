"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface FailedItem {
  id: string;
  title: string | null;
  description: string | null;
  full_description: string | null;
  requirements: string | null;
  salary_range: string | null;
  deadline: string | null;
  review_reason: string | null;
}

export default function FailedCleanupList({ items }: { items: FailedItem[] }) {
  const router = useRouter();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [edits, setEdits] = useState<Record<string, Record<string, string>>>({});

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
    const fields: Record<string, string> = {};
    let hasEdits = false;
    if (itemEdits) {
      for (const key of ["title", "description", "full_description", "requirements", "salary_range", "deadline"]) {
        if (itemEdits[key] !== undefined && itemEdits[key] !== (item as any)[key]) {
          fields[key] = itemEdits[key];
          hasEdits = true;
        }
      }
    }
    try {
      await fetch("/api/admin/opportunities/approve-cleanup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "approve", fields: hasEdits ? fields : undefined }),
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

  return (
    <div style={{ marginTop: "2rem" }}>
      <h2 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1.125rem", fontWeight: 700, color: "var(--midnight)", marginBottom: "0.25rem" }}>
        Content Cleanup Issues
      </h2>
      <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
        {items.length} opportunities where automatic content cleaning failed. Click to expand, edit the fields, then approve to show in feed or keep hidden.
      </p>

      {items.map((item) => {
        const isExpanded = expandedId === item.id;
        const isProcessing = processingId === item.id;

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
                  {item.review_reason ? item.review_reason.substring(0, 100) : "No reason"}
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

                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1rem" }}>
                  <div>
                    <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: "0.25rem" }}>Title</label>
                    <input style={inputStyle} value={getEdit(item.id, "title") || item.title || ""} onChange={(e) => setEdit(item.id, "title", e.target.value)} />
                  </div>
                  <div>
                    <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: "0.25rem" }}>Description</label>
                    <textarea style={{ ...inputStyle, resize: "vertical", minHeight: "3rem" }} rows={2} value={getEdit(item.id, "description") || item.description || ""} onChange={(e) => setEdit(item.id, "description", e.target.value)} />
                  </div>
                  <div>
                    <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: "0.25rem" }}>Full Description</label>
                    <textarea style={{ ...inputStyle, resize: "vertical", minHeight: "4rem" }} rows={3} value={getEdit(item.id, "full_description") || item.full_description || ""} onChange={(e) => setEdit(item.id, "full_description", e.target.value)} />
                  </div>
                  <div>
                    <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: "0.25rem" }}>Requirements</label>
                    <textarea style={{ ...inputStyle, resize: "vertical", minHeight: "3rem" }} rows={2} value={getEdit(item.id, "requirements") || item.requirements || ""} onChange={(e) => setEdit(item.id, "requirements", e.target.value)} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                    <div>
                      <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: "0.25rem" }}>Salary / Funding</label>
                      <input style={inputStyle} value={getEdit(item.id, "salary_range") || item.salary_range || ""} onChange={(e) => setEdit(item.id, "salary_range", e.target.value)} />
                    </div>
                    <div>
                      <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: "0.25rem" }}>Deadline</label>
                      <input style={inputStyle} value={getEdit(item.id, "deadline") || item.deadline || ""} onChange={(e) => setEdit(item.id, "deadline", e.target.value)} placeholder="YYYY-MM-DD" />
                    </div>
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
