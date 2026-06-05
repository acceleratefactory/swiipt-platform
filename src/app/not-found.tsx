import Link from "next/link";

export default function NotFound() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", padding: "2rem", textAlign: "center" }}>
      <h1 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "4rem", fontWeight: 800, color: "var(--midnight)", marginBottom: "0.5rem" }}>404</h1>
      <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem", fontSize: "1.125rem" }}>
        Page not found
      </p>
      <Link href="/" style={{ padding: "0.75rem 2rem", background: "var(--midnight)", color: "white", fontWeight: 700, fontSize: "0.875rem", borderRadius: "var(--radius-md)", textDecoration: "none" }}>
        Go home
      </Link>
    </div>
  );
}
