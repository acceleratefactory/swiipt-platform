"use client";

interface FlightResultCardProps {
  offer: any;
  onSelect: () => void;
}

export default function FlightResultCard({ offer, onSelect }: FlightResultCardProps) {
  const outbound = offer.slices[0];
  const inbound = offer.slices[1];

  const formatTime = (dateStr: string) =>
    new Date(dateStr).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" });

  const formatDuration = (duration: string) => {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
    const h = match?.[1] || "0";
    const m = match?.[2] || "0";
    return `${h}h ${m}m`;
  };

  return (
    <div style={{ background: "white", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", padding: "1.25rem", marginBottom: "0.75rem", cursor: "pointer", transition: "box-shadow 0.15s" }}
      onClick={onSelect}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-md)"}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = "none"}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", marginBottom: inbound ? "0.5rem" : 0 }}>
            <div style={{ textAlign: "center" }}>
              <p style={{ fontWeight: 800, fontSize: "1.25rem", color: "var(--midnight)" }}>{formatTime(outbound.departure_at)}</p>
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{outbound.origin}</p>
            </div>
            <div style={{ flex: 1, textAlign: "center" }}>
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>{formatDuration(outbound.duration)}</p>
              <div style={{ height: "1px", background: "var(--border)", position: "relative" }}>
                <div style={{ position: "absolute", left: "50%", top: "-4px", transform: "translateX(-50%)", width: 8, height: 8, borderRadius: "50%", background: "var(--teal)" }} />
              </div>
              <p style={{ fontSize: "0.7rem", color: outbound.stops === 0 ? "var(--teal)" : "var(--warning)", marginTop: "0.25rem", fontWeight: 600 }}>
                {outbound.stops === 0 ? "Direct" : `${outbound.stops} stop${outbound.stops > 1 ? "s" : ""}`}
              </p>
            </div>
            <div style={{ textAlign: "center" }}>
              <p style={{ fontWeight: 800, fontSize: "1.25rem", color: "var(--midnight)" }}>{formatTime(outbound.arrival_at)}</p>
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{outbound.destination}</p>
            </div>
            <div style={{ textAlign: "center", minWidth: 60 }}>
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{outbound.segments[0]?.airline}</p>
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{outbound.segments[0]?.flight_number}</p>
            </div>
          </div>

          {inbound && (
            <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", paddingTop: "0.5rem", borderTop: "1px dashed var(--border)" }}>
              <div style={{ textAlign: "center" }}>
                <p style={{ fontWeight: 700, fontSize: "1rem", color: "var(--midnight)" }}>{formatTime(inbound.departure_at)}</p>
                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{inbound.origin}</p>
              </div>
              <div style={{ flex: 1, textAlign: "center" }}>
                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{formatDuration(inbound.duration)}</p>
                <div style={{ height: "1px", background: "var(--border)" }} />
                <p style={{ fontSize: "0.7rem", color: inbound.stops === 0 ? "var(--teal)" : "var(--warning)", fontWeight: 600 }}>
                  {inbound.stops === 0 ? "Direct" : `${inbound.stops} stop${inbound.stops > 1 ? "s" : ""}`}
                </p>
              </div>
              <div style={{ textAlign: "center" }}>
                <p style={{ fontWeight: 700, fontSize: "1rem", color: "var(--midnight)" }}>{formatTime(inbound.arrival_at)}</p>
                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{inbound.destination}</p>
              </div>
              <div style={{ textAlign: "center", minWidth: 60 }}>
                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{inbound.segments[0]?.airline}</p>
              </div>
            </div>
          )}
        </div>

        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <p style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1.5rem", fontWeight: 800, color: "var(--midnight)" }}>
            {offer.total_currency} {Number(offer.total_amount).toLocaleString()}
          </p>
          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.75rem" }}>per person</p>
          <button style={{ padding: "0.625rem 1.25rem", background: "var(--teal)", color: "var(--midnight)", fontWeight: 700, fontSize: "0.875rem", borderRadius: "var(--radius-md)", border: "none", cursor: "pointer" }}>
            Select →
          </button>
          {offer.conditions.refundable_before_departure && (
            <p style={{ fontSize: "0.7rem", color: "var(--teal)", marginTop: "0.375rem" }}>Refundable</p>
          )}
        </div>
      </div>
    </div>
  );
}
