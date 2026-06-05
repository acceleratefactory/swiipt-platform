export default function DestinationHero({ dest }: { dest: any }) {
  return (
    <section
      style={{
        background: dest.heroGradient,
        padding: "5rem 1.5rem",
        color: "white",
        textAlign: "center",
      }}
    >
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <span style={{ fontSize: "3rem", display: "block", marginBottom: "1rem" }}>{dest.flag}</span>
        <h1
          style={{
            fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif",
            fontSize: "clamp(2rem, 4vw, 3rem)",
            fontWeight: 800,
            color: "white",
            marginBottom: "0.75rem",
            lineHeight: 1.2,
          }}
        >
          {dest.name}
        </h1>
        <p
          style={{
            fontSize: "1.125rem",
            opacity: 0.9,
            maxWidth: "600px",
            margin: "0 auto",
            lineHeight: 1.6,
          }}
        >
          {dest.tagline}
        </p>
        <p
          style={{
            fontSize: "0.875rem",
            opacity: 0.7,
            marginTop: "1rem",
          }}
        >
          {dest.processing_weeks !== "varies"
            ? `Processing: ${dest.processing_weeks} · ${dest.success_rate}% success rate`
            : `${dest.success_rate}% success rate`}
        </p>
      </div>
    </section>
  );
}
