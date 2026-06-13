"use client";

import { useState } from "react";

interface GuideCard {
  slug: string;
  title: string;
  subtitle: string | null;
  category: string;
  destination: string | null;
  reading_time_minutes: number;
  featured: boolean;
}

const categories: { value: string; label: string }[] = [
  { value: "all", label: "All guides" },
  { value: "visa_residency", label: "Visas & Residency" },
  { value: "company_registration", label: "Company Setup" },
  { value: "study_abroad", label: "Study Abroad" },
  { value: "work_abroad", label: "Work Abroad" },
  { value: "holiday_travel", label: "Holiday Travel" },
  { value: "citizenship", label: "Citizenship" },
  { value: "remote_work", label: "Remote Work" },
  { value: "trade_business", label: "Business & Trade" },
  { value: "financial_planning", label: "Financial Planning" },
];

const categoryLabels: Record<string, string> = {};
for (const c of categories) {
  categoryLabels[c.value] = c.label;
}

export default function GuidesList({ guides }: { guides: GuideCard[] }) {
  const [activeCategory, setActiveCategory] = useState("all");

  const filtered = activeCategory === "all"
    ? guides
    : guides.filter((g) => g.category === activeCategory);

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "2rem 1.5rem" }}>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 800, color: "var(--midnight)", marginBottom: "0.5rem" }}>
          Everything you need to know about relocating
        </h1>
        <p style={{ fontSize: "1rem", color: "var(--text-muted)", maxWidth: "600px" }}>
          Visa guides, cost breakdowns, and step-by-step resources for moving abroad.
        </p>
      </div>

      {/* Category filter pills */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "2rem" }}>
        {categories.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setActiveCategory(cat.value)}
            style={{
              padding: "0.375rem 0.875rem",
              borderRadius: "20px",
              border: activeCategory === cat.value ? "none" : "1px solid var(--border)",
              background: activeCategory === cat.value ? "var(--midnight)" : "white",
              color: activeCategory === cat.value ? "white" : "var(--text-secondary)",
              fontWeight: 600,
              fontSize: "0.8125rem",
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "background 0.15s, color 0.15s",
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Guide cards grid */}
      {filtered.length === 0 ? (
        <p style={{ color: "var(--text-muted)", fontSize: "0.9375rem" }}>No guides in this category yet.</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
          {filtered.map((guide) => (
            <a
              key={guide.slug}
              href={`/resources/${guide.slug}`}
              style={{ textDecoration: "none" }}
            >
              <div style={{ background: "white", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", padding: "1.5rem", cursor: "pointer", height: "100%", transition: "box-shadow 0.15s" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-md)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
              >
                {guide.featured && (
                  <span style={{ fontSize: "0.7rem", fontWeight: 700, background: "var(--teal-pale)", color: "var(--teal)", padding: "2px 8px", borderRadius: "20px", display: "inline-block", marginBottom: "0.75rem" }}>
                    Featured guide
                  </span>
                )}
                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.375rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {guide.destination || categoryLabels[guide.category] || guide.category}
                </p>
                <h3 style={{ fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', fontSize: "1rem", fontWeight: 700, color: "var(--midnight)", marginBottom: "0.5rem", lineHeight: 1.3 }}>
                  {guide.title}
                </h3>
                {guide.subtitle && (
                  <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginBottom: "0.75rem", lineHeight: 1.4 }}>
                    {guide.subtitle}
                  </p>
                )}
                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  {guide.reading_time_minutes} min read
                </p>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
