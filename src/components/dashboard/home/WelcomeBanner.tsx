"use client";

import { useState } from "react";
import { X } from "lucide-react";

export default function WelcomeBanner({
  reward,
  userId,
}: {
  reward: { id: string };
  userId: string;
}) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div
      style={{
        background: "linear-gradient(135deg, var(--midnight), var(--midnight-light))",
        borderRadius: "var(--radius-lg)",
        padding: "1.25rem 1.5rem",
        marginBottom: "1.5rem",
        display: "flex",
        alignItems: "center",
        gap: "1rem",
        flexWrap: "wrap",
      }}
    >
      <span style={{ fontSize: "2rem" }}>🎁</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ color: "var(--teal)", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Welcome reward
        </p>
        <p style={{ color: "white", fontWeight: 700, fontSize: "0.9375rem", marginTop: "0.125rem" }}>
          Free Qatar Tourist Visa unlocked
        </p>
        <p style={{ color: "var(--gray-300)", fontSize: "0.8125rem", marginTop: "0.25rem" }}>
          Redeem to apply, or convert to ₦25,000 locked travel credit.
        </p>
      </div>
      <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0, flexWrap: "wrap" }}>
        <button
          onClick={() => { window.location.href = "/dashboard/rewards"; }}
          style={{ padding: "0.5rem 1rem", background: "var(--teal)", color: "var(--midnight)", fontWeight: 700, fontSize: "0.8125rem", borderRadius: "var(--radius-sm)", border: "none", cursor: "pointer" }}
        >
          Redeem visa
        </button>
        <button
          onClick={() => { window.location.href = "/dashboard/rewards?convert=welcome_visa"; }}
          style={{ padding: "0.5rem 1rem", background: "rgba(255,255,255,0.1)", color: "white", fontWeight: 600, fontSize: "0.8125rem", borderRadius: "var(--radius-sm)", border: "1px solid rgba(255,255,255,0.2)", cursor: "pointer" }}
        >
          Convert to credit
        </button>
        <button
          onClick={() => setDismissed(true)}
          style={{ background: "none", border: "none", color: "var(--gray-500)", cursor: "pointer", padding: "0.5rem" }}
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
