const cards = [
  {
    icon: "Target",
    title: "Save toward any goal",
    body: "Set a savings goal for any destination. Lock funds for milestone rewards. Flexible or fixed terms — you choose.",
    tag: "Flexible or locked savings",
    href: "/signup",
  },
  {
    icon: "Plane",
    title: "Book flights",
    body: "Search 500+ airlines. Save toward your flight costs in advance or pay directly. Itinerary saved to your dashboard.",
    tag: "500+ airlines",
    href: "/signup",
  },
  {
    icon: "Umbrella",
    title: "Holiday packages",
    body: "Curated all-inclusive packages. Maldives, Dubai, Cape Town, London. Save in advance or book directly.",
    tag: "40+ destinations",
    href: "/signup",
  },
  {
    icon: "BookOpen",
    title: "Visa & Residency",
    body: "Work visas, residency permits, remote work visas. Fixed pricing. Defined timelines. Full application management.",
    tag: "UAE · Canada · UK · Qatar · Portugal",
    href: "/signup",
  },
  {
    icon: "Globe",
    title: "2nd Citizenship & Company Setup",
    body: "Citizenship by investment programs and company registration in UK, UAE, USA. Receive international payments legally.",
    tag: "Premium services",
    href: "/signup",
  },
  {
    icon: "Building2",
    title: "Corporate Mobility",
    body: "Staff relocation, permit management, and foreign subsidiary registration for companies expanding globally.",
    tag: "Annual retainer",
    href: "/signup",
  },
];

import { Target, Plane, Umbrella, BookOpen, Globe, Building2 } from "lucide-react";

const iconMap: Record<string, React.ReactNode> = {
  Target: <Target size={24} style={{ color: "var(--teal)" }} />,
  Plane: <Plane size={24} style={{ color: "var(--teal)" }} />,
  Umbrella: <Umbrella size={24} style={{ color: "var(--teal)" }} />,
  BookOpen: <BookOpen size={24} style={{ color: "var(--teal)" }} />,
  Globe: <Globe size={24} style={{ color: "var(--teal)" }} />,
  Building2: <Building2 size={24} style={{ color: "var(--teal)" }} />,
};

export default function ProductCards() {
  return (
    <section style={{ background: "white", padding: "5rem 0" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 2rem" }}>
        {/* Section header */}
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <h2
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: "clamp(1.75rem, 3vw, 2.5rem)",
              fontWeight: 800,
              color: "var(--midnight)",
              marginBottom: "1rem",
            }}
          >
            One platform. Every move.
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
            From a weekend getaway to a new life abroad — Swiipt handles every
            part of the journey.
          </p>
        </div>

        {/* Card grid: 3 columns desktop, 1 column mobile */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cards.map((card) => (
            <a
              key={card.title}
              href={card.href}
              className="product-card"
              style={{
                background: "var(--off-white)",
                borderRadius: "var(--radius-lg)",
                padding: "2rem",
                border: "1px solid var(--border)",
                cursor: "pointer",
                textDecoration: "none",
                display: "block",
              }}
            >
              {/* Icon container */}
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "var(--radius-md)",
                  background: "var(--teal-pale)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "1.25rem",
                }}
              >
                {iconMap[card.icon]}
              </div>

              {/* Title */}
              <h3
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: "1.125rem",
                  fontWeight: 700,
                  color: "var(--midnight)",
                  marginBottom: "0.75rem",
                }}
              >
                {card.title}
              </h3>

              {/* Body */}
              <p
                style={{
                  fontSize: "0.875rem",
                  color: "var(--text-secondary)",
                  lineHeight: 1.6,
                  marginBottom: "1rem",
                }}
              >
                {card.body}
              </p>

              {/* Tag */}
              <span
                style={{
                  fontSize: "0.75rem",
                  color: "var(--teal)",
                  fontWeight: 600,
                  background: "var(--teal-pale)",
                  padding: "4px 10px",
                  borderRadius: "20px",
                  display: "inline-block",
                }}
              >
                {card.tag}
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
