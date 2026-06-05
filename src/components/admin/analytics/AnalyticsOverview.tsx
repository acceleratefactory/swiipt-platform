export default function AnalyticsOverview({
  totalUsers,
  usersWithDeposits,
  totalAUM,
  completedOrders,
  totalServiceRevenue,
  totalPenalties,
  totalReferrals,
}: {
  totalUsers: number;
  usersWithDeposits: number;
  totalAUM: number;
  completedOrders: number;
  totalServiceRevenue: number;
  totalPenalties: number;
  totalReferrals: number;
}) {
  const conversionRate = totalUsers > 0 ? Math.round((usersWithDeposits / totalUsers) * 100) : 0;

  const metrics = [
    { label: "Total users", value: totalUsers.toLocaleString(), color: "var(--midnight)" },
    { label: "Total AUM", value: `₦${(totalAUM as number).toLocaleString()}`, color: "var(--teal)" },
    { label: "Users with deposits", value: `${usersWithDeposits.toLocaleString()} (${conversionRate}%)` },
    { label: "Completed orders", value: completedOrders.toLocaleString() },
    { label: "Service revenue", value: `₦${totalServiceRevenue.toLocaleString()}`, color: "var(--teal)" },
    { label: "Total penalties", value: `₦${totalPenalties.toLocaleString()}`, color: "#F59E0B" },
    { label: "Total referrals", value: totalReferrals.toLocaleString() },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
      {metrics.map((m) => (
        <div
          key={m.label}
          style={{
            background: "white",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--border)",
            padding: "1.25rem",
          }}
        >
          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.375rem" }}>{m.label}</p>
          <p style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1.5rem", fontWeight: 800, color: m.color || "var(--midnight)" }}>
            {m.value}
          </p>
        </div>
      ))}
    </div>
  );
}
