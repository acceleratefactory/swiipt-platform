export default function DestinationFAQ({ faqs }: { faqs: Array<{ q: string; a: string }> }) {
  return (
    <section style={{ padding: "0 0 3rem" }}>
      <h2
        style={{
          fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif",
          fontSize: "1.5rem",
          fontWeight: 800,
          color: "var(--midnight)",
          marginBottom: "1.25rem",
        }}
      >
        Frequently asked questions
      </h2>
      <div style={{ display: "grid", gap: "0.75rem" }}>
        {faqs.map((faq, idx) => (
          <details
            key={idx}
            style={{
              background: "var(--off-white)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border)",
              overflow: "hidden",
            }}
          >
            <summary
              style={{
                padding: "1rem 1.25rem",
                fontWeight: 600,
                fontSize: "0.9375rem",
                color: "var(--midnight)",
                cursor: "pointer",
              }}
            >
              {faq.q}
            </summary>
            <div style={{ padding: "0 1.25rem 1rem", fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
              {faq.a}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
