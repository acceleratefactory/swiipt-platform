"use client";

import { useState } from "react";

/* eslint-disable @typescript-eslint/no-explicit-any */

function formatNgn(n: number | string | null | undefined): string {
  return `₦${(Number(n) || 0).toLocaleString()}`;
}

function fmtDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}

export default function AffiliateWithdrawals({
  pendingWithdrawals,
  recentProcessed,
}: {
  pendingWithdrawals: any[];
  recentProcessed: any[];
}) {
  const [processing, setProcessing] = useState<string | null>(null);
  const [modal, setModal] = useState<{ id: string; action: "approve" | "reject" } | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [result, setResult] = useState<string | null>(null);

  async function handleAction(withdrawalId: string, action: "approve" | "reject") {
    if (action === "reject" && !rejectNote.trim()) return;
    setProcessing(withdrawalId);
    setResult(null);
    try {
      const res = await fetch(`/api/admin/affiliates/withdrawals/${withdrawalId}/process`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, note: action === "reject" ? rejectNote : undefined }),
      });
      if (res.ok) {
        setResult(action === "approve" ? "Withdrawal approved" : "Withdrawal rejected");
        setModal(null);
        setRejectNote("");
      } else {
        const err = await res.json();
        setResult(`Error: ${err.error}`);
      }
    } catch (err: any) {
      setResult(`Error: ${err.message}`);
    }
    setProcessing(null);
    setTimeout(() => {
      setResult(null);
      window.location.reload();
    }, 1500);
  }

  function ConfirmModal() {
    if (!modal) return null;
    const w = [...pendingWithdrawals, ...recentProcessed].find((x) => x.id === modal.id);

    return (
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "1rem" }} onClick={() => { setModal(null); setRejectNote(""); }}>
        <div style={{ background: "white", borderRadius: "var(--radius-lg)", padding: "1.5rem", width: "100%", maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
          <h3 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1rem", fontWeight: 700, marginBottom: "0.75rem" }}>
            {modal.action === "approve" ? "Approve withdrawal" : "Reject withdrawal"}
          </h3>
          {w && (
            <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
              <p>User: <strong>{w.users?.full_name || "—"}</strong></p>
              <p>Amount: <strong style={{ color: "var(--midnight)" }}>{formatNgn(w.amount_ngn)}</strong></p>
              <p>Requested: {fmtDate(w.requested_at)}</p>
            </div>
          )}
          {modal.action === "reject" && (
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.25rem" }}>
                Reason <span style={{ color: "var(--danger)" }}>*</span>
              </label>
              <textarea value={rejectNote} onChange={(e) => setRejectNote(e.target.value)} rows={3} placeholder="Why is this withdrawal being rejected?" style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", fontSize: "0.8125rem", resize: "vertical" }} />
            </div>
          )}
          <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
            <button onClick={() => { setModal(null); setRejectNote(""); }} style={{ padding: "0.5rem 1rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", background: "white", fontSize: "0.8125rem", cursor: "pointer" }}>Cancel</button>
            <button
              onClick={() => handleAction(modal.id, modal.action)}
              disabled={processing === modal.id || (modal.action === "reject" && !rejectNote.trim())}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "var(--radius-md)",
                border: "none",
                background: modal.action === "approve" ? "var(--teal)" : "var(--danger)",
                color: modal.action === "approve" ? "var(--midnight)" : "white",
                fontWeight: 700,
                fontSize: "0.8125rem",
                cursor: processing === modal.id ? "not-allowed" : "pointer",
                opacity: processing === modal.id || (modal.action === "reject" && !rejectNote.trim()) ? 0.6 : 1,
              }}
            >
              {processing === modal.id ? "Processing..." : modal.action === "approve" ? "Approve" : "Reject"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Pending withdrawals */}
      <div style={{ background: "white", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", marginBottom: "1.5rem", overflow: "hidden" }}>
        <div style={{ padding: "0.875rem 1rem", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <h2 style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--midnight)" }}>Pending withdrawals</h2>
          {pendingWithdrawals.length > 0 && (
            <span style={{ background: "#F59E0B", color: "white", borderRadius: "20px", fontSize: "0.7rem", fontWeight: 700, padding: "2px 8px" }}>
              {pendingWithdrawals.length}
            </span>
          )}
        </div>

        {pendingWithdrawals.length === 0 ? (
          <p style={{ padding: "1.5rem", fontSize: "0.875rem", color: "var(--text-muted)", textAlign: "center" }}>No pending withdrawal requests.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8125rem" }}>
              <thead>
                <tr style={{ background: "var(--gray-100)" }}>
                  {["User", "Amount", "Requested", "Action"].map((h) => (
                    <th key={h} style={{ padding: "0.625rem 1rem", textAlign: "left", fontWeight: 600, color: "var(--text-secondary)", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pendingWithdrawals.map((w: any) => (
                  <tr key={w.id} style={{ borderBottom: "1px solid var(--gray-100)" }}>
                    <td style={{ padding: "0.625rem 1rem" }}>
                      <p style={{ fontWeight: 600, color: "var(--midnight)" }}>{w.users?.full_name || "—"}</p>
                      <p style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>{w.users?.email}</p>
                    </td>
                    <td style={{ padding: "0.625rem 1rem", fontWeight: 700, color: "var(--midnight)" }}>{formatNgn(w.amount_ngn)}</td>
                    <td style={{ padding: "0.625rem 1rem", color: "var(--text-muted)", fontSize: "0.75rem", whiteSpace: "nowrap" }}>{fmtDate(w.requested_at)}</td>
                    <td style={{ padding: "0.625rem 1rem" }}>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button onClick={() => setModal({ id: w.id, action: "approve" })} disabled={processing === w.id} style={{ padding: "0.375rem 0.75rem", background: "var(--teal)", color: "var(--midnight)", fontWeight: 700, fontSize: "0.75rem", borderRadius: "var(--radius-sm)", border: "none", cursor: processing === w.id ? "not-allowed" : "pointer" }}>
                          Approve
                        </button>
                        <button onClick={() => setModal({ id: w.id, action: "reject" })} disabled={processing === w.id} style={{ padding: "0.375rem 0.75rem", background: "var(--gray-100)", color: "var(--danger)", fontWeight: 600, fontSize: "0.75rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", cursor: processing === w.id ? "not-allowed" : "pointer" }}>
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent history */}
      {recentProcessed.length > 0 && (
        <div style={{ background: "white", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", overflow: "hidden" }}>
          <div style={{ padding: "0.875rem 1rem", borderBottom: "1px solid var(--border)" }}>
            <h2 style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--midnight)" }}>Recent history</h2>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8125rem" }}>
              <thead>
                <tr style={{ background: "var(--gray-100)" }}>
                  {["User", "Amount", "Status", "Processed at"].map((h) => (
                    <th key={h} style={{ padding: "0.625rem 1rem", textAlign: "left", fontWeight: 600, color: "var(--text-secondary)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentProcessed.map((w: any) => (
                  <tr key={w.id} style={{ borderBottom: "1px solid var(--gray-100)" }}>
                    <td style={{ padding: "0.625rem 1rem", color: "var(--midnight)", fontWeight: 500 }}>{w.users?.full_name || "—"}</td>
                    <td style={{ padding: "0.625rem 1rem", fontWeight: 700 }}>{formatNgn(w.amount_ngn)}</td>
                    <td style={{ padding: "0.625rem 1rem" }}>
                      <span style={{ fontSize: "0.7rem", fontWeight: 700, padding: "2px 8px", borderRadius: "20px", background: w.status === "approved" ? "var(--teal-pale)" : "#FEF2F2", color: w.status === "approved" ? "var(--teal)" : "var(--danger)" }}>
                        {w.status}
                      </span>
                    </td>
                    <td style={{ padding: "0.625rem 1rem", fontSize: "0.75rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>{fmtDate(w.processed_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmModal />

      {result && (
        <div style={{ position: "fixed", bottom: "1.5rem", right: "1.5rem", padding: "0.75rem 1rem", borderRadius: "var(--radius-md)", background: result.startsWith("Error") ? "#FEF2F2" : "var(--teal-pale)", color: result.startsWith("Error") ? "var(--danger)" : "var(--teal)", fontSize: "0.8125rem", fontWeight: 600, zIndex: 200, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
          {result}
        </div>
      )}
    </div>
  );
}
/* eslint-enable @typescript-eslint/no-explicit-any */
