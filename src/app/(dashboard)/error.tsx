"use client";

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", padding: "2rem", textAlign: "center" }}>
      <h1 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1.25rem", fontWeight: 800, color: "var(--midnight)", marginBottom: "0.5rem" }}>
        Dashboard error
      </h1>
      <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem", maxWidth: 400, fontSize: "0.875rem" }}>
        {error.message || "Something went wrong loading this page."}
      </p>
      <button onClick={reset} style={{ padding: "0.75rem 2rem", background: "var(--midnight)", color: "white", fontWeight: 700, fontSize: "0.875rem", borderRadius: "var(--radius-md)", border: "none", cursor: "pointer" }}>
        Try again
      </button>
    </div>
  );
}
