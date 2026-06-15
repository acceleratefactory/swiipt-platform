import Link from "next/link";

export default function NicheRelated({ pages }: { pages: any[] }) {
  return (
    <section style={{ padding: "4rem 0", background: "var(--off-white)" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "0 2rem" }}>
        <h2 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1.625rem", fontWeight: 800, color: "var(--midnight)", marginBottom: "0.5rem", textAlign: "center" }}>
          Related pages
        </h2>
        <p style={{ color: "var(--text-muted)", textAlign: "center", marginBottom: "2rem", fontSize: "0.9375rem" }}>
          Explore other pathways that might fit your profile.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1rem" }}>
          {pages.map((p: any) => (
            <Link
              key={`${p.url_prefix}/${p.slug}`}
              href={`/${p.url_prefix}/${p.slug}`}
              style={{ textDecoration: "none" }}
            >
              <div style={{ background: "white", borderRadius: "var(--radius-md)", padding: "1.25rem", border: "1px solid var(--border)", transition: "box-shadow 0.15s" }}>
                {p.destination && (
                  <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--teal)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.375rem" }}>
                    {p.destination}
                  </p>
                )}
                <h3 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1rem", fontWeight: 700, color: "var(--midnight)", marginBottom: "0.25rem" }}>
                  {p.title}
                </h3>
                {p.subtitle && (
                  <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", lineHeight: 1.4 }}>
                    {p.subtitle}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
