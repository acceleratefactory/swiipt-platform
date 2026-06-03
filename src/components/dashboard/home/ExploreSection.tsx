export default function ExploreSection({
  goals,
}: {
  goals: Array<{ destination: string | null }>;
}) {
  const primaryDestination = goals[0]?.destination || "general";

  return (
    <div style={{ marginBottom: "1.5rem" }}>
      <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--midnight)", fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", marginBottom: "1rem" }}>
        For your journey
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "1rem" }}>
        {/* Card 1: Visa policy update */}
        <div style={{ background: "white", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", overflow: "hidden" }}>
          <div style={{ height: "6px", background: "var(--teal)" }} />
          <div style={{ padding: "1rem" }}>
            <p style={{ fontSize: "0.7rem", color: "var(--teal)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>Visa Update</p>
            <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--midnight)", marginBottom: "0.5rem" }}>
              {primaryDestination === "UAE"
                ? "UAE extends freelancer visa income threshold"
                : primaryDestination === "Canada"
                  ? "Canada Express Entry draw: min CRS 491"
                  : "Latest visa policy updates for your destinations"}
            </p>
            <a href="/dashboard/resources" style={{ fontSize: "0.8125rem", color: "var(--teal)", fontWeight: 600, textDecoration: "none" }}>
              Read update →
            </a>
          </div>
        </div>

        {/* Card 2: Mobility Score nudge */}
        <div style={{ background: "white", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", overflow: "hidden" }}>
          <div style={{ height: "6px", background: "#F59E0B" }} />
          <div style={{ padding: "1rem" }}>
            <p style={{ fontSize: "0.7rem", color: "#B45309", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>Tip</p>
            <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--midnight)", marginBottom: "0.5rem" }}>
              Upload your passport to earn 30 Mobility Score points
            </p>
            <a href="/dashboard/documents" style={{ fontSize: "0.8125rem", color: "#B45309", fontWeight: 600, textDecoration: "none" }}>
              Upload documents →
            </a>
          </div>
        </div>

        {/* Card 3: Holiday package teaser */}
        <div style={{ background: "white", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", overflow: "hidden" }}>
          <div style={{ height: "6px", background: "#8B5CF6" }} />
          <div style={{ padding: "1rem" }}>
            <p style={{ fontSize: "0.7rem", color: "#6D28D9", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>Holiday Deal</p>
            <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--midnight)", marginBottom: "0.5rem" }}>
              5 Nights Maldives from ₦450,000 — 8 spots remaining
            </p>
            <a href="/dashboard/holidays" style={{ fontSize: "0.8125rem", color: "#6D28D9", fontWeight: 600, textDecoration: "none" }}>
              View package →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
