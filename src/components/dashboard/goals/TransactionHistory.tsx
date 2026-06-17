interface Deposit {
  id: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
  payment_reference: string;
  admin_confirmed_at: string | null;
}

interface Gift {
  id: string;
  giver_id: string;
  amount: number;
  currency: string;
  created_at: string;
  giver?: { full_name: string } | null;
  recipient?: { full_name: string } | null;
}

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  confirmed: { label: "Confirmed", color: "var(--teal)", bg: "var(--teal-pale)" },
  pending: { label: "Pending review", color: "#B45309", bg: "#FEF3C7" },
  rejected: { label: "Rejected", color: "var(--danger)", bg: "#FEF2F2" },
  expired: { label: "Expired — not confirmed", color: "#6B7280", bg: "#F3F4F6" },
  completed: { label: "Completed", color: "var(--teal)", bg: "var(--teal-pale)" },
};

export default function TransactionHistory({
  deposits,
  gifts,
  goalCurrency: _goalCurrency,
  userId,
}: {
  deposits: Deposit[];
  gifts: Gift[];
  goalCurrency: string;
  userId: string;
}) {
  const allTransactions = [
    ...deposits.map((d) => ({
      id: d.id,
      type: "deposit" as const,
      amount: d.amount,
      currency: d.currency,
      status: d.status,
      date: d.created_at,
      reference: d.payment_reference,
      confirmedAt: d.admin_confirmed_at,
      fromTo: null as string | null,
    })),
    ...gifts.map((g) => ({
      id: g.id,
      type: (g.giver_id === userId ? "gift_sent" : "gift_received") as "gift_sent" | "gift_received",
      amount: g.amount,
      currency: g.currency,
      status: "completed" as const,
      date: g.created_at,
      reference: null as string | null,
      confirmedAt: g.created_at,
      fromTo: g.giver?.full_name || g.recipient?.full_name || null,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div
      style={{
        background: "white",
        borderRadius: "var(--radius-lg)",
        border: "1px solid var(--border)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "1rem 1.25rem",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <h3
          style={{
            fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif",
            fontSize: "1rem",
            fontWeight: 700,
            color: "var(--midnight)",
          }}
        >
          Transaction history
        </h3>
      </div>

      {allTransactions.length === 0 ? (
        <div style={{ padding: "2rem", textAlign: "center" }}>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
            No transactions yet. Make your first deposit.
          </p>
        </div>
      ) : (
        allTransactions.map((tx) => {
          const status =
            statusConfig[tx.status] || {
              label: tx.status,
              color: "var(--text-muted)",
              bg: "var(--gray-100)",
            };
          const isGiftReceived = tx.type === "gift_received";
          return (
            <div
              key={tx.id}
              style={{
                padding: "1rem 1.25rem",
                borderBottom: "1px solid var(--gray-100)",
                display: "flex",
                alignItems: "center",
                gap: "1rem",
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: isGiftReceived ? "#EDE9FE" : "var(--teal-pale)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1rem",
                  flexShrink: 0,
                }}
              >
                {tx.type === "deposit" ? "↓" : "🎁"}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    color: "var(--midnight)",
                  }}
                >
                  {tx.type === "deposit"
                    ? "Deposit"
                    : tx.type === "gift_sent"
                      ? "Gift sent"
                      : "Gift received"}
                  {tx.fromTo && (
                    <span
                      style={{
                        fontWeight: 400,
                        color: "var(--text-muted)",
                      }}
                    >
                      {" "}
                      · {tx.fromTo}
                    </span>
                  )}
                </p>
                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  {new Date(tx.date).toLocaleDateString("en-NG", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  {tx.reference && <span> · {tx.reference}</span>}
                </p>
              </div>

              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <p
                  style={{
                    fontSize: "0.9375rem",
                    fontWeight: 700,
                    color: isGiftReceived ? "#6D28D9" : "var(--midnight)",
                  }}
                >
                  + {tx.currency} {tx.amount.toLocaleString()}
                </p>
                <span
                  style={{
                    fontSize: "0.7rem",
                    fontWeight: 600,
                    padding: "2px 7px",
                    borderRadius: "20px",
                    background: status.bg,
                    color: status.color,
                  }}
                >
                  {status.label}
                </span>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
