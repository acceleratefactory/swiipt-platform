"use client";

import { useState } from "react";

export default function StepReferral({
  user,
  onNext,
  onBack,
}: {
  user: { referral_code?: string };
  onNext: () => void;
  onBack: () => void;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <div>
      <h2
        style={{
          fontSize: "1.75rem",
          fontWeight: 800,
          color: "var(--midnight)",
          marginBottom: "0.5rem",
        }}
      >
        Share Swiipt. Earn rewards.
      </h2>
      <p
        style={{
          color: "var(--text-muted)",
          marginBottom: "2rem",
        }}
      >
        Your referral code is ready. Share it to earn service credits when
        friends join.
      </p>

      <div
        style={{
          background: "var(--midnight)",
          borderRadius: "var(--radius-lg)",
          padding: "2rem",
          textAlign: "center",
          marginBottom: "1.5rem",
        }}
      >
        <p
          style={{
            color: "var(--gray-300)",
            fontSize: "0.875rem",
            marginBottom: "0.75rem",
          }}
        >
          Your referral code
        </p>
        <div
          style={{
            color: "var(--teal)",
            fontSize: "2rem",
            fontWeight: 800,
            letterSpacing: "0.1em",
            fontFamily: "monospace",
            marginBottom: "1rem",
          }}
        >
          {user.referral_code}
        </div>
        <button
          onClick={() => {
            navigator.clipboard.writeText(user.referral_code || "");
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          style={{
            padding: "0.5rem 1.25rem",
            background: "rgba(255,255,255,0.1)",
            color: "white",
            borderRadius: "20px",
            border: "1px solid rgba(255,255,255,0.2)",
            fontSize: "0.8125rem",
            cursor: "pointer",
          }}
        >
          {copied ? "Copied ✓" : "Copy code"}
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "0.75rem",
          marginBottom: "1.5rem",
        }}
      >
        <button
          onClick={() =>
            window.open(
              `https://wa.me/?text=Join me on Swiipt — the platform where you save toward travel, visas, and relocation goals. Use my code ${user.referral_code} to sign up: https://swiipt.com/signup?ref=${user.referral_code}`
            )
          }
          style={{
            padding: "0.75rem",
            background: "#25D366",
            color: "white",
            borderRadius: "var(--radius-md)",
            border: "none",
            fontWeight: 600,
            fontSize: "0.875rem",
            cursor: "pointer",
          }}
        >
          Share on WhatsApp
        </button>
        <button
          onClick={() => {
            navigator.clipboard.writeText(
              `https://swiipt.com/signup?ref=${user.referral_code}`
            );
          }}
          style={{
            padding: "0.75rem",
            background: "var(--gray-100)",
            color: "var(--text-primary)",
            borderRadius: "var(--radius-md)",
            border: "none",
            fontWeight: 600,
            fontSize: "0.875rem",
            cursor: "pointer",
          }}
        >
          Copy link
        </button>
      </div>

      <button
        onClick={onNext}
        style={{
          width: "100%",
          padding: "0.875rem",
          background: "var(--teal)",
          color: "var(--midnight)",
          fontWeight: 700,
          borderRadius: "var(--radius-md)",
          border: "none",
          cursor: "pointer",
          fontSize: "1rem",
        }}
      >
        Continue to my dashboard →
      </button>
      <button
        onClick={onNext}
        style={{
          width: "100%",
          padding: "0.75rem",
          background: "none",
          border: "none",
          color: "var(--text-muted)",
          fontSize: "0.875rem",
          cursor: "pointer",
          marginTop: "0.5rem",
        }}
      >
        Skip for now
      </button>

      <button
        onClick={onBack}
        style={{
          background: "none",
          border: "none",
          color: "var(--text-muted)",
          fontSize: "0.875rem",
          cursor: "pointer",
          padding: "0.5rem",
          marginTop: "1rem",
          display: "block",
        }}
      >
        ← Back
      </button>
    </div>
  );
}
