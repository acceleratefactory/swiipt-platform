export default function NicheHero({ page }: { page: any }) {
  return (
    <section style={{ background: "linear-gradient(135deg, #06112B, #1A3560)", padding: "4rem 0", color: "white" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "0 2rem" }}>
        {page.destination && (
          <p style={{ fontSize: "0.875rem", color: "var(--teal)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.75rem" }}>
            {page.destination}
          </p>
        )}
        <h1 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "clamp(1.75rem, 4vw, 2.5rem)", fontWeight: 800, color: "white", lineHeight: 1.15, marginBottom: "1rem" }}>
          {page.hero_headline}
        </h1>
        <p style={{ fontSize: "1.125rem", color: "#B8C0CF", lineHeight: 1.6, marginBottom: "2rem", maxWidth: "620px" }}>
          {page.hero_subtext}
        </p>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <a href={page.hero_cta_url} style={{ padding: "0.9375rem 2rem", background: "var(--teal)", color: "var(--midnight)", fontWeight: 700, fontSize: "1rem", borderRadius: "var(--radius-md)", textDecoration: "none" }}>
            {page.hero_cta_label} &rarr;
          </a>
          <a href="#process" style={{ padding: "0.9375rem 1.5rem", background: "rgba(255,255,255,0.1)", color: "white", fontWeight: 600, fontSize: "1rem", borderRadius: "var(--radius-md)", textDecoration: "none", border: "1px solid rgba(255,255,255,0.2)" }}>
            See how it works
          </a>
        </div>
      </div>
    </section>
  );
}
