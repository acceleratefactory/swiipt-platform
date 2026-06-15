"use client";
import { useState } from "react";
import SpinWheelModal from "./SpinWheelModal";

export default function SpinWheelSection({ spins, userId }: { spins: any[]; userId: string }) {
  const [activePromotion, setActivePromotion] = useState<any>(null);

  if (spins.length === 0) return null;

  return (
    <div style={{ marginBottom: "1.5rem" }}>
      <div style={{
        background: "linear-gradient(135deg, #06112B, #0D2444)",
        borderRadius: "var(--radius-xl)",
        padding: "1.5rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "1rem",
        flexWrap: "wrap",
        border: "1px solid rgba(0,200,150,0.3)",
      }}>
        <div>
          <p style={{ color: "var(--teal)", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.375rem" }}>
            Spin available
          </p>
          <p style={{ color: "white", fontWeight: 700, fontSize: "1rem", marginBottom: "0.25rem" }}>
            {spins[0].title}
          </p>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.8125rem" }}>
            Spin once to win a prize. Prizes are locked travel credits.
          </p>
        </div>
        <button
          onClick={() => setActivePromotion(spins[0])}
          style={{
            padding: "0.75rem 1.5rem",
            background: "var(--teal)",
            color: "var(--midnight)",
            fontWeight: 700,
            fontSize: "0.9375rem",
            borderRadius: "var(--radius-md)",
            border: "none",
            cursor: "pointer",
            whiteSpace: "nowrap",
            animation: "pulse-glow 2s ease-in-out infinite",
          }}
        >
          Spin now &rarr;
        </button>
      </div>
      {activePromotion && (
        <SpinWheelModal
          promotion={activePromotion}
          userId={userId}
          onClose={() => setActivePromotion(null)}
        />
      )}
    </div>
  );
}
