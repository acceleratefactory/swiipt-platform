const stories = [
  {
    name: "Adaeze O.",
    route: "Lagos → Dubai, UAE",
    service: "UAE Work Visa + Residency Permit",
    quote: "The whole process took 10 weeks. I had my permit before I even expected it. Swiipt handled everything.",
    duration: "10 weeks",
    flag: "🇦🇪",
    initials: "AO",
  },
  {
    name: "Emeka K.",
    route: "Abuja → Toronto, Canada",
    service: "Canada Express Entry",
    quote: "I tried for 2 years on my own. Swiipt got me a CRS score assessment and we filed within 3 months.",
    duration: "6 months",
    flag: "🇨🇦",
    initials: "EK",
  },
  {
    name: "Blessing A.",
    route: "Lagos → London, UK",
    service: "UK Skilled Worker Visa",
    quote: "Registered my UK company in 5 days. Now I receive Stripe payments directly. Game changer.",
    duration: "5 days",
    flag: "🇬🇧",
    initials: "BA",
  },
]

export default function SuccessStories() {
  return (
    <section style={{ background: "white", padding: "5rem 0" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 2rem" }}>
        {/* Section header */}
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <h2
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "clamp(1.75rem, 3vw, 2.5rem)",
              fontWeight: 800,
              color: "var(--midnight)",
              marginBottom: "0.75rem",
            }}
          >
            Nigerians who made the move.
          </h2>
          <p
            style={{
              fontSize: "1.125rem",
              color: "var(--text-muted)",
              maxWidth: "560px",
              margin: "0 auto",
              lineHeight: 1.6,
            }}
          >
            Real journeys. Real results.
          </p>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stories.map((story) => (
            <div
              key={story.name}
              style={{
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-lg)",
                padding: "1.75rem",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* Quote mark decoration */}
              <div
                style={{
                  fontSize: "4rem",
                  color: "var(--teal-pale)",
                  position: "absolute",
                  top: "1rem",
                  right: "1.5rem",
                  lineHeight: 1,
                  fontFamily: "serif",
                }}
              >
                &quot;
              </div>

              {/* Avatar */}
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  background: "var(--midnight)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontWeight: 700,
                  fontSize: "1rem",
                  marginBottom: "1rem",
                }}
              >
                {story.initials}
              </div>

              {/* Quote */}
              <p
                style={{
                  fontSize: "0.9375rem",
                  color: "var(--text-secondary)",
                  lineHeight: 1.6,
                  marginBottom: "1.5rem",
                  fontStyle: "italic",
                }}
              >
                &ldquo;{story.quote}&rdquo;
              </p>

              {/* Person details */}
              <div style={{ borderTop: "1px solid var(--border)", paddingTop: "1rem" }}>
                <div style={{ fontWeight: 700, color: "var(--midnight)", fontSize: "0.9375rem" }}>
                  {story.name}
                </div>
                <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                  {story.flag} {story.route}
                </div>
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--teal)",
                    fontWeight: 600,
                    marginTop: "0.5rem",
                    background: "var(--teal-pale)",
                    display: "inline-block",
                    padding: "3px 10px",
                    borderRadius: "20px",
                  }}
                >
                  {story.service} &middot; {story.duration}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div style={{ textAlign: "center", marginTop: "2.5rem" }}>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginBottom: "1rem" }}>
            200+ successful relocations. Your story is next.
          </p>
          <a
            href="/signup"
            style={{
              display: "inline-block",
              padding: "0.875rem 2rem",
              background: "var(--midnight)",
              color: "white",
              fontWeight: 700,
              borderRadius: "var(--radius-md)",
              textDecoration: "none",
              fontSize: "0.9375rem",
            }}
          >
            Start your journey →
          </a>
        </div>
      </div>
    </section>
  )
}
