import { Users, Building2, RefreshCw } from "lucide-react"

const features = [
  { icon: "Users", text: "Bulk permit processing for 5\u201350 staff" },
  { icon: "Building2", text: "Foreign subsidiary registration in UK, UAE, USA" },
  { icon: "RefreshCw", text: "Ongoing permit renewals and compliance management" },
]

const iconMap: Record<string, React.ReactNode> = {
  Users: <Users size={22} style={{ color: "var(--teal)" }} />,
  Building2: <Building2 size={22} style={{ color: "var(--teal)" }} />,
  RefreshCw: <RefreshCw size={22} style={{ color: "var(--teal)" }} />,
}

export default function CorporateSection() {
  return (
    <section style={{ background: "var(--off-white)", padding: "5rem 0" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 2rem" }}>
        <div className="lg:flex" style={{ gap: "4rem", alignItems: "center" }}>
          {/* Left column */}
          <div style={{ flex: "1 1 50%" }}>
            <h2
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "clamp(1.75rem, 3vw, 2.5rem)",
                fontWeight: 800,
                color: "var(--midnight)",
                marginBottom: "1rem",
              }}
            >
              Moving your team internationally?
            </h2>
            <p
              style={{
                fontSize: "1rem",
                color: "var(--text-secondary)",
                lineHeight: 1.7,
                marginBottom: "2rem",
                maxWidth: "480px",
              }}
            >
              We manage staff relocations, work permits, and foreign subsidiary
              registration for companies expanding globally. Annual retainer.
              Dedicated account manager.
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
              Talk to our team →
            </a>
          </div>

          {/* Right column */}
          <div style={{ flex: "1 1 50%", marginTop: "2rem" }} className="lg:mt-0">
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              {features.map((feature) => (
                <div
                  key={feature.icon}
                  style={{
                    display: "flex",
                    gap: "1rem",
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: "50%",
                      background: "var(--teal-pale)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {iconMap[feature.icon]}
                  </div>
                  <p
                    style={{
                      fontSize: "0.9375rem",
                      color: "var(--text-secondary)",
                      lineHeight: 1.5,
                    }}
                  >
                    {feature.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
