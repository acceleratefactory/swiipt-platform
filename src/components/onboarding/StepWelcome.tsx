"use client";

export default function StepWelcome() {
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
        Your dashboard is ready!
      </h2>
      <p
        style={{
          color: "var(--text-muted)",
          marginBottom: "2rem",
        }}
      >
        Coming in Phase 5.
      </p>
    </div>
  );
}
