export default function DashboardLoading() {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <div style={{ width: 240, background: "white", borderRight: "1px solid var(--border)", padding: "1.5rem" }}>
        <div style={{ width: "60%", height: 12, background: "var(--gray-100)", borderRadius: 6, marginBottom: "2rem" }} />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
            <div style={{ width: 20, height: 20, borderRadius: 6, background: "var(--gray-100)" }} />
            <div style={{ flex: 1, height: 10, background: "var(--gray-100)", borderRadius: 5 }} />
          </div>
        ))}
      </div>
      <div style={{ flex: 1, padding: "2rem" }}>
        <div style={{ width: "40%", height: 16, background: "var(--gray-100)", borderRadius: 8, marginBottom: "1.5rem" }} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ height: 120, background: "var(--gray-100)", borderRadius: "var(--radius-lg)" }} />
          ))}
        </div>
      </div>
    </div>
  );
}
