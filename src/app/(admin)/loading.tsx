export default function AdminLoading() {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <div style={{ width: 240, background: "white", borderRight: "1px solid var(--border)", padding: "1.5rem" }}>
        <div style={{ width: "70%", height: 12, background: "var(--gray-100)", borderRadius: 6, marginBottom: "2rem" }} />
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
            <div style={{ width: 18, height: 18, borderRadius: 6, background: "var(--gray-100)" }} />
            <div style={{ flex: 1, height: 10, background: "var(--gray-100)", borderRadius: 5 }} />
          </div>
        ))}
      </div>
      <div style={{ flex: 1, padding: "2rem" }}>
        <div style={{ width: "30%", height: 20, background: "var(--gray-100)", borderRadius: 8, marginBottom: "1.5rem" }} />
        <div style={{ height: 200, background: "var(--gray-100)", borderRadius: "var(--radius-lg)" }} />
      </div>
    </div>
  );
}
