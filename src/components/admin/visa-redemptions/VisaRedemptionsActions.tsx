"use client";

import { useState } from "react";

interface VisaRedemption {
  id: string;
  status: string;
  users?: { full_name: string; email: string } | null;
}

const ACTION_BUTTONS: Record<string, Array<{ label: string; status: string; color: string }>> = {
  pending_payment: [
    { label: "Confirm payment ✓", status: "payment_confirmed", color: "var(--teal)" },
    { label: "Cancel", status: "cancelled", color: "var(--gray-100)" },
  ],
  payment_confirmed: [
    { label: "Mark processing →", status: "processing", color: "var(--teal)" },
    { label: "Cancel", status: "cancelled", color: "var(--gray-100)" },
  ],
  documents_uploaded: [
    { label: "Mark processing →", status: "processing", color: "var(--teal)" },
    { label: "Cancel", status: "cancelled", color: "var(--gray-100)" },
  ],
  processing: [
    { label: "Mark completed ✓", status: "completed", color: "var(--teal)" },
    { label: "Cancel", status: "cancelled", color: "var(--gray-100)" },
  ],
};

export default function VisaRedemptionsActions({ redemption }: { redemption: VisaRedemption }) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  const buttons = ACTION_BUTTONS[redemption.status];

  if (!buttons || buttons.length === 0) {
    return <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>—</span>;
  }

  async function handleAction(newStatus: string) {
    if (newStatus === "cancelled" && !confirm(`Cancel this visa redemption for ${redemption.users?.full_name || "this user"}?`)) {
      return;
    }
    setLoading(newStatus);
    setError("");

    const res = await fetch("/api/admin/visa-redemptions/update-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ redemptionId: redemption.id, newStatus }),
    });

    if (res.ok) {
      window.location.reload();
    } else {
      const data = await res.json();
      setError(data.error || "Failed to update status");
    }
    setLoading(null);
  }

  return (
    <div>
      <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap" }}>
        {buttons.map((btn) => (
          <button
            key={btn.status}
            onClick={() => handleAction(btn.status)}
            disabled={loading !== null}
            style={{
              padding: "0.25rem 0.5rem",
              background: loading === btn.status ? "var(--gray-300)" : btn.color,
              color: btn.status === "cancelled" ? "var(--danger)" : "var(--midnight)",
              fontWeight: 700,
              fontSize: "0.7rem",
              borderRadius: "var(--radius-sm)",
              border: btn.status === "cancelled" ? "1px solid var(--border)" : "none",
              cursor: loading !== null ? "not-allowed" : "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {loading === btn.status ? "..." : btn.label}
          </button>
        ))}
      </div>
      {error && <p style={{ color: "var(--danger)", fontSize: "0.7rem", marginTop: "0.25rem" }}>{error}</p>}
    </div>
  );
}
