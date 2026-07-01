"use client";

interface PartnerCardProps {
  id: string;
  name: string;
  businessName: string | null;
  type: string;
  specialisations: string[];
  destinations: string[];
  rating: number;
  reviewCount: number;
  transactionCount: number;
  yearsInOperation: number | null;
}

export default function PartnerCard({
  id, name, businessName, type, specialisations,
  destinations, rating, reviewCount, transactionCount, yearsInOperation,
}: PartnerCardProps) {
  return (
    <a
      href={`/dashboard/find-agent/${id}`}
      style={{
        display: "block", background: "white", borderRadius: "var(--radius-xl)",
        padding: "1.25rem", border: "1px solid var(--border)", textDecoration: "none",
        transition: "box-shadow 0.15s", cursor: "pointer",
      }}
      onMouseOver={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)"; }}
      onMouseOut={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
    >
      <div style={{ marginBottom: "0.75rem" }}>
        <h3 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1rem", fontWeight: 700, color: "var(--midnight)", margin: "0 0 0.125rem 0" }}>
          {businessName || name}
        </h3>
        {businessName && (
          <p style={{ fontSize: "0.75rem", color: "#6B7280", margin: 0 }}>{name}</p>
        )}
        <span style={{ display: "inline-block", marginTop: "0.25rem", padding: "0.125rem 0.5rem", background: "#EFF6FF", color: "#1E40AF", borderRadius: "4px", fontSize: "0.6875rem", fontWeight: 600 }}>
          {type}
        </span>
      </div>

      <div style={{ display: "flex", gap: "1rem", marginBottom: "0.75rem", fontSize: "0.75rem", color: "#6B7280" }}>
        <span>★ {rating.toFixed(1)} ({reviewCount})</span>
        <span>{transactionCount} deal{transactionCount !== 1 ? "s" : ""}</span>
        {yearsInOperation && <span>{yearsInOperation} yr{yearsInOperation !== 1 ? "s" : ""}</span>}
      </div>

      {specialisations.length > 0 && (
        <div style={{ marginBottom: "0.5rem", display: "flex", gap: "0.25rem", flexWrap: "wrap" }}>
          {specialisations.slice(0, 3).map((s, i) => (
            <span key={i} style={{ padding: "0.125rem 0.375rem", background: "var(--off-white)", borderRadius: "4px", fontSize: "0.6875rem", color: "#374151" }}>
              {s}
            </span>
          ))}
          {specialisations.length > 3 && (
            <span style={{ fontSize: "0.6875rem", color: "#9CA3AF" }}>+{specialisations.length - 3}</span>
          )}
        </div>
      )}

      {destinations.length > 0 && (
        <div style={{ fontSize: "0.6875rem", color: "#9CA3AF" }}>
          Serves: {destinations.slice(0, 3).join(", ")}{destinations.length > 3 ? ` +${destinations.length - 3}` : ""}
        </div>
      )}

      <div style={{ marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px solid var(--border)", textAlign: "right" }}>
        <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--teal)" }}>
          Work with this agent →
        </span>
      </div>
    </a>
  );
}
