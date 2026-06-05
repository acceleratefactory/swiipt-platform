export default function DestinationPathways({ pathways }: { pathways: any[] }) {
  return (
    <section style={{ padding: "3rem 0" }}>
      <h2
        style={{
          fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif",
          fontSize: "1.5rem",
          fontWeight: 800,
          color: "var(--midnight)",
          marginBottom: "1.5rem",
        }}
      >
        Available pathways
      </h2>
      <div style={{ display: "grid", gap: "1rem" }}>
        {pathways.map((pathway: any, idx: number) => (
          <div
            key={idx}
            style={{
              background: "var(--off-white)",
              borderRadius: "var(--radius-lg)",
              padding: "1.5rem",
              border: "1px solid var(--border)",
            }}
          >
            <h3
              style={{
                fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif",
                fontSize: "1.125rem",
                fontWeight: 700,
                color: "var(--midnight)",
                marginBottom: "0.5rem",
              }}
            >
              {pathway.name}
            </h3>
            <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: "0.75rem" }}>
              {pathway.description}
            </p>
            <div style={{ display: "flex", gap: "1rem", fontSize: "0.8125rem" }}>
              <span style={{ color: "var(--text-muted)" }}>⏱ {pathway.duration}</span>
              <span style={{ color: "var(--teal)", fontWeight: 600 }}>{pathway.price}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
