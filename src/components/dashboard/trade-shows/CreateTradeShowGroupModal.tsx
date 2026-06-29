"use client";

import { useState } from "react";

interface Props {
  showId: string;
  showName: string;
  minGroupSize: number;
  maxGroupSize: number;
  costPerPerson: number;
}

export default function CreateTradeShowGroupModal({ showId, showName, minGroupSize, maxGroupSize, costPerPerson }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("");
  const [targetSize, setTargetSize] = useState(minGroupSize);
  const [description, setDescription] = useState("");
  const [savingsDeadline, setSavingsDeadline] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const res = await fetch("/api/trade-shows/create-group", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tradeShowId: showId,
        title,
        targetGroupSize: targetSize,
        description: description || undefined,
        savingsDeadline: savingsDeadline || undefined,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to create group");
      setSaving(false);
      return;
    }

    window.location.href = `/dashboard/trade-shows/groups/${data.groupId}`;
  }

  return (
    <>
      <div style={{ textAlign: "center", padding: "1.5rem", background: "white", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)" }}>
        <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginBottom: "0.75rem" }}>
          Want to start your own group for this show?
        </p>
        <button
          onClick={() => setShowModal(true)}
          style={{
            display: "inline-block",
            padding: "0.625rem 1.5rem",
            background: "var(--teal)",
            color: "var(--midnight)",
            fontWeight: 700,
            fontSize: "0.875rem",
            borderRadius: "var(--radius-sm)",
            border: "none",
            cursor: "pointer",
          }}
        >
          Create my own group
        </button>
      </div>

      {showModal && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 1000,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(0,0,0,0.5)",
          }}
          onClick={() => { if (!saving) setShowModal(false); }}
        >
          <div
            style={{
              background: "white",
              borderRadius: "var(--radius-xl)",
              padding: "2rem",
              width: "100%",
              maxWidth: "480px",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h2 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1.125rem", fontWeight: 800, color: "var(--midnight)" }}>
                Create a group for {showName}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: "none", border: "none", fontSize: "1.25rem", cursor: "pointer", color: "var(--text-muted)", padding: "0.25rem" }}
              >
                ✕
              </button>
            </div>

            <div style={{ background: "var(--off-white)", borderRadius: "var(--radius-lg)", padding: "1rem", marginBottom: "1.25rem" }}>
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>Cost per person (group price)</p>
              <p style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--teal)" }}>
                ₦{costPerPerson.toLocaleString()}
              </p>
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                Group size: {minGroupSize}–{maxGroupSize} members
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.375rem" }}>
                  Group title <span style={{ color: "var(--danger)" }}>*</span>
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder={`e.g. ${showName} Team`}
                  style={{ width: "100%", padding: "0.625rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", fontSize: "0.875rem" }}
                />
              </div>

              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.375rem" }}>
                  Target group size <span style={{ color: "var(--danger)" }}>*</span>
                </label>
                <input
                  type="number"
                  value={targetSize}
                  onChange={(e) => setTargetSize(Math.max(minGroupSize, Math.min(maxGroupSize, parseInt(e.target.value) || minGroupSize)))}
                  min={minGroupSize}
                  max={maxGroupSize}
                  required
                  style={{ width: "100%", padding: "0.625rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", fontSize: "0.875rem" }}
                />
                <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                  Min {minGroupSize} · Max {maxGroupSize}
                </p>
              </div>

              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.375rem" }}>
                  Description <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>(optional)</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Who should join this group?"
                  style={{ width: "100%", padding: "0.625rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", fontSize: "0.875rem" }}
                />
              </div>

              <div style={{ marginBottom: "1.5rem" }}>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.375rem" }}>
                  Savings deadline <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>(optional)</span>
                </label>
                <input
                  type="date"
                  value={savingsDeadline}
                  onChange={(e) => setSavingsDeadline(e.target.value)}
                  style={{ width: "100%", padding: "0.625rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", fontSize: "0.875rem" }}
                />
              </div>

              {error && (
                <p style={{ color: "var(--danger)", fontSize: "0.8125rem", marginBottom: "1rem" }}>{error}</p>
              )}

              <button
                type="submit"
                disabled={saving}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  background: "var(--midnight)",
                  color: "white",
                  fontWeight: 700,
                  fontSize: "0.9375rem",
                  borderRadius: "var(--radius-md)",
                  border: "none",
                  cursor: saving ? "not-allowed" : "pointer",
                  opacity: saving ? 0.6 : 1,
                }}
              >
                {saving ? "Creating group..." : "Create group"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
