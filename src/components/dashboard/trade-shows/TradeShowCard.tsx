"use client";

interface TradeShowCardProps {
  show: {
    id: string;
    name: string;
    location_city: string;
    location_country: string;
    venue: string | null;
    event_date_start: string;
    event_date_end: string;
    category: string;
    base_cost_solo_ngn: number;
    base_cost_group_ngn: number | null;
    min_group_size: number;
    max_group_size: number;
    description: string | null;
  };
  openGroupCount?: number;
}

export default function TradeShowCard({ show, openGroupCount }: TradeShowCardProps) {
  const savingsPct = show.base_cost_group_ngn
    ? Math.round((1 - show.base_cost_group_ngn / show.base_cost_solo_ngn) * 100)
    : 0;

  return (
    <a
      href={`/dashboard/trade-shows/${show.id}`}
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
              {show.name}
            </h3>
            <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
              {show.location_city}, {show.location_country}
              {show.venue ? ` · ${show.venue}` : ""}
            </p>
          </div>
          <span style={{
            padding: "3px 10px",
            borderRadius: "20px",
            fontSize: "0.7rem",
            fontWeight: 700,
            background: "rgba(13,148,136,0.12)",
            color: "#0D9488",
            whiteSpace: "nowrap",
          }}>
            {show.category}
          </span>
          {openGroupCount && openGroupCount > 0 && (
            <span style={{
              padding: "3px 10px",
              borderRadius: "20px",
              fontSize: "0.7rem",
              fontWeight: 700,
              background: "rgba(5,150,105,0.12)",
              color: "#059669",
              whiteSpace: "nowrap",
              marginLeft: "0.5rem",
            }}>
              {openGroupCount} open group{openGroupCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginBottom: "0.75rem", lineHeight: 1.4 }}>
          {new Date(show.event_date_start).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          {" — "}
          {new Date(show.event_date_end).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </p>

        <div style={{ display: "flex", gap: "1rem", marginBottom: "0.75rem" }}>
          <div>
            <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginBottom: "0.125rem" }}>Solo price</p>
            <p style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--midnight)" }}>
              ₦{show.base_cost_solo_ngn.toLocaleString()}
            </p>
          </div>
          {show.base_cost_group_ngn && (
            <div>
              <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginBottom: "0.125rem" }}>Group price</p>
              <p style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--teal)" }}>
                ₦{show.base_cost_group_ngn.toLocaleString()}
              </p>
            </div>
          )}
        </div>

        {savingsPct > 0 && (
          <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--teal)" }}>
            Save {savingsPct}% with {show.min_group_size}+ members
          </p>
        )}
      </div>
    </a>
  );
}
