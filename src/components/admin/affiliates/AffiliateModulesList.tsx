"use client";

import { useState } from "react";
import Link from "next/link";

/* eslint-disable @typescript-eslint/no-explicit-any */

function fmtDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}

export default function AffiliateModulesList({ modules }: { modules: any[] }) {
  const [deleteModal, setDeleteModal] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [reordering, setReordering] = useState(false);

  async function handleDelete() {
    if (!deleteModal) return;
    setDeleting(true);
    setResult(null);
    try {
      const res = await fetch(`/api/admin/affiliates/modules/${deleteModal.id}`, { method: "DELETE" });
      if (res.ok) {
        setResult("Module deleted");
        setDeleteModal(null);
      } else {
        const data = await res.json();
        setResult(`Error: ${data.error}${data.progressCount ? ` (${data.progressCount} progress records exist)` : ""}`);
      }
    } catch (err: any) {
      setResult(`Error: ${err.message}`);
    }
    setDeleting(false);
    setTimeout(() => {
      setResult(null);
      if (result === "Module deleted") window.location.reload();
    }, 2000);
  }

  async function handleMoveUp(index: number) {
    if (index === 0) return;
    const ids = modules.map((m) => m.id);
    [ids[index - 1], ids[index]] = [ids[index], ids[index - 1]];
    await handleReorder(ids);
  }

  async function handleMoveDown(index: number) {
    if (index === modules.length - 1) return;
    const ids = modules.map((m) => m.id);
    [ids[index], ids[index + 1]] = [ids[index + 1], ids[index]];
    await handleReorder(ids);
  }

  async function handleReorder(moduleIds: string[]) {
    setReordering(true);
    try {
      await fetch("/api/admin/affiliates/modules/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moduleIds }),
      });
      window.location.reload();
    } catch {
      // silently fail
    }
    setReordering(false);
  }

  return (
    <div style={{ background: "white", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", overflow: "hidden" }}>
      {/* Header with New button */}
      <div style={{ padding: "0.875rem 1rem", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>{modules.length} module{modules.length !== 1 ? "s" : ""}</span>
        <Link
          href="/admin/affiliates/modules/new"
          style={{ padding: "0.375rem 0.75rem", background: "var(--midnight)", color: "white", fontWeight: 700, fontSize: "0.75rem", borderRadius: "var(--radius-sm)", border: "none", cursor: "pointer", textDecoration: "none" }}
        >
          + New Module
        </Link>
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8125rem" }}>
          <thead>
            <tr style={{ background: "var(--gray-100)" }}>
              {["Order", "Title", "Type", "Duration", "Points", "Free", "Created", "Actions", "Reorder"].map((h) => (
                <th key={h} style={{ padding: "0.625rem 1rem", textAlign: "left", fontWeight: 600, color: "var(--text-secondary)", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {modules.map((m: any, i: number) => (
              <tr key={m.id} style={{ borderBottom: "1px solid var(--gray-100)" }}>
                <td style={{ padding: "0.625rem 1rem", color: "var(--text-muted)" }}>{m.order_in_course}</td>
                <td style={{ padding: "0.625rem 1rem", fontWeight: 600, color: "var(--midnight)" }}>{m.title}</td>
                <td style={{ padding: "0.625rem 1rem" }}>
                  <span style={{ fontSize: "0.65rem", fontWeight: 700, padding: "2px 6px", borderRadius: "20px", background: "#EFF6FF", color: "#1D4ED8" }}>{m.content_type}</span>
                </td>
                <td style={{ padding: "0.625rem 1rem", color: "var(--text-secondary)" }}>{m.duration_minutes}m</td>
                <td style={{ padding: "0.625rem 1rem", color: "var(--text-secondary)" }}>{m.points_on_completion}</td>
                <td style={{ padding: "0.625rem 1rem" }}>
                  {m.is_free ? (
                    <span style={{ fontSize: "0.65rem", fontWeight: 700, padding: "2px 6px", borderRadius: "20px", background: "var(--teal-pale)", color: "var(--teal)" }}>Free</span>
                  ) : (
                    <span style={{ fontSize: "0.65rem", fontWeight: 700, padding: "2px 6px", borderRadius: "20px", background: "#FEF3C7", color: "#B45309" }}>Premium</span>
                  )}
                </td>
                <td style={{ padding: "0.625rem 1rem", fontSize: "0.75rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>{fmtDate(m.created_at)}</td>
                <td style={{ padding: "0.625rem 1rem" }}>
                  <div style={{ display: "flex", gap: "0.375rem" }}>
                    <Link href={`/admin/affiliates/modules/${m.id}`} style={{ padding: "0.25rem 0.5rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", fontSize: "0.7rem", textDecoration: "none", color: "var(--teal)", whiteSpace: "nowrap" }}>
                      Edit
                    </Link>
                    <button onClick={() => setDeleteModal(m)} style={{ padding: "0.25rem 0.5rem", borderRadius: "var(--radius-sm)", border: "1px solid #FECACA", background: "#FEF2F2", color: "var(--danger)", fontSize: "0.7rem", cursor: "pointer", whiteSpace: "nowrap" }}>
                      Delete
                    </button>
                    <Link href={`/admin/affiliates/modules/${m.id}/preview`} target="_blank" style={{ padding: "0.25rem 0.5rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", fontSize: "0.7rem", textDecoration: "none", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                      Preview
                    </Link>
                  </div>
                </td>
                <td style={{ padding: "0.625rem 1rem" }}>
                  <div style={{ display: "flex", gap: "0.25rem" }}>
                    <button onClick={() => handleMoveUp(i)} disabled={i === 0 || reordering} style={{ padding: "0.25rem 0.375rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "white", fontSize: "0.7rem", cursor: i === 0 || reordering ? "not-allowed" : "pointer", opacity: i === 0 || reordering ? 0.5 : 1 }}>
                      ▲
                    </button>
                    <button onClick={() => handleMoveDown(i)} disabled={i === modules.length - 1 || reordering} style={{ padding: "0.25rem 0.375rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "white", fontSize: "0.7rem", cursor: i === modules.length - 1 || reordering ? "not-allowed" : "pointer", opacity: i === modules.length - 1 || reordering ? 0.5 : 1 }}>
                      ▼
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modules.length === 0 && (
        <p style={{ padding: "2rem", fontSize: "0.875rem", color: "var(--text-muted)", textAlign: "center" }}>No modules yet. Create one to get started.</p>
      )}

      {/* Delete modal */}
      {deleteModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "1rem" }} onClick={() => setDeleteModal(null)}>
          <div style={{ background: "white", borderRadius: "var(--radius-lg)", padding: "1.5rem", width: "100%", maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1rem", fontWeight: 700, marginBottom: "0.75rem" }}>Delete module</h3>
            <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
              Are you sure you want to delete <strong>{deleteModal.title}</strong>?
            </p>
            <p style={{ fontSize: "0.75rem", color: "var(--danger)", marginBottom: "1rem" }}>
              This action cannot be undone. If users have started this module, deletion will be blocked.
            </p>
            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
              <button onClick={() => setDeleteModal(null)} style={{ padding: "0.5rem 1rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", background: "white", fontSize: "0.8125rem", cursor: "pointer" }}>Cancel</button>
              <button onClick={handleDelete} disabled={deleting} style={{ padding: "0.5rem 1rem", borderRadius: "var(--radius-md)", border: "none", background: "var(--danger)", color: "white", fontWeight: 700, fontSize: "0.8125rem", cursor: deleting ? "not-allowed" : "pointer", opacity: deleting ? 0.6 : 1 }}>
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {result && (
        <div style={{ position: "fixed", bottom: "1.5rem", right: "1.5rem", padding: "0.75rem 1rem", borderRadius: "var(--radius-md)", background: result.startsWith("Error") ? "#FEF2F2" : "var(--teal-pale)", color: result.startsWith("Error") ? "var(--danger)" : "var(--teal)", fontSize: "0.8125rem", fontWeight: 600, zIndex: 200, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
          {result}
        </div>
      )}
    </div>
  );
}
/* eslint-enable @typescript-eslint/no-explicit-any */
