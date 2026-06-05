"use client";

export default function GlobalError({ error: _error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html>
      <body>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "2rem", textAlign: "center", fontFamily: "sans-serif" }}>
          <h1 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: "0.5rem" }}>Something went wrong</h1>
          <p style={{ color: "var(--text-muted, #666)", marginBottom: "1.5rem", maxWidth: 400 }}>
            A critical error occurred. Please try refreshing the page.
          </p>
          <button onClick={reset} style={{ padding: "0.75rem 2rem", background: "#111", color: "white", fontWeight: 700, borderRadius: "8px", border: "none", cursor: "pointer" }}>
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
