import { createClient } from "@/lib/supabase/server";

export default async function ResourcesSection() {
  const supabase = createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: guides } = await (supabase as any)
    .from("resource_guides")
    .select("slug, title, category")
    .eq("published", true)
    .order("featured", { ascending: false })
    .limit(12);

  const all = guides || [];

  const categories: Record<string, typeof all> = {
    "UAE & Qatar": all.filter(
      (g: { category: string; slug: string }) =>
        g.category === "visa_residency" &&
        (g.slug.includes("uae") || g.slug.includes("qatar"))
    ),
    "Canada & UK": all.filter(
      (g: { category: string; slug: string }) =>
        g.category === "visa_residency" &&
        (g.slug.includes("canada") || g.slug.includes("uk"))
    ),
    "Company & Remote Work": all.filter(
      (g: { category: string }) =>
        g.category === "company_registration" || g.category === "remote_work"
    ),
  };

  return (
    <section
      style={{
        background: "white",
        padding: "4rem 0",
        borderTop: "1px solid var(--border)",
      }}
    >
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 2rem" }}>
        <h2
          style={{
            fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif",
            fontSize: "1.25rem",
            fontWeight: 700,
            color: "var(--midnight)",
            marginBottom: "2rem",
          }}
        >
          Everything you need to know about relocating
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "2rem",
          }}
        >
          {Object.entries(categories).map(([heading, links]) => (
            <div key={heading}>
              <h3
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 700,
                  color: "var(--midnight)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: "1rem",
                }}
              >
                {heading}
              </h3>
              {links.length === 0 ? (
                <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                  Coming soon
                </p>
              ) : (
                links.map(
                  (guide: { slug: string; title: string }) => (
                    <a
                      key={guide.slug}
                      href={`/resources/${guide.slug}`}
                      style={{
                        display: "block",
                        fontSize: "0.875rem",
                        color: "var(--text-secondary)",
                        marginBottom: "0.625rem",
                        textDecoration: "none",
                        lineHeight: 1.4,
                      }}
                      onMouseEnter={(e) =>
                        ((e.target as HTMLElement).style.color = "var(--teal)")
                      }
                      onMouseLeave={(e) =>
                        ((e.target as HTMLElement).style.color =
                          "var(--text-secondary)")
                      }
                    >
                      {guide.title}
                    </a>
                  )
                )
              )}
              <a
                href="/resources"
                style={{
                  fontSize: "0.8125rem",
                  color: "var(--teal)",
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                View all guides →
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
