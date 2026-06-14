import dynamic from "next/dynamic";

const FlightSearchWidget = dynamic(() => import("./FlightSearchWidget"), { ssr: false });

const stats = [
  { value: "40+", label: "Destinations" },
  { value: "98%", label: "Success rate" },
];

export default function Hero() {
  return (
    <section
      style={{
        background: "var(--midnight)",
        position: "relative",
        overflow: "hidden",
        minHeight: "560px",
      }}
      className="lg:min-h-[620px]"
    >
      <div
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "6rem 2rem",
        }}
        className="lg:py-32"
      >
        <div
          style={{
            display: "grid",
            gap: "4rem",
            alignItems: "center",
          }}
          className="lg:grid-cols-2"
        >
          {/* LEFT COLUMN */}
          <div>
            {/* Eyebrow */}
            <p
              style={{
                color: "var(--teal)",
                fontSize: "12px",
                fontWeight: 600,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                marginBottom: "1rem",
              }}
            >
              SAVE · MOVE · ARRIVE
            </p>

            {/* Headline */}
            <h1
              style={{
                fontFamily: 'var(--font-heading, "Plus Jakarta Sans")',
                fontSize: "clamp(2.5rem, 5vw, 3.75rem)",
                fontWeight: 800,
                color: "white",
                lineHeight: 1.1,
                marginBottom: "1.5rem",
              }}
            >
              Your money moves
              <br />
              you to the world.
            </h1>

            {/* Body */}
            <p
              style={{
                fontSize: "1.125rem",
                color: "var(--gray-300)",
                lineHeight: 1.6,
                marginBottom: "2rem",
                maxWidth: "480px",
              }}
            >
              Save toward any destination. Book flights and holidays. Process
              visas, residency and citizenship. One platform.
            </p>

            {/* Stats row */}
            <div
              style={{
                display: "flex",
                gap: "2rem",
                flexWrap: "wrap",
                marginBottom: "2.5rem",
              }}
            >
              {stats.map((stat) => (
                <div key={stat.label}>
                  <div
                    style={{
                      color: "white",
                      fontSize: "1.25rem",
                      fontWeight: 700,
                    }}
                  >
                    {stat.value}
                  </div>
                  <div
                    style={{
                      color: "var(--gray-500)",
                      fontSize: "0.75rem",
                    }}
                  >
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Flight Search Widget */}
            <FlightSearchWidget />
          </div>

          {/* RIGHT COLUMN — Floating cards (hidden on mobile) */}
          <div
            style={{ position: "relative" }}
            className="hidden lg:block"
          >
            {/* Card 1 — top */}
            <div
              className="float-card-1"
              style={{
                background: "var(--teal-pale)",
                borderRadius: "var(--radius-lg)",
                padding: "1rem 1.25rem",
                width: "280px",
                position: "absolute",
                top: "-40px",
                right: "20px",
                transform: "rotate(-2deg)",
                boxShadow: "var(--shadow-lg)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: "var(--teal)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontWeight: 700,
                    fontSize: "14px",
                  }}
                >
                  ✓
                </div>
                <div>
                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "var(--midnight)",
                    }}
                  >
                    Ahmed unlocked UAE residency
                  </div>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "var(--text-muted)",
                    }}
                  >
                    2 hours ago
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2 — middle */}
            <div
              className="float-card-2"
              style={{
                background: "white",
                borderRadius: "var(--radius-lg)",
                padding: "1rem 1.25rem",
                width: "260px",
                position: "absolute",
                top: "80px",
                right: "180px",
                boxShadow: "var(--shadow-lg)",
              }}
            >
              <div
                style={{
                  fontSize: "12px",
                  color: "var(--text-muted)",
                  marginBottom: "0.5rem",
                }}
              >
                Maldives Holiday Fund
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <svg width="80" height="80" viewBox="0 0 80 80">
                  <circle
                    cx="40"
                    cy="40"
                    r="30"
                    fill="none"
                    stroke="var(--gray-100)"
                    strokeWidth="6"
                  />
                  <circle
                    cx="40"
                    cy="40"
                    r="30"
                    fill="none"
                    stroke="var(--teal)"
                    strokeWidth="6"
                    strokeDasharray="188.5"
                    strokeDashoffset="41.47"
                    strokeLinecap="round"
                    transform="rotate(-90 40 40)"
                  />
                  <text
                    x="40"
                    y="45"
                    textAnchor="middle"
                    fontSize="14"
                    fontWeight="700"
                    fill="var(--midnight)"
                  >
                    78%
                  </text>
                </svg>
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "var(--midnight)",
                  }}
                >
                  78% funded
                </div>
              </div>
            </div>

            {/* Card 3 — bottom right */}
            <div
              className="float-card-3"
              style={{
                background: "var(--midnight-light)",
                borderRadius: "var(--radius-lg)",
                padding: "1rem 1.25rem",
                width: "240px",
                position: "absolute",
                top: "200px",
                right: "40px",
                boxShadow: "var(--shadow-lg)",
              }}
            >
              <div style={{ fontSize: "12px", color: "var(--gray-300)" }}>
                Reward credited
              </div>
              <div
                style={{
                  fontSize: "18px",
                  fontWeight: 700,
                  color: "var(--teal)",
                  marginTop: "0.25rem",
                }}
              >
                QAR 2,400
              </div>
              <div style={{ fontSize: "11px", color: "var(--gray-500)" }}>
                Converted to travel credit
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
