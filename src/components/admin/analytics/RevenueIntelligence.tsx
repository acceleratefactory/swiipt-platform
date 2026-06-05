"use client";

export default function RevenueIntelligence({
  serviceOrders,
  penalties,
}: {
  serviceOrders: Array<{ final_price: number }>;
  penalties: Array<{ penalty_amount: number }>;
}) {
  const totalRevenue = serviceOrders.reduce((sum, o) => sum + Number(o.final_price), 0);
  const totalPenalties = penalties.reduce((sum, w) => sum + Number(w.penalty_amount), 0);

  return (
    <div style={{ background: "white", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", padding: "1.25rem", marginBottom: "1.5rem" }}>
      <h3 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "0.9375rem", fontWeight: 700, color: "var(--midnight)", marginBottom: "1rem" }}>
        Revenue intelligence
      </h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
        <div style={{ background: "var(--off-white)", borderRadius: "var(--radius-md)", padding: "1.25rem", textAlign: "center" }}>
          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>Service fee revenue</p>
          <p style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1.5rem", fontWeight: 800, color: "var(--teal)" }}>
            ₦{totalRevenue.toLocaleString()}
          </p>
          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{serviceOrders.length} completed orders</p>
        </div>
        <div style={{ background: "var(--off-white)", borderRadius: "var(--radius-md)", padding: "1.25rem", textAlign: "center" }}>
          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>Penalties collected</p>
          <p style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1.5rem", fontWeight: 800, color: "#F59E0B" }}>
            ₦{totalPenalties.toLocaleString()}
          </p>
          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{penalties.length} early exits</p>
        </div>
        <div style={{ background: "var(--off-white)", borderRadius: "var(--radius-md)", padding: "1.25rem", textAlign: "center" }}>
          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>Revenue per order</p>
          <p style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1.5rem", fontWeight: 800, color: "var(--midnight)" }}>
            ₦{serviceOrders.length > 0 ? Math.round(totalRevenue / serviceOrders.length).toLocaleString() : "0"}
          </p>
          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>average</p>
        </div>
      </div>
    </div>
  );
}
