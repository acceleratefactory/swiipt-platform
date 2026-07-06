"use client";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";

interface QueueItem {
  id: string;
  raw_title: string | null;
  raw_organisation: string | null;
  raw_location: string | null;
  raw_description: string | null;
  raw_salary: string | null;
  raw_deadline: string | null;
  raw_url: string;
  source_name: string;
  status: string;
  confidence_score: number | null;
  ai_enriched_data: any;
  review_notes: string | null;
  ingested_at: string;
}

export default function OpportunityQueueList({ items }: { items: QueueItem[] }) {
  const router = useRouter();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [error, setError] = useState("");

  const handlePublish = useCallback(async (id: string) => {
    setProcessingId(id);
    setError("");
    try {
      const res = await fetch("/api/admin/opportunities/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ queueId: id, action: "publish" }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || "Failed to publish");
        return;
      }
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setProcessingId(null);
    }
  }, [router]);

  const handleReject = useCallback(async (id: string) => {
    if (!rejectReason.trim()) return;
    setProcessingId(id);
    setError("");
    try {
      const res = await fetch("/api/admin/opportunities/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ queueId: id, action: "reject", reason: rejectReason }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || "Failed to reject");
        return;
      }
      setRejectId(null);
      setRejectReason("");
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setProcessingId(null);
    }
  }, [router, rejectReason]);

  const confidenceColor = (score: number | null) => {
    if (!score) return "#6b7280";
    if (score >= 0.85) return "#0d9488";
    if (score >= 0.6) return "#d97706";
    return "#ef4444";
  };

  if (items.length === 0) {
    return (
      <div style={{ background: "white", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", padding: "3rem", textAlign: "center" }}>
        <p style={{ fontSize: "1rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>Queue is clear</p>
        <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>All items have been reviewed. Run the pipeline to ingest more.</p>
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div style={{ padding: "0.75rem 1rem", background: "#FEF2F2", color: "#DC2626", borderRadius: "var(--radius-md)", fontSize: "0.875rem", marginBottom: "1rem" }}>{error}</div>
      )}

      {items.map((item) => (
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
            onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
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
              <div style={{ fontWeight: 700, fontSize: "0.9375rem", color: "var(--midnight)", marginBottom: "0.25rem" }}>
                {item.raw_title || "Untitled"}
              </div>
              <div style={{ display: "flex", gap: "1rem", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                <span>{item.raw_organisation || "Unknown"}</span>
                <span>{item.source_name}</span>
                <span>{item.raw_location || "No location"}</span>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexShrink: 0 }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 600, color: confidenceColor(item.confidence_score), background: `${confidenceColor(item.confidence_score)}12`, padding: "0.25rem 0.625rem", borderRadius: "999px" }}>
                {item.confidence_score ? `${Math.round(item.confidence_score * 100)}%` : "—"}
              </span>
              {item.review_notes && (
                <span style={{ fontSize: "0.6875rem", color: "var(--text-muted)", fontStyle: "italic", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {item.review_notes}
                </span>
              )}
            </div>
          </div>

          {expandedId === item.id && (
            <div style={{ padding: "0 1.25rem 1rem 1.25rem", borderTop: "1px solid #f1f5f9", paddingTop: "0.75rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1rem", fontSize: "0.8125rem" }}>
                <div>
                  <span style={{ color: "var(--text-muted)", display: "block", marginBottom: "0.125rem" }}>Description</span>
                  <p style={{ color: "var(--midnight)", lineHeight: 1.4 }}>{item.raw_description || "—"}</p>
                </div>
                <div>
                  <span style={{ color: "var(--text-muted)", display: "block", marginBottom: "0.125rem" }}>Salary</span>
                  <p style={{ color: "var(--midnight)" }}>{item.raw_salary || "—"}</p>
                  <span style={{ color: "var(--text-muted)", display: "block", marginTop: "0.5rem", marginBottom: "0.125rem" }}>Deadline</span>
                  <p style={{ color: "var(--midnight)" }}>{item.raw_deadline ? new Date(item.raw_deadline).toLocaleDateString() : "—"}</p>
                </div>
              </div>

              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "1rem", wordBreak: "break-all" }}>
                <strong>URL:</strong> <a href={item.raw_url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--teal)" }}>{item.raw_url}</a>
              </div>

              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  onClick={() => handlePublish(item.id)}
                  disabled={processingId === item.id}
                  style={{ padding: "0.5rem 1.25rem", background: processingId === item.id ? "#e2e8f0" : "var(--teal)", color: processingId === item.id ? "#94a3b8" : "white", fontWeight: 700, fontSize: "0.8125rem", borderRadius: "var(--radius-md)", border: "none", cursor: processingId === item.id ? "not-allowed" : "pointer" }}
                >
                  {processingId === item.id ? "Publishing..." : "Publish"}
                </button>

                {rejectId === item.id ? (
                  <div style={{ display: "flex", gap: "0.375rem", alignItems: "center", flex: 1 }}>
                    <input
                      value={rejectReason}
                      onChange={e => setRejectReason(e.target.value)}
                      placeholder="Reason for rejection"
                      style={{ flex: 1, padding: "0.5rem 0.75rem", borderRadius: "var(--radius-sm)", border: "1px solid #fecaca", fontSize: "0.8125rem" }}
                    />
                    <button onClick={() => handleReject(item.id)} disabled={processingId === item.id || !rejectReason.trim()} style={{ padding: "0.5rem 1rem", background: processingId === item.id ? "#e2e8f0" : "#ef4444", color: "white", fontWeight: 600, fontSize: "0.8125rem", borderRadius: "var(--radius-md)", border: "none", cursor: processingId === item.id || !rejectReason.trim() ? "not-allowed" : "pointer" }}>
                      {processingId === item.id ? "..." : "Confirm"}
                    </button>
                    <button onClick={() => { setRejectId(null); setRejectReason(""); }} style={{ padding: "0.5rem", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "0.75rem" }}>
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setRejectId(item.id)}
                    disabled={processingId === item.id}
                    style={{ padding: "0.5rem 1.25rem", background: "transparent", color: "#ef4444", fontWeight: 600, fontSize: "0.8125rem", borderRadius: "var(--radius-md)", border: "1px solid #fecaca", cursor: processingId === item.id ? "not-allowed" : "pointer" }}
                  >
                    Reject
                  </button>
                )}
              </div>

              {item.ai_enriched_data && (
                <details style={{ marginTop: "0.75rem" }}>
                  <summary style={{ fontSize: "0.75rem", color: "var(--text-muted)", cursor: "pointer" }}>AI enrichment data</summary>
                  <pre style={{ fontSize: "0.6875rem", color: "var(--text-muted)", marginTop: "0.5rem", whiteSpace: "pre-wrap", maxHeight: 200, overflowY: "auto" }}>
                    {JSON.stringify(item.ai_enriched_data, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
