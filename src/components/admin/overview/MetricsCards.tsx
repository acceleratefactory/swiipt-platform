interface MetricsCardsProps {
  totalUsers: number;
  pendingDeposits: number;
  pendingVisaConfirmations: number;
  activeGoals: number;
  activeOrders: number;
  pendingWithdrawals: number;
  pendingDocuments: number;
  totalAUM: number;
}

export default function MetricsCards({
  totalUsers,
  pendingDeposits,
  pendingVisaConfirmations,
  activeGoals,
  activeOrders,
  pendingWithdrawals,
  pendingDocuments,
  totalAUM,
}: MetricsCardsProps) {
  const metrics = [
    { label: "Total users", value: totalUsers.toLocaleString(), color: 'var(--midnight)', urgent: false },
    { label: "Pending deposits", value: pendingDeposits.toLocaleString(), color: pendingDeposits > 0 ? 'var(--danger)' : 'var(--midnight)', urgent: pendingDeposits > 0, link: "/admin/deposits" },
    { label: "Pending visa confirmations", value: pendingVisaConfirmations.toLocaleString(), color: pendingVisaConfirmations > 0 ? '#B45309' : 'var(--midnight)', urgent: pendingVisaConfirmations > 0, link: "/admin/visa-redemptions" },
    { label: "Active goals", value: activeGoals.toLocaleString(), color: 'var(--midnight)', urgent: false },
    { label: "Total AUM (NGN)", value: `₦${(totalAUM / 1000000).toFixed(1)}M`, color: 'var(--teal)', urgent: false },
    { label: "Open orders", value: activeOrders.toLocaleString(), color: 'var(--midnight)', urgent: false, link: "/admin/orders" },
    { label: "Pending withdrawals", value: pendingWithdrawals.toLocaleString(), color: pendingWithdrawals > 0 ? '#B45309' : 'var(--midnight)', urgent: pendingWithdrawals > 0, link: "/admin/withdrawals" },
    { label: "Docs to review", value: pendingDocuments.toLocaleString(), color: pendingDocuments > 0 ? '#B45309' : 'var(--midnight)', urgent: pendingDocuments > 0, link: "/admin/documents" },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
      {metrics.map(m => (
        <a
          key={m.label}
          href={m.link || "#"}
          style={{ textDecoration: 'none' }}
        >
          <div style={{
            background: 'white',
            borderRadius: 'var(--radius-md)',
            padding: '1rem',
            border: m.urgent ? `1px solid ${m.color}` : '1px solid var(--border)',
            cursor: m.link ? 'pointer' : 'default',
          }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.375rem' }}>{m.label}</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 800, color: m.color, fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', lineHeight: 1 }}>
              {m.value}
            </p>
            {m.urgent && (
              <p style={{ fontSize: '0.7rem', color: m.color, fontWeight: 600, marginTop: '0.375rem' }}>
                Needs attention →
              </p>
            )}
          </div>
        </a>
      ))}
    </div>
  );
}
