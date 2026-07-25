"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface FailedItem {
  id: string;
  title: string | null;
  review_reason: string | null;
}

export default function FailedCleanupList({ items }: { items: FailedItem[] }) {
  const router = useRouter();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleAction = async (id: string, action: "approve" | "reject") => {
    setProcessingId(id);
    try {
      await fetch("/api/admin/opportunities/approve-cleanup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      router.refresh();
    } catch {
      // silent
    } finally {
      setProcessingId(null);
    }
  };

  if (items.length === 0) return null;

  return (
    <div style={{ marginTop: "2rem" }}>
      <h2 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1.125rem", fontWeight: 700, color: "var(--midnight)", marginBottom: "0.25rem" }}>
        Content Cleanup Issues
      </h2>
      <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
        {items.length} opportunities where automatic content cleaning failed. Review and approve to show in feed, or keep hidden.
      </p>

      {items.map((item) => (
        <div
          key={item.id}
          style={{
            background: "white",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--border)",
            marginBottom: "0.75rem",
            padding: "1rem 1.25rem",
          }}
        >
          <div style={{ fontWeight: 600, fontSize: "0.9375rem", color: "var(--midnight)", marginBottom: "0.5rem" }}>
            {item.title || "Untitled"}
          </div>
          <div style={{ fontSize: "0.8125rem", color: "#92400e", background: "#fffbeb", padding: "0.5rem 0.75rem", borderRadius: "var(--radius-sm)", marginBottom: "0.75rem" }}>
            {item.review_reason || "No reason provided"}
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              onClick={() => handleAction(item.id, "approve")}
              disabled={processingId === item.id}
              style={{ padding: "0.5rem 1.25rem", background: processingId === item.id ? "#e2e8f0" : "var(--teal)", color: processingId === item.id ? "#94a3b8" : "white", fontWeight: 700, fontSize: "0.8125rem", borderRadius: "var(--radius-md)", border: "none", cursor: processingId === item.id ? "not-allowed" : "pointer" }}
            >
              {processingId === item.id ? "..." : "Approve & Show in Feed"}
            </button>
            <button
              onClick={() => handleAction(item.id, "reject")}
              disabled={processingId === item.id}
              style={{ padding: "0.5rem 1.25rem", background: "transparent", color: "#ef4444", fontWeight: 600, fontSize: "0.8125rem", borderRadius: "var(--radius-md)", border: "1px solid #fecaca", cursor: processingId === item.id ? "not-allowed" : "pointer" }}
            >
              Keep Hidden
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
