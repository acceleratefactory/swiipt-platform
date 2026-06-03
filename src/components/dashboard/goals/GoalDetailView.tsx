"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import GoalProgressRing from "./GoalProgressRing";
import MilestoneTrack from "./MilestoneTrack";
import TransactionHistory from "./TransactionHistory";
import GoalDepositFlow from "./GoalDepositFlow";
import GoalWithdrawFlow from "./GoalWithdrawFlow";

interface Goal {
  id: string;
  goal_name: string;
  goal_category: string;
  destination: string | null;
  currency: string;
  target_amount: number;
  current_balance: number;
  is_locked: boolean;
  maturity_date: string | null;
  milestone_25_unlocked: boolean;
  milestone_50_unlocked: boolean;
  milestone_75_unlocked: boolean;
  milestone_100_unlocked: boolean;
  early_exit_penalty_rate: number;
}

interface Deposit {
  id: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
  payment_reference: string;
  admin_confirmed_at: string | null;
}

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

interface Gift {
  id: string;
  giver_id: string;
  amount: number;
  currency: string;
  created_at: string;
  giver?: { full_name: string } | null;
  recipient?: { full_name: string } | null;
}

export default function GoalDetailView({
  goal,
  deposits,
  milestoneRewards,
  gifts,
  userId,
  preferredCurrency: _preferredCurrency,
}: {
  goal: Goal;
  deposits: Deposit[];
  milestoneRewards: MilestoneReward[];
  gifts: Gift[];
  userId: string;
  preferredCurrency: string;
}) {
  const [activeSection, setActiveSection] = useState<"overview" | "deposit" | "withdraw" | "gift">("overview");
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase
      .channel(`deposits:${goal.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "deposits",
          filter: `goal_id=eq.${goal.id}`,
        },
        (payload) => {
          if ((payload.new as { status: string }).status === "confirmed") {
            window.location.reload();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [goal.id, supabase]);

  const percentage = goal.target_amount > 0
    ? Math.min((goal.current_balance / goal.target_amount) * 100, 100)
    : 0;

  return (
    <div>
      <a
        href="/dashboard/goals"
        style={{
          color: "var(--text-muted)",
          fontSize: "0.875rem",
          textDecoration: "none",
          display: "flex",
          alignItems: "center",
          gap: "0.375rem",
          marginBottom: "1.5rem",
        }}
      >
        ← Back to goals
      </a>

      {/* Section 1: Goal header + progress ring */}
      <div
        style={{
          background: "white",
          borderRadius: "var(--radius-xl)",
          padding: "2rem",
          marginBottom: "1rem",
          border: "1px solid var(--border)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "1.5rem",
          }}
        >
          <div>
            <h1
              style={{
                fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif",
                fontSize: "1.375rem",
                fontWeight: 800,
                color: "var(--midnight)",
                marginBottom: "0.25rem",
              }}
            >
              {goal.goal_name}
            </h1>
            <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
              {goal.destination} · {goal.goal_category.replace(/_/g, " ")}
            </p>
          </div>
          <span
            style={{
              fontSize: "0.75rem",
              fontWeight: 700,
              padding: "4px 10px",
              borderRadius: "20px",
              background: goal.is_locked
                ? "rgba(245,158,11,0.1)"
                : "var(--teal-pale)",
              color: goal.is_locked ? "#B45309" : "var(--teal)",
            }}
          >
            {goal.is_locked ? "🔒 Locked" : "🔓 Flexible"}
          </span>
        </div>

        <div
          style={{
            display: "flex",
            gap: "2rem",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <GoalProgressRing percentage={percentage} size={140} />
          <div style={{ flex: 1 }}>
            <div style={{ marginBottom: "0.75rem" }}>
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                Saved
              </p>
              <p
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 800,
                  color: "var(--midnight)",
                }}
              >
                {goal.currency} {goal.current_balance.toLocaleString()}
              </p>
            </div>
            <div style={{ marginBottom: "0.75rem" }}>
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                Target
              </p>
              <p
                style={{
                  fontSize: "1rem",
                  fontWeight: 600,
                  color: "var(--text-secondary)",
                }}
              >
                {goal.currency} {goal.target_amount.toLocaleString()}
              </p>
            </div>
            {goal.maturity_date && (
              <div>
                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  Matures
                </p>
                <p
                  style={{
                    fontSize: "0.9375rem",
                    fontWeight: 600,
                    color: "var(--text-secondary)",
                  }}
                >
                  {new Date(goal.maturity_date).toLocaleDateString("en-NG", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            )}
          </div>
        </div>

        <div
          className="action-buttons-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "0.75rem",
            marginTop: "1.5rem",
          }}
        >
          <button
            onClick={() => setActiveSection("deposit")}
            style={{
              padding: "0.75rem",
              background: "var(--teal)",
              color: "var(--midnight)",
              fontWeight: 700,
              fontSize: "0.875rem",
              borderRadius: "var(--radius-md)",
              border: "none",
              cursor: "pointer",
            }}
          >
            Add Funds
          </button>
          {goal.milestone_25_unlocked && (
            <button
              onClick={() => setActiveSection("gift")}
              style={{
                padding: "0.75rem",
                background: "var(--off-white)",
                color: "var(--midnight)",
                fontWeight: 600,
                fontSize: "0.875rem",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border)",
                cursor: "pointer",
              }}
            >
              🎁 Gift
            </button>
          )}
          <button
            onClick={() => setActiveSection("withdraw")}
            style={{
              padding: "0.75rem",
              background: "var(--off-white)",
              color: "var(--danger)",
              fontWeight: 600,
              fontSize: "0.875rem",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border)",
              cursor: "pointer",
            }}
          >
            Withdraw
          </button>
        </div>
      </div>

      {/* Section 2: Milestone track */}
      <MilestoneTrack goal={goal} milestoneRewards={milestoneRewards} />

      {/* Section 3: Active section panel + transaction history */}
      {activeSection === "deposit" && (
        <GoalDepositFlow
          goal={goal}
          onClose={() => setActiveSection("overview")}
        />
      )}
      {activeSection === "withdraw" && (
        <GoalWithdrawFlow
          goal={goal}
          onClose={() => setActiveSection("overview")}
        />
      )}
      {activeSection === "gift" && (
        <div
          style={{
            background: "white",
            borderRadius: "var(--radius-lg)",
            padding: "2rem",
            border: "1px solid var(--border)",
            marginBottom: "1rem",
            textAlign: "center",
          }}
        >
          <p style={{ color: "var(--text-muted)", marginBottom: "1rem" }}>
            Gift to a friend — Sprint 9
          </p>
          <button
            onClick={() => setActiveSection("overview")}
            style={{
              background: "none",
              border: "none",
              color: "var(--teal)",
              cursor: "pointer",
              fontSize: "0.875rem",
            }}
          >
            Cancel
          </button>
        </div>
      )}

      <TransactionHistory
        deposits={deposits}
        gifts={gifts}
        goalCurrency={goal.currency}
        userId={userId}
      />

      <style jsx>{`
        @media (max-width: 480px) {
          :global(.action-buttons-grid) {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
