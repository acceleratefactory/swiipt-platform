// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function WalletSummary({ wallet, totalDeposited, totalWithdrawn, totalPenalties }: { wallet: any; totalDeposited: number; totalWithdrawn: number; totalPenalties: number; preferredCurrency: string }) {
  const stats = [
    { label: "Total ever deposited", value: `₦${totalDeposited.toLocaleString()}`, color: "var(--teal)" },
    { label: "Total withdrawn", value: `₦${totalWithdrawn.toLocaleString()}`, color: "var(--midnight)" },
    { label: "Total penalties paid", value: `₦${totalPenalties.toLocaleString()}`, color: totalPenalties > 0 ? "var(--danger)" : "var(--text-muted)" },
    { label: "Current available", value: `₦${(wallet?.balance_ngn || 0).toLocaleString()}`, color: "var(--midnight)" },
    { label: "Currently locked", value: `₦${(wallet?.total_locked_ngn || 0).toLocaleString()}`, color: "#B45309" },
    { label: "Service credits", value: `₦${(wallet?.total_credits_ngn || 0).toLocaleString()}`, color: "#6D28D9" },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "0.75rem", marginBottom: "1.5rem" }}>
      {stats.map(s => (
        <div key={s.label} style={{ background: "white", borderRadius: "var(--radius-md)", padding: "1rem", border: "1px solid var(--border)" }}>
          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.375rem" }}>{s.label}</p>
          <p style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1.25rem", fontWeight: 800, color: s.color }}>{s.value}</p>
        </div>
      ))}
    </div>
  );
}
