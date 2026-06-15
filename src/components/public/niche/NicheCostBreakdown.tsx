export default function NicheCostBreakdown({ config }: { config: any }) {
  const total = (config.service_fee_ngn || 0) + (config.government_fee_ngn || 0) + (config.document_prep_ngn || 0) + (config.travel_estimate_ngn || 0) + (config.first_month_setup_ngn || 0);
  const items = [
    { label: "Swiipt service fee", value: config.service_fee_ngn },
    { label: "Government fees", value: config.government_fee_ngn },
    { label: "Document preparation", value: config.document_prep_ngn },
    { label: "Travel estimate", value: config.travel_estimate_ngn },
    { label: "First month setup", value: config.first_month_setup_ngn },
  ].filter(i => i.value > 0);

  return (
    <section style={{ padding: "4rem 0", background: "var(--off-white)" }}>
      <div style={{ maxWidth: "760px", margin: "0 auto", padding: "0 2rem" }}>
        <h2 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1.625rem", fontWeight: 800, color: "var(--midnight)", marginBottom: "0.5rem", textAlign: "center" }}>
          How much does it actually cost?
        </h2>
        <p style={{ color: "var(--text-muted)", textAlign: "center", marginBottom: "2rem", fontSize: "0.9375rem" }}>
          For one person. No hidden extras. No surprises.
        </p>
        <div style={{ background: "white", borderRadius: "var(--radius-xl)", border: "1px solid var(--border)", overflow: "hidden" }}>
          {items.map((item, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "1rem 1.5rem", borderBottom: "1px solid var(--gray-100)" }}>
              <span style={{ fontSize: "0.9375rem", color: "var(--text-secondary)" }}>{item.label}</span>
              <span style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--midnight)" }}>&#8358;{item.value.toLocaleString()}</span>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "1.25rem 1.5rem", background: "var(--midnight)" }}>
            <span style={{ fontSize: "1rem", fontWeight: 700, color: "white" }}>Total estimate</span>
            <span style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--teal)" }}>&#8358;{total.toLocaleString()}</span>
          </div>
        </div>
        {config.processing_weeks_min > 0 && (
          <p style={{ textAlign: "center", marginTop: "1rem", fontSize: "0.875rem", color: "var(--text-muted)" }}>
            Processing time: {config.processing_weeks_min}&ndash;{config.processing_weeks_max} weeks &middot; Success rate: {config.success_rate}%
          </p>
        )}
        <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
          <a href="/signup" style={{ padding: "0.875rem 2rem", background: "var(--teal)", color: "var(--midnight)", fontWeight: 700, fontSize: "0.9375rem", borderRadius: "var(--radius-md)", textDecoration: "none" }}>
            Start saving toward this &rarr;
          </a>
        </div>
      </div>
    </section>
  );
}
