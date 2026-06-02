"use client";

const packages = [
  {
    title: "5 Nights Maldives — All Inclusive",
    destination: "Maldives",
    flag: "🇲🇻",
    inclusions: ["Flights", "Hotel", "Transfers"],
    priceNGN: 450000,
    duration: "5 nights \u00B7 6 days",
    slots: 8,
    gradient: "linear-gradient(135deg, #00b4d8, #0077b6)",
    image: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=400&h=200&fit=crop",
    badge: "Best Seller",
  },
  {
    title: "4 Nights Dubai City Break",
    destination: "Dubai, UAE",
    flag: "🇦🇪",
    inclusions: ["Flights", "Hotel", "Visa"],
    priceNGN: 380000,
    duration: "4 nights \u00B7 5 days",
    slots: 12,
    gradient: "linear-gradient(135deg, #f7971e, #ffd200)",
    image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400&h=200&fit=crop",
    badge: null,
  },
  {
    title: "Cape Town Explorer \u2014 6 Nights",
    destination: "Cape Town, SA",
    flag: "🇿🇦",
    inclusions: ["Flights", "Hotel", "Tours"],
    priceNGN: 520000,
    duration: "6 nights \u00B7 7 days",
    slots: 6,
    gradient: "linear-gradient(135deg, #56ab2f, #a8e063)",
    image: "https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=400&h=200&fit=crop",
    badge: "6 spots left",
  },
  {
    title: "7 Nights London & Paris",
    destination: "UK & France",
    flag: "🇬🇧",
    inclusions: ["Flights", "Hotel", "Transfers", "Visa"],
    priceNGN: 890000,
    duration: "7 nights \u00B7 8 days",
    slots: 4,
    gradient: "linear-gradient(135deg, #2c3e50, #4ca1af)",
    image: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400&h=200&fit=crop",
    badge: "4 spots left",
  },
  {
    title: "3 Nights Doha Luxury Stay",
    destination: "Qatar",
    flag: "🇶🇦",
    inclusions: ["Flights", "Hotel"],
    priceNGN: 280000,
    duration: "3 nights \u00B7 4 days",
    slots: 15,
    gradient: "linear-gradient(135deg, #8B4513, #D4A017)",
    image: "https://images.unsplash.com/photo-1549927338-852005a24f69?w=400&h=200&fit=crop",
    badge: null,
  },
];

export default function HolidayPackages() {
  return (
    <section style={{ background: "white", padding: "5rem 0" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 2rem" }}>
        {/* Section header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "2rem",
          }}
        >
          <div>
            <h2
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: "clamp(1.75rem, 3vw, 2.5rem)",
                fontWeight: 800,
                color: "var(--midnight)",
              }}
            >
              Popular packages
            </h2>
            <p
              style={{
                color: "var(--text-muted)",
                fontSize: "1rem",
                marginTop: "0.5rem",
              }}
            >
              All-inclusive deals. Save in advance or book directly.
            </p>
          </div>
          <a
            href="/signup"
            style={{
              color: "var(--teal)",
              fontWeight: 600,
              fontSize: "0.875rem",
              whiteSpace: "nowrap",
              textDecoration: "none",
            }}
          >
            View all &rarr;
          </a>
        </div>

        {/* Horizontal scroll container */}
        <div
          className="hide-scrollbar"
          style={{
            display: "flex",
            gap: "1.25rem",
            overflowX: "auto",
            paddingBottom: "1rem",
          }}
        >
          {packages.map((pkg) => (
            <div
              key={pkg.title}
              style={{
                width: "280px",
                flexShrink: 0,
                borderRadius: "var(--radius-lg)",
                overflow: "hidden",
                border: "1px solid var(--border)",
                cursor: "pointer",
              }}
            >
              {/* Photo area */}
              <div
                style={{
                  height: "160px",
                  backgroundImage: `url(${pkg.image})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  backgroundColor: "#0d3d5c",
                  position: "relative",
                }}
              >
                {pkg.badge && (
                  <span
                    style={{
                      position: "absolute",
                      top: "0.75rem",
                      left: "0.75rem",
                      background: "var(--teal)",
                      color: "var(--midnight)",
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      padding: "4px 10px",
                      borderRadius: "20px",
                    }}
                  >
                    {pkg.badge}
                  </span>
                )}
                <div
                  style={{
                    position: "absolute",
                    bottom: "0.75rem",
                    left: "0.75rem",
                    display: "flex",
                    gap: "0.375rem",
                    flexWrap: "wrap",
                  }}
                >
                  {pkg.inclusions.map((inc) => (
                    <span
                      key={inc}
                      style={{
                        fontSize: "0.7rem",
                        background: "rgba(255,255,255,0.2)",
                        color: "white",
                        padding: "3px 8px",
                        borderRadius: "20px",
                        backdropFilter: "blur(4px)",
                      }}
                    >
                      {inc}
                    </span>
                  ))}
                </div>
              </div>

              {/* Card body */}
              <div style={{ padding: "1rem" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.375rem",
                    marginBottom: "0.5rem",
                  }}
                >
                  <span>{pkg.flag}</span>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--text-muted)",
                    }}
                  >
                    {pkg.destination}
                  </span>
                </div>
                <h3
                  style={{
                    fontSize: "0.9375rem",
                    fontWeight: 700,
                    color: "var(--midnight)",
                    marginBottom: "0.5rem",
                    lineHeight: 1.3,
                  }}
                >
                  {pkg.title}
                </h3>
                <p
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--text-muted)",
                    marginBottom: "0.75rem",
                  }}
                >
                  {pkg.duration}
                </p>

                {/* Price row */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "0.75rem",
                  }}
                >
                  <div>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--text-muted)",
                      }}
                    >
                      From{" "}
                    </span>
                    <span
                      style={{
                        fontSize: "1rem",
                        fontWeight: 700,
                        color: "var(--midnight)",
                      }}
                    >
                      ₦{pkg.priceNGN.toLocaleString()}
                    </span>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--text-muted)",
                      }}
                    >
                      {" "}/person
                    </span>
                  </div>
                  {pkg.slots <= 8 && (
                    <span
                      style={{
                        fontSize: "0.7rem",
                        color: "var(--warning)",
                        fontWeight: 600,
                      }}
                    >
                      {pkg.slots} spots left
                    </span>
                  )}
                </div>

                {/* Buttons */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "0.5rem",
                  }}
                >
                  <button
                    onClick={() => (window.location.href = "/signup")}
                    style={{
                      padding: "0.625rem",
                      background: "var(--teal-pale)",
                      color: "var(--teal)",
                      fontWeight: 600,
                      fontSize: "0.8125rem",
                      borderRadius: "var(--radius-sm)",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    Save toward this
                  </button>
                  <button
                    onClick={() => (window.location.href = "/signup")}
                    style={{
                      padding: "0.625rem",
                      background: "var(--midnight)",
                      color: "white",
                      fontWeight: 600,
                      fontSize: "0.8125rem",
                      borderRadius: "var(--radius-sm)",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    Book directly
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
