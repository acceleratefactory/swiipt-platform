/* eslint-disable @typescript-eslint/no-explicit-any */
interface CampaignBannerProps {
  campaigns: any[];
}

export default function CampaignBanner({ campaigns }: CampaignBannerProps) {
  if (!campaigns.length) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.5rem" }}>
      {campaigns.map((c) => (
        <div
          key={c.id}
          style={{
            background: "linear-gradient(135deg, var(--midnight-light), var(--midnight))",
            borderRadius: "var(--radius-lg)",
            padding: "1rem 1.25rem",
            border: "1px solid rgba(255,255,255,0.1)",
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            flexWrap: "wrap",
          }}
        >
          <span style={{ fontSize: "1.5rem" }}>📢</span>
          <div style={{ flex: 1, minWidth: "200px" }}>
            <p style={{ fontSize: "0.875rem", fontWeight: 700, color: "white", marginBottom: "0.125rem" }}>{c.title}</p>
            {c.description && (
              <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.6)", marginBottom: "0.25rem" }}>{c.description}</p>
            )}
            <p style={{ fontSize: "0.75rem", color: "var(--teal)", fontWeight: 600 }}>
              {c.reward_per_invite
                ? `₦${(c.reward_amount_ngn || 0).toLocaleString()} per referral`
                : `₦${(c.reward_amount_ngn || 0).toLocaleString()} reward`}
              {c.invites_target ? ` · ${c.invites_target} invites target` : ""}
            </p>
          </div>
          <a
            href="/dashboard/affiliate"
            style={{
              padding: "0.5rem 1rem",
              background: "var(--teal)",
              color: "var(--midnight)",
              border: "none",
              borderRadius: "var(--radius-md)",
              fontSize: "0.8125rem",
              fontWeight: 700,
              cursor: "pointer",
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            Participate →
          </a>
        </div>
      ))}
    </div>
  );
}
