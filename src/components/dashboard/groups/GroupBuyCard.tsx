"use client";

interface GroupBuyCardProps {
  group: {
    id: string;
    title: string;
    item_type: string;
    current_size: number;
    target_size: number;
    status: string;
    group_price_ngn: number;
    created_at: string;
    expires_at: string;
  };
  role: string;
}

const statusColors: Record<string, string> = {
  open: "#0D9488",
  filled: "#2563EB",
  expired: "#6B7280",
  completed: "#059669",
  cancelled: "#EF4444",
};

const statusLabels: Record<string, string> = {
  open: "Active",
  filled: "Ready to pay",
  expired: "Expired",
  completed: "Completed",
  cancelled: "Cancelled",
};

export default function GroupBuyCard({ group, role }: GroupBuyCardProps) {
  const progressPct = Math.round((group.current_size / group.target_size) * 100);
  const spotsLeft = group.target_size - group.current_size;

  return (
    <a
      href={`/dashboard/groups/${group.id}`}
      style={{ textDecoration: "none", display: "block" }}
    >
      <div style={{
        background: "white",
        borderRadius: "var(--radius-lg)",
        border: "1px solid var(--border)",
        padding: "1.25rem",
        transition: "box-shadow 0.15s",
        cursor: "pointer",
      }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-md)"}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = "none"}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1rem", fontWeight: 700, color: "var(--midnight)", marginBottom: "0.25rem" }}>
              {group.title}
            </h3>
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
              {group.item_type === "holiday_package" ? "🏖️ Holiday" : "🔧 Service"} · {role === "creator" ? "Organizer" : "Member"}
            </p>
          </div>
          <span style={{
            padding: "3px 10px",
            borderRadius: "20px",
            fontSize: "0.7rem",
            fontWeight: 700,
            background: `${statusColors[group.status]}15`,
            color: statusColors[group.status],
            whiteSpace: "nowrap",
          }}>
            {statusLabels[group.status] || group.status}
          </span>
        </div>

        <div style={{ marginBottom: "0.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
            <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>Members</span>
            <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--midnight)" }}>{group.current_size} / {group.target_size}</span>
          </div>
          <div style={{ height: 6, background: "var(--gray-200)", borderRadius: 4, overflow: "hidden" }}>
            <div style={{ height: "100%", background: "var(--teal)", borderRadius: 4, width: `${progressPct}%` }} />
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
            {group.status === "open" && `${spotsLeft} spot${spotsLeft !== 1 ? "s" : ""} remaining`}
            {group.status === "filled" && "⏳ Awaiting payment"}
            {group.status === "expired" && "⌛ Group expired"}
            {group.status === "completed" && "✅ All paid"}
          </span>
          {group.status === "open" && (
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
              Expires {new Date(group.expires_at).toLocaleDateString()}
            </span>
          )}
          {group.status === "filled" && (
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--teal)" }}>
              ₦{group.group_price_ngn?.toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </a>
  );
}
