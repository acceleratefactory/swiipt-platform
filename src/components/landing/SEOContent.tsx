"use client"

const seoLinks = [
  {
    heading: "UAE & Qatar",
    links: [
      "How to get a UAE residence permit (2026 guide)",
      "Qatar work visa requirements \u2014 complete guide",
      "UAE free zone company registration guide",
      "Dubai vs Abu Dhabi \u2014 which is better to relocate to?",
    ],
  },
  {
    heading: "Canada & UK",
    links: [
      "Canada Express Entry explained for applicants",
      "UK Skilled Worker visa \u2014 who qualifies in 2026?",
      "How long does Canada PR take?",
      "UK Graduate visa \u2014 complete guide",
    ],
  },
  {
    heading: "Company & Remote Work",
    links: [
      "How to receive Stripe payments \u2014 register a UK company",
      "Portugal D8 visa \u2014 complete guide",
      "What is a remote work visa and which countries offer it?",
      "2nd citizenship programs \u2014 how they work",
    ],
  },
]

export default function SEOContent() {
  return (
    <section style={{ background: "white", padding: "4rem 0", borderTop: "1px solid var(--border)" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 2rem" }}>
        <h2
          style={{
            fontSize: "1.25rem",
            fontWeight: 700,
            color: "var(--midnight)",
            marginBottom: "2rem",
          }}
        >
          Everything you need to know about relocating
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {seoLinks.map((col) => (
            <div key={col.heading}>
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
                {col.heading}
              </h3>
              {col.links.map((link) => (
                <a
                  key={link}
                  href="/signup"
                  style={{
                    display: "block",
                    fontSize: "0.875rem",
                    color: "var(--text-secondary)",
                    marginBottom: "0.625rem",
                    textDecoration: "none",
                    lineHeight: 1.4,
                    transition: "color 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    (e.target as HTMLElement).style.color = "var(--teal)"
                  }}
                  onMouseLeave={(e) => {
                    (e.target as HTMLElement).style.color = "var(--text-secondary)"
                  }}
                >
                  {link}
                </a>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
