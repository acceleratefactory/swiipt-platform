interface MilestoneReward {
  id: string;
  goal_id: string;
  user_id: string;
  milestone_type: string;
  reward_type: string;
  reward_label: string;
  reward_value_description: string;
  redeemed: boolean;
  expires_at: string;
  created_at: string;
}

interface Goal {
  id: string;
  target_amount: number;
  current_balance: number;
  milestone_25_unlocked: boolean;
  milestone_50_unlocked: boolean;
  milestone_75_unlocked: boolean;
  milestone_100_unlocked: boolean;
}

export default function MilestoneTrack({
  goal,
  milestoneRewards,
}: {
  goal: Goal;
  milestoneRewards: MilestoneReward[];
}) {
  const milestones = [
    { pct: 25, key: "milestone_25_unlocked" as const, label: "25%" },
    { pct: 50, key: "milestone_50_unlocked" as const, label: "50%" },
    { pct: 75, key: "milestone_75_unlocked" as const, label: "75%" },
    { pct: 100, key: "milestone_100_unlocked" as const, label: "100%" },
  ];

  const currentPct =
    goal.target_amount > 0
      ? (goal.current_balance / goal.target_amount) * 100
      : 0;

  return (
    <div
      style={{
        background: "white",
        borderRadius: "var(--radius-lg)",
        padding: "1.5rem",
        marginBottom: "1rem",
        border: "1px solid var(--border)",
      }}
    >
      <h3
        style={{
          fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif",
          fontSize: "1rem",
          fontWeight: 700,
          color: "var(--midnight)",
          marginBottom: "1.5rem",
        }}
      >
        Milestone rewards
      </h3>

      <div style={{ position: "relative", paddingBottom: "1rem" }}>
        <div
          style={{
            position: "absolute",
            top: "20px",
            left: "20px",
            right: "20px",
            height: "2px",
            background: "var(--gray-100)",
            zIndex: 0,
          }}
        >
          <div
            style={{
              height: "100%",
              background: "var(--teal)",
              width: `${Math.min((currentPct / 100) * 100, 100)}%`,
              transition: "width 0.5s ease",
            }}
          />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            position: "relative",
            zIndex: 1,
          }}
        >
          {milestones.map((m) => {
            const unlocked = goal[m.key];
            const reward = milestoneRewards.find(
              (r) => r.milestone_type === `${m.pct}_percent`
            );
            return (
              <div
                key={m.pct}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    background: unlocked ? "var(--teal)" : "white",
                    border: unlocked
                      ? "2px solid var(--teal)"
                      : "2px solid var(--gray-300)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1rem",
                    transition: "all 0.3s ease",
                  }}
                >
                  {unlocked ? "✓" : "🔒"}
                </div>
                <p
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: unlocked ? "var(--teal)" : "var(--text-muted)",
                    textAlign: "center",
                  }}
                >
                  {m.label}
                </p>
                <p
                  style={{
                    fontSize: "0.6875rem",
                    color: "var(--text-muted)",
                    textAlign: "center",
                    lineHeight: 1.3,
                  }}
                >
                  {reward?.reward_label || "—"}
                </p>
                {unlocked && !reward?.redeemed && (
                  <a
                    href="/dashboard/rewards"
                    style={{
                      fontSize: "0.6875rem",
                      color: "var(--teal)",
                      fontWeight: 600,
                      textDecoration: "none",
                    }}
                  >
                    Redeem →
                  </a>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
