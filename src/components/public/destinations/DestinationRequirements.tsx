export default function DestinationRequirements({ requirements }: { requirements: string[] }) {
  return (
    <section style={{ padding: "2rem 0 3rem" }}>
      <h2
        style={{
          fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif",
          fontSize: "1.5rem",
          fontWeight: 800,
          color: "var(--midnight)",
          marginBottom: "1.25rem",
        }}
      >
        Requirements
      </h2>
      <div style={{ display: "grid", gap: "0.75rem" }}>
        {requirements.map((req: string, idx: number) => (
          <div
            key={idx}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "0.75rem",
              padding: "0.75rem 1rem",
              background: "var(--off-white)",
              borderRadius: "var(--radius-md)",
            }}
          >
            <span style={{ color: "var(--teal)", fontSize: "1rem", flexShrink: 0, marginTop: "0.125rem" }}>✓</span>
            <span style={{ fontSize: "0.9375rem", color: "var(--text-primary)", lineHeight: 1.5 }}>{req}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
