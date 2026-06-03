import { ChevronRight } from "lucide-react";

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  initiated: { label: "Initiated", color: "#6B7280", bg: "#F3F4F6" },
  payment_pending: { label: "Payment pending", color: "#B45309", bg: "#FEF3C7" },
  payment_confirmed: { label: "Payment confirmed", color: "#065F46", bg: "var(--teal-pale)" },
  documents_requested: { label: "Documents needed", color: "#B45309", bg: "#FEF3C7" },
  documents_received: { label: "Docs received", color: "#1D4ED8", bg: "#DBEAFE" },
  in_progress: { label: "In progress", color: "#1D4ED8", bg: "#DBEAFE" },
  awaiting_approval: { label: "Awaiting approval", color: "#6D28D9", bg: "#EDE9FE" },
  approved: { label: "Approved ✓", color: "#065F46", bg: "var(--teal-pale)" },
};

export default function ActiveOrders({
  orders,
}: {
  orders: Array<{
    id: string;
    status: string;
    service_packages: { name: string; category: string; destination: string } | null;
  }>;
}) {
  return (
    <div style={{ marginBottom: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--midnight)", fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif" }}>
          Active applications
        </h2>
        <a href="/dashboard/services" style={{ fontSize: "0.8125rem", color: "var(--teal)", fontWeight: 600, textDecoration: "none" }}>
          View all →
        </a>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {orders.map((order) => {
          const status = statusConfig[order.status] || { label: order.status, color: "#6B7280", bg: "#F3F4F6" };
          return (
            <a key={order.id} href="/dashboard/services" style={{ textDecoration: "none" }}>
              <div style={{ background: "white", borderRadius: "var(--radius-lg)", padding: "1rem 1.25rem", border: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "1rem" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--midnight)", marginBottom: "0.25rem" }}>
                    {order.service_packages?.name || "Service Application"}
                  </p>
                  <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                    {order.service_packages?.destination}
                  </p>
                </div>
                <span style={{ fontSize: "0.75rem", fontWeight: 600, padding: "4px 10px", borderRadius: "20px", background: status.bg, color: status.color, whiteSpace: "nowrap" }}>
                  {status.label}
                </span>
                <ChevronRight size={16} style={{ color: "var(--gray-300)", flexShrink: 0 }} />
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
