export default function NicheRequirements({ requirements }: { requirements: string[] }) {
  return (
    <section style={{ padding: "4rem 0", background: "white" }}>
      <div style={{ maxWidth: "760px", margin: "0 auto", padding: "0 2rem" }}>
        <h2 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1.625rem", fontWeight: 800, color: "var(--midnight)", marginBottom: "2rem", textAlign: "center" }}>
          Documents required
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "0.75rem" }}>
          {requirements.map((req: string, i: number) => (
            <div key={i} style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start", padding: "0.875rem", background: "var(--off-white)", borderRadius: "var(--radius-md)" }}>
              <span style={{ color: "var(--teal)", fontWeight: 700, flexShrink: 0 }}>✓</span>
              <span style={{ fontSize: "0.9375rem", color: "var(--text-secondary)", lineHeight: 1.4 }}>{req}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
