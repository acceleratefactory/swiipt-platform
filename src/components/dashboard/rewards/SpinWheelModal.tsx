"use client";
import { useState } from "react";
import SpinWheel from "./SpinWheel";
import { X } from "lucide-react";

export default function SpinWheelModal({
  promotion,
  userId,
  onClose,
}: {
  promotion: any;
  userId: string;
  onClose: () => void;
}) {
  const [spun, setSpun] = useState(false);

  return (
    <>
      <div onClick={spun ? onClose : undefined} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 60 }} />
      <div style={{
        position: "fixed", top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        background: "var(--off-white)",
        borderRadius: "var(--radius-xl)",
        padding: "2rem",
        zIndex: 61,
        boxShadow: "var(--shadow-lg)",
        width: "380px",
        maxWidth: "95vw",
        textAlign: "center",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <div>
            <p style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontWeight: 800, fontSize: "1.125rem", color: "var(--midnight)" }}>
              {promotion.title}
            </p>
            <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
              Spin once. Win a locked travel credit.
            </p>
          </div>
          {spun && (
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
              <X size={20} />
            </button>
          )}
        </div>
        <SpinWheel
          promotion={promotion}
          userId={userId}
          onSpinComplete={() => setSpun(true)}
        />
      </div>
    </>
  );
}
