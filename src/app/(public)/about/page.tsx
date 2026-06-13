import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Swiipt",
  description:
    "Swiipt helps Africans save toward global mobility goals, process visas and residency, and book travel — all in one platform.",
};

export default function AboutPage() {
  return (
    <div style={{ maxWidth: "760px", margin: "0 auto", padding: "3rem 1.5rem" }}>
      <h1
        style={{
          fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif",
          fontSize: "1.75rem",
          fontWeight: 800,
          color: "var(--midnight)",
          marginBottom: "1.5rem",
        }}
      >
        About Swiipt
      </h1>

      <section style={{ marginBottom: "2rem" }}>
        <h2
          style={{
            fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif",
            fontSize: "1.125rem",
            fontWeight: 700,
            color: "var(--midnight)",
            marginBottom: "0.75rem",
          }}
        >
          Our Mission
        </h2>
        <p style={{ fontSize: "0.9375rem", color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: "1rem" }}>
          Swiipt exists to make global mobility accessible for Africans. We believe
          that moving to another country — whether for work, study, or a new life —
          should not be held back by complicated financial logistics, opaque visa
          processes, or scattered planning. Swiipt brings everything into one
          platform so you can save, process, and book your way to your next destination.
        </p>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2
          style={{
            fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif",
            fontSize: "1.125rem",
            fontWeight: 700,
            color: "var(--midnight)",
            marginBottom: "0.75rem",
          }}
        >
          Our Story
        </h2>
        <p style={{ fontSize: "0.9375rem", color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: "1rem" }}>
          Swiipt was founded to solve a problem that millions of Africans face:
          the journey of relocating abroad is fragmented, expensive, and stressful.
          Our founders experienced this firsthand — from saving for visa fees in
          foreign currency to navigating government portals in unfamiliar languages
          to booking last-minute flights that fit an unpredictable timeline.
        </p>
        <p style={{ fontSize: "0.9375rem", color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: "1rem" }}>
          What started as a simple savings tool evolved into a full mobility
          platform. Today, Swiipt helps users save toward their goals in stable
          currencies, process visa applications, residency permits, and citizenship
          pathways, and book flights and holidays — all from a single account.
        </p>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2
          style={{
            fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif",
            fontSize: "1.125rem",
            fontWeight: 700,
            color: "var(--midnight)",
            marginBottom: "0.75rem",
          }}
        >
          What We Do
        </h2>
        <ul style={{ paddingLeft: "1.25rem", fontSize: "0.9375rem", color: "var(--text-secondary)", lineHeight: 1.7 }}>
          <li style={{ marginBottom: "0.5rem" }}>
            <strong>Goal-based savings:</strong> Save toward any destination, any
            visa, or any flight in stable foreign currencies.
          </li>
          <li style={{ marginBottom: "0.5rem" }}>
            <strong>Visa &amp; residency processing:</strong> Apply for visas,
            residency permits, and second citizenship programs with guided
            support.
          </li>
          <li style={{ marginBottom: "0.5rem" }}>
            <strong>Flight &amp; holiday booking:</strong> Book flights and holiday
            packages directly through the platform.
          </li>
          <li style={{ marginBottom: "0.5rem" }}>
            <strong>Immigration intelligence:</strong> Access guides, eligibility
            checks, and cost calculators to plan your move with confidence.
          </li>
        </ul>
      </section>

      <section>
        <h2
          style={{
            fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif",
            fontSize: "1.125rem",
            fontWeight: 700,
            color: "var(--midnight)",
            marginBottom: "0.75rem",
          }}
        >
          Contact Us
        </h2>
        <p style={{ fontSize: "0.9375rem", color: "var(--text-secondary)", lineHeight: 1.7 }}>
          Have questions or feedback? Reach out to us at{" "}
          <a href="mailto:support@swiipt.com" style={{ color: "var(--teal)", textDecoration: "underline" }}>
            support@swiipt.com
          </a>
          .
        </p>
      </section>
    </div>
  );
}
