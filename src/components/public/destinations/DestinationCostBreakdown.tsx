export default function DestinationCostBreakdown({ costs }: { costs: any }) {
  const formatNGN = (amount: number) =>
    `₦${amount.toLocaleString()}`;

  const items: Array<{ label: string; value: string }> = [];

  if (costs.service_fee) items.push({ label: "Service fee", value: formatNGN(costs.service_fee) });
  if (costs.government_fee) items.push({ label: "Government fee", value: formatNGN(costs.government_fee) });
  if (costs.medical_fee) items.push({ label: "Medical fee", value: formatNGN(costs.medical_fee) });
  if (costs.language_test) items.push({ label: "Language test", value: formatNGN(costs.language_test) });
  if (costs.eca_fee) items.push({ label: "ECA fee", value: formatNGN(costs.eca_fee) });
  if (costs.tb_test) items.push({ label: "TB test", value: formatNGN(costs.tb_test) });
  if (costs.health_insurance) items.push({ label: "Health insurance", value: formatNGN(costs.health_insurance) });
  if (costs.travel_estimate) items.push({ label: "Travel estimate", value: formatNGN(costs.travel_estimate) });
  if (costs.first_month_setup) items.push({ label: "First month setup", value: formatNGN(costs.first_month_setup) });
  if (costs.uk_service_fee) items.push({ label: "UK company fee", value: formatNGN(costs.uk_service_fee) });
  if (costs.us_service_fee) items.push({ label: "US company fee", value: formatNGN(costs.us_service_fee) });
  if (costs.uae_service_fee) items.push({ label: "UAE company fee", value: formatNGN(costs.uae_service_fee) });
  if (costs.government_fee_note) items.push({ label: "Government fee", value: costs.government_fee_note });

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
        Cost breakdown
      </h2>
      <div
        style={{
          background: "white",
          borderRadius: "var(--radius-lg)",
          border: "1px solid var(--border)",
          overflow: "hidden",
        }}
      >
        {items.map((item, idx) => (
          <div
            key={idx}
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "1rem 1.25rem",
              borderBottom: idx < items.length - 1 ? "1px solid var(--border)" : "none",
              background: "var(--off-white)",
            }}
          >
            <span style={{ fontSize: "0.9375rem", color: "var(--text-secondary)" }}>{item.label}</span>
            <span style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--midnight)" }}>{item.value}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
