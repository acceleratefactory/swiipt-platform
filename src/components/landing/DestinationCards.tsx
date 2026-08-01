const destinations = [
  { name: "Dubai", country: "UAE", flag: "🇦🇪", savers: "2,400", topGoal: "Residency", gradient: "linear-gradient(135deg, #1a6b9e, #0d3d5c)", image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400&h=220&fit=crop" },
  { name: "London", country: "UK", flag: "🇬🇧", savers: "1,890", topGoal: "Work Visa", gradient: "linear-gradient(135deg, #2c3e50, #3498db)", image: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400&h=220&fit=crop" },
  { name: "Toronto", country: "Canada", flag: "🇨🇦", savers: "1,650", topGoal: "PR Pathway", gradient: "linear-gradient(135deg, #c0392b, #8e44ad)", image: "https://picsum.photos/seed/toronto-skyline/400/220" },
  { name: "Maldives", country: "Maldives", flag: "🇲🇻", savers: "980", topGoal: "Holiday", gradient: "linear-gradient(135deg, #00b4d8, #0077b6)", image: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=400&h=220&fit=crop" },
  { name: "Doha", country: "Qatar", flag: "🇶🇦", savers: "870", topGoal: "Work Visa", gradient: "linear-gradient(135deg, #8B4513, #D4A017)", image: "https://images.unsplash.com/photo-1578895101408-1a36b834405b?w=400&h=220&fit=crop" },
  { name: "Lisbon", country: "Portugal", flag: "🇵🇹", savers: "720", topGoal: "Remote Work Visa", gradient: "linear-gradient(135deg, #e74c3c, #f39c12)", image: "https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=400&h=220&fit=crop" },
  { name: "Cape Town", country: "South Africa", flag: "🇿🇦", savers: "540", topGoal: "Holiday", gradient: "linear-gradient(135deg, #27ae60, #2980b9)", image: "https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=400&h=220&fit=crop" },
  { name: "Tbilisi", country: "Georgia", flag: "🇬🇪", savers: "430", topGoal: "Remote Work Visa", gradient: "linear-gradient(135deg, #e67e22, #d35400)", image: "https://images.unsplash.com/photo-1695018128519-bced2bac1b71?w=400&h=220&fit=crop" },
  { name: "St Kitts", country: "Caribbean", flag: "🇰🇳", savers: "210", topGoal: "2nd Citizenship", gradient: "linear-gradient(135deg, #1abc9c, #16a085)", image: "https://images.unsplash.com/photo-1548574505-5e239809ee19?w=400&h=220&fit=crop" },
];

export default function DestinationCards() {
  return (
    <section style={{ background: "var(--midnight)", padding: "5rem 0" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 2rem" }}>
        {/* Section header */}
        <h2
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: "clamp(1.75rem, 3vw, 2.5rem)",
            fontWeight: 800,
            color: "white",
            marginBottom: "0.75rem",
          }}
        >
          Where are people going?
        </h2>
        <p
          style={{
            color: "var(--gray-300)",
            fontSize: "1rem",
            marginBottom: "2.5rem",
          }}
        >
          Most saved-toward destinations on the platform this month.
        </p>

        {/* Card grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {destinations.map((dest) => (
            <div
              key={dest.name}
              className="destination-card"
              style={{
                height: "220px",
                position: "relative",
                overflow: "hidden",
                borderRadius: "var(--radius-lg)",
                cursor: "pointer",
              }}
            >
              {/* Photo with gradient overlay */}
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  backgroundImage: `url(${dest.image})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  backgroundColor: "#0d3d5c",
                }}
              />

              {/* Dark navy overlay */}
              <div
                className="destination-overlay"
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(to top, rgba(6,17,43,0.9) 0%, rgba(6,17,43,0.3) 50%, transparent 100%)",
                }}
              />

              {/* Content at bottom */}
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  padding: "1.25rem",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    marginBottom: "0.25rem",
                  }}
                >
                  <span style={{ fontSize: "1.25rem" }}>{dest.flag}</span>
                  <span
                    style={{
                      color: "white",
                      fontSize: "1.125rem",
                      fontWeight: 700,
                    }}
                  >
                    {dest.name}
                  </span>
                  <span
                    style={{
                      color: "var(--gray-300)",
                      fontSize: "0.875rem",
                    }}
                  >
                    {dest.country}
                  </span>
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      background: "rgba(0,200,150,0.2)",
                      color: "var(--teal)",
                      padding: "2px 8px",
                      borderRadius: "20px",
                      border: "1px solid rgba(0,200,150,0.3)",
                    }}
                  >
                    {dest.topGoal}
                  </span>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--gray-300)",
                    }}
                  >
                    {dest.savers} saving
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
