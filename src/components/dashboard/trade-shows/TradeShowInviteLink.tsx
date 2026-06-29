"use client";

interface Props {
  inviteUrl: string;
}

export default function TradeShowInviteLink({ inviteUrl }: Props) {
  return (
    <div style={{ display: "flex", gap: "0.5rem" }}>
      <input
        readOnly
        value={inviteUrl}
        style={{
          flex: 1, padding: "0.5rem 0.75rem",
          border: "1px solid var(--border)", borderRadius: "var(--radius-sm)",
          fontSize: "0.8125rem", color: "var(--text-muted)",
          background: "var(--off-white)",
        }}
      />
      <button
        onClick={() => navigator.clipboard.writeText(inviteUrl)}
        style={{
          padding: "0.5rem 1rem",
          background: "var(--teal)", color: "var(--midnight)",
          fontWeight: 700, fontSize: "0.8125rem",
          border: "none", borderRadius: "var(--radius-sm)",
          cursor: "pointer",
        }}
      >
        Copy
      </button>
    </div>
  );
}
