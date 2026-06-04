"use client";
import { useState } from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function AdminOverridePanel({ profile, goals, adminId: _adminId, userId }: { profile: any; goals: any[]; adminId: string; userId: string }) {
  const [modal, setModal] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [amount, setAmount] = useState("");
  const [goalId, setGoalId] = useState("");
  const [milestone, setMilestone] = useState("");
  const [points, setPoints] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function submitAction(action: string, payload: Record<string, unknown> = {}) {
    if (!note.trim()) return;
    setSubmitting(true);
    const res = await fetch("/api/admin/users/override", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, targetUserId: userId, note, payload }),
    });
    if (res.ok) {
      setResult(`${action} completed successfully`);
      setModal(null);
      setNote("");
      setAmount("");
      setGoalId("");
      setMilestone("");
      setPoints("");
      setMessage("");
    } else {
      const err = await res.json();
      setResult(`Error: ${err.error}`);
    }
    setSubmitting(false);
    setTimeout(() => setResult(null), 3000);
  }

  async function handleSuspend() {
    if (!note.trim()) return;
    setSubmitting(true);
    const res = await fetch("/api/admin/users/suspend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetUserId: userId, note }),
    });
    if (res.ok) {
      setResult("Account suspended");
      setModal(null);
      setNote("");
    } else {
      const err = await res.json();
      setResult(`Error: ${err.error}`);
    }
    setSubmitting(false);
    setTimeout(() => setResult(null), 3000);
  }

  async function handleSetAlumni() {
    if (!note.trim()) return;
    await submitAction("set_alumni", {});
  }

  async function handleExportData() {
    const data = { profile, goals };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `user-data-${userId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function Modal() {
    if (!modal) return null;

    const MODAL_STYLE = {
      position: "fixed" as const, inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "1rem",
    };
    const CARD_STYLE = {
      background: "white", borderRadius: "var(--radius-lg)", padding: "1.5rem", width: "100%", maxWidth: 440, maxHeight: "80vh", overflowY: "auto" as const,
    };

    return (
      <div style={MODAL_STYLE} onClick={() => setModal(null)}>
        <div style={CARD_STYLE} onClick={e => e.stopPropagation()}>
          <h3 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1rem", fontWeight: 700, color: "var(--midnight)", marginBottom: "1rem" }}>
            {modal === "adjust_balance" && "Adjust goal balance"}
            {modal === "unlock_milestone" && "Unlock milestone"}
            {modal === "add_score" && "Add mobility score points"}
            {modal === "award_credit" && "Award service credit"}
            {modal === "send_notification" && "Send notification"}
            {modal === "suspend" && "Suspend account"}
          </h3>

          {modal === "adjust_balance" && (
            <>
              <div style={{ marginBottom: "0.75rem" }}>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.25rem" }}>Goal</label>
                <select value={goalId} onChange={e => setGoalId(e.target.value)} style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", fontSize: "0.8125rem" }}>
                  <option value="">Select a goal</option>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {goals.map((g: any) => <option key={g.id} value={g.id}>{g.goal_name} (₦{g.current_balance})</option>)}
                </select>
              </div>
              <div style={{ marginBottom: "0.75rem" }}>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.25rem" }}>Amount (use negative for deduction)</label>
                <input type="number" value={amount} onChange={e => setAmount(e.target.value)} style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", fontSize: "0.8125rem" }} />
              </div>
            </>
          )}

          {modal === "unlock_milestone" && (
            <div style={{ marginBottom: "0.75rem" }}>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.25rem" }}>Goal</label>
              <select value={goalId} onChange={e => setGoalId(e.target.value)} style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", fontSize: "0.8125rem" }}>
                <option value="">Select a goal</option>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {goals.filter((g: any) => g.status === "active").map((g: any) => <option key={g.id} value={g.id}>{g.goal_name}</option>)}
              </select>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", margin: "0.75rem 0 0.25rem" }}>Milestone</label>
              <select value={milestone} onChange={e => setMilestone(e.target.value)} style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", fontSize: "0.8125rem" }}>
                <option value="">Select milestone</option>
                <option value="25">25%</option>
                <option value="50">50%</option>
                <option value="75">75%</option>
                <option value="100">100%</option>
              </select>
            </div>
          )}

          {modal === "add_score" && (
            <div style={{ marginBottom: "0.75rem" }}>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.25rem" }}>Points to add</label>
              <input type="number" value={points} onChange={e => setPoints(e.target.value)} style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", fontSize: "0.8125rem" }} />
            </div>
          )}

          {modal === "award_credit" && (
            <div style={{ marginBottom: "0.75rem" }}>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.25rem" }}>Credit amount (₦)</label>
              <input type="number" value={amount} onChange={e => setAmount(e.target.value)} style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", fontSize: "0.8125rem" }} />
            </div>
          )}

          {modal === "send_notification" && (
            <div style={{ marginBottom: "0.75rem" }}>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.25rem" }}>Notification message</label>
              <textarea value={message} onChange={e => setMessage(e.target.value)} rows={3} style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", fontSize: "0.8125rem", resize: "vertical" }} />
            </div>
          )}

          {modal === "suspend" && (
            <p style={{ fontSize: "0.875rem", color: "var(--danger)", marginBottom: "0.75rem" }}>
              This will prevent the user from logging in. The action is reversible.
            </p>
          )}

          {/* Note field (mandatory for all actions) */}
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.25rem" }}>
              Note <span style={{ color: "var(--danger)" }}>*</span>
            </label>
            <textarea value={note} onChange={e => setNote(e.target.value)} rows={2} placeholder="Reason for this action" style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", fontSize: "0.8125rem", resize: "vertical" }} />
          </div>

          <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
            <button onClick={() => setModal(null)} style={{ padding: "0.5rem 1rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", background: "white", fontSize: "0.8125rem", cursor: "pointer" }}>
              Cancel
            </button>
            <button
              onClick={async () => {
                if (modal === "suspend") { await handleSuspend(); return; }
                if (modal === "adjust_balance") await submitAction("adjust_balance", { goalId, amount: Number(amount) });
                else if (modal === "unlock_milestone") await submitAction("unlock_milestone", { goalId, milestone: Number(milestone) });
                else if (modal === "add_score") await submitAction("add_score", { points: Number(points) });
                else if (modal === "award_credit") await submitAction("award_credit", { amount: Number(amount) });
                else if (modal === "send_notification") await submitAction("send_notification", { message });
              }}
              disabled={submitting || !note.trim()}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "var(--radius-md)",
                border: "none",
                background: modal === "suspend" || modal === "adjust_balance" ? "var(--danger)" : "var(--midnight)",
                color: "white",
                fontSize: "0.8125rem",
                cursor: submitting || !note.trim() ? "not-allowed" : "pointer",
                opacity: submitting || !note.trim() ? 0.6 : 1,
              }}
            >
              {submitting ? "Submitting…" : "Confirm"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const actions = [
    { label: "Adjust goal balance", description: "Manually add or deduct from a goal balance. Requires mandatory note.", dangerous: true, onClick: () => setModal("adjust_balance") },
    { label: "Manually unlock milestone", description: "Force-unlock a specific milestone on a goal.", dangerous: false, onClick: () => setModal("unlock_milestone") },
    { label: "Add mobility score points", description: "Manually add points to this user's Mobility Score.", dangerous: false, onClick: () => setModal("add_score") },
    { label: "Award service credit", description: "Manually add a reward/credit to this user's account.", dangerous: false, onClick: () => setModal("award_credit") },
    { label: "Send direct notification", description: "Send an in-app notification directly to this user.", dangerous: false, onClick: () => setModal("send_notification") },
    { label: "Set alumni status", description: "Manually grant alumni status to this user.", dangerous: false, onClick: handleSetAlumni },
    { label: "Suspend account", description: "Prevent this user from logging in. Reversible.", dangerous: true, onClick: () => setModal("suspend") },
    { label: "Export user data (JSON)", description: "Download all user data for compliance or dispute resolution.", dangerous: false, onClick: handleExportData },
  ];

  return (
    <div style={{ background: "white", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", padding: "1.5rem" }}>
      <h3 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "0.9375rem", fontWeight: 700, color: "var(--midnight)", marginBottom: "0.75rem" }}>
        Admin Override Actions
      </h3>
      <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
        These actions are recorded in the immutable admin audit log.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "0.75rem" }}>
        {actions.map(a => (
          <button
            key={a.label}
            onClick={a.onClick}
            style={{
              padding: "0.75rem",
              borderRadius: "var(--radius-md)",
              border: a.dangerous ? "1px solid #FECACA" : "1px solid var(--border)",
              background: a.dangerous ? "#FEF2F2" : "white",
              cursor: "pointer",
              textAlign: "left",
              transition: "box-shadow 0.15s",
            }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = "var(--shadow-sm)"}
            onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}
          >
            <p style={{ fontWeight: 700, fontSize: "0.8125rem", color: a.dangerous ? "var(--danger)" : "var(--midnight)", marginBottom: "0.25rem" }}>{a.label}</p>
            <p style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{a.description}</p>
          </button>
        ))}
      </div>

      {result && (
        <div style={{ marginTop: "1rem", padding: "0.75rem 1rem", borderRadius: "var(--radius-md)", background: result.startsWith("Error") ? "#FEF2F2" : "var(--teal-pale)", color: result.startsWith("Error") ? "var(--danger)" : "var(--teal)", fontSize: "0.8125rem", fontWeight: 600 }}>
          {result}
        </div>
      )}

      <Modal />
    </div>
  );
}
