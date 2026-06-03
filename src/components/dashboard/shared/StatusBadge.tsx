const defaultStatusConfig: Record<string, { label: string; color: string; bg: string }> = {
  initiated: { label: "Initiated", color: "#6B7280", bg: "#F3F4F6" },
  payment_pending: { label: "Payment pending", color: "#B45309", bg: "#FEF3C7" },
  payment_confirmed: { label: "Payment confirmed", color: "#065F46", bg: "var(--teal-pale)" },
  documents_requested: { label: "Documents needed", color: "#B45309", bg: "#FEF3C7" },
  documents_received: { label: "Docs received", color: "#1D4ED8", bg: "#DBEAFE" },
  in_progress: { label: "In progress", color: "#1D4ED8", bg: "#DBEAFE" },
  awaiting_approval: { label: "Awaiting approval", color: "#6D28D9", bg: "#EDE9FE" },
  approved: { label: "Approved ✓", color: "#065F46", bg: "var(--teal-pale)" },
};

export default function StatusBadge({
  status,
  config,
}: {
  status: string;
  config?: Record<string, { label: string; color: string; bg: string }>;
}) {
  const merged = { ...defaultStatusConfig, ...config };
  const s = merged[status] || { label: status, color: "#6B7280", bg: "#F3F4F6" };

  return (
    <span
      style={{
        fontSize: "0.75rem",
        fontWeight: 600,
        padding: "4px 10px",
        borderRadius: "20px",
        background: s.bg,
        color: s.color,
        whiteSpace: "nowrap",
      }}
    >
      {s.label}
    </span>
  );
}
