"use client";

import AnimatedCounter from "@/components/shared/AnimatedCounter";

const stats = [
  { value: 40, prefix: "", suffix: "+", label: "Destinations" },
  { value: 98, prefix: "", suffix: "%", label: "Service success rate" },
];

export default function StatsBar() {
  return (
    <section
      style={{
        background: "var(--off-white)",
        paddingTop: "5rem",
        paddingBottom: "3rem",
      }}
    >
      <div
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "0 2rem",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "2rem",
            textAlign: "center",
          }}
          className="md:grid-cols-4"
        >
          {stats.map((stat) => (
            <div key={stat.label}>
              <div
                style={{
                  fontSize: "2.25rem",
                  fontWeight: 800,
                  color: "var(--midnight)",
                  fontFamily:
                    "Cabinet Grotesk, Plus Jakarta Sans, sans-serif",
                  lineHeight: 1,
                }}
              >
                <AnimatedCounter
                  target={stat.value}
                  prefix={stat.prefix}
                  suffix={stat.suffix}
                />
              </div>
              <div
                style={{
                  fontSize: "0.875rem",
                  color: "var(--text-muted)",
                  marginTop: "0.5rem",
                }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
