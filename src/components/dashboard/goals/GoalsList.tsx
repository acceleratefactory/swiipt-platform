"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Target } from "lucide-react";

interface Goal {
  id: string;
  goal_name: string;
  goal_category: string;
  destination: string | null;
  currency: string;
  target_amount: number;
  current_balance: number;
  is_locked: boolean;
  lock_period_months: number | null;
  start_date: string | null;
  maturity_date: string | null;
  status: "active" | "completed" | "withdrawn" | "cancelled";
  milestone_25_unlocked: boolean;
  milestone_50_unlocked: boolean;
  milestone_75_unlocked: boolean;
  milestone_100_unlocked: boolean;
  created_at: string;
}

function GoalCardFull({ goal }: { goal: Goal }) {
  const percentage = goal.target_amount > 0
    ? Math.min((goal.current_balance / goal.target_amount) * 100, 100)
    : 0;

  const milestonesUnlocked = [
    goal.milestone_25_unlocked,
    goal.milestone_50_unlocked,
    goal.milestone_75_unlocked,
    goal.milestone_100_unlocked,
  ].filter(Boolean).length;

  const nextMilestone = !goal.milestone_25_unlocked ? 25
    : !goal.milestone_50_unlocked ? 50
    : !goal.milestone_75_unlocked ? 75
    : !goal.milestone_100_unlocked ? 100
    : null;

  const amountToNextMilestone = nextMilestone
    ? (goal.target_amount * nextMilestone / 100) - goal.current_balance
    : 0;

  const lockPeriodRemaining = goal.maturity_date
    ? Math.max(0, Math.ceil((new Date(goal.maturity_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30)))
    : null;

  return (
    <div
      style={{
        background: "white",
        borderRadius: "var(--radius-lg)",
        padding: "1.25rem",
        border: "1px solid var(--border)",
        transition: "box-shadow 0.15s, transform 0.15s",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-md)";
        (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = "none";
        (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <p style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--midnight)", marginBottom: "0.125rem" }}>
            {goal.goal_name}
          </p>
          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
            {goal.destination || goal.goal_category.replace(/_/g, " ")}
          </p>
        </div>
        <span style={{
          fontSize: "0.7rem", fontWeight: 700, padding: "3px 8px", borderRadius: "20px",
          background: goal.is_locked ? "rgba(245,158,11,0.1)" : "var(--teal-pale)",
          color: goal.is_locked ? "#B45309" : "var(--teal)",
        }}>
          {goal.is_locked ? "🔒 Locked" : "🔓 Flexible"}
        </span>
      </div>

      {/* Progress bar */}
      <div>
        <div style={{ height: "6px", background: "var(--gray-100)", borderRadius: "3px", overflow: "hidden" }}>
          <div style={{
            height: "100%",
            background: percentage >= 100 ? "var(--teal)" : `linear-gradient(90deg, var(--teal) ${percentage}%, transparent ${percentage}%)`,
            width: `${percentage}%`,
            borderRadius: "3px",
            transition: "width 0.5s ease",
          }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.375rem" }}>
          <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--midnight)" }}>
            {goal.currency} {goal.current_balance.toLocaleString()}
          </span>
          <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
            {Math.round(percentage)}% of {goal.currency} {goal.target_amount.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Lock period remaining */}
      {goal.is_locked && lockPeriodRemaining !== null && (
        <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
          {lockPeriodRemaining === 0 ? "🎉 Matured!" : `${lockPeriodRemaining} months remaining`}
        </p>
      )}

      {/* Milestone summary */}
      <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
        Milestones unlocked: <strong>{milestonesUnlocked}/4</strong>
      </p>

      {/* Next milestone nudge */}
      {nextMilestone && amountToNextMilestone > 0 && (
        <p style={{ fontSize: "0.75rem", color: "var(--teal)", background: "var(--teal-pale)", padding: "0.375rem 0.625rem", borderRadius: "var(--radius-sm)" }}>
          {goal.currency} {Math.ceil(amountToNextMilestone).toLocaleString()} more → {nextMilestone}% milestone
        </p>
      )}

      {/* Add Funds button */}
      <a
        href={`/dashboard/goals/${goal.id}?action=deposit`}
        onClick={(e) => e.stopPropagation()}
        style={{
          padding: "0.5rem 1rem",
          background: "var(--teal)",
          color: "var(--midnight)",
          fontWeight: 700,
          fontSize: "0.8125rem",
          borderRadius: "var(--radius-md)",
          textDecoration: "none",
          textAlign: "center",
          border: "none",
          cursor: "pointer",
          marginTop: "auto",
        }}
      >
        + Add Funds
      </a>
    </div>
  );
}

export default function GoalsList({
  initialGoals,
  userId,
}: {
  initialGoals: Goal[];
  userId: string;
}) {
  const [filter, setFilter] = useState<"all" | "active" | "completed" | "withdrawn">("active");
  const [goals, setGoals] = useState(initialGoals);
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase
      .channel(`goals-list:${userId}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "savings_goals",
        filter: `user_id=eq.${userId}`,
      }, (payload) => {
        if (payload.eventType === "INSERT") {
          setGoals((prev) => [payload.new as Goal, ...prev]);
        } else if (payload.eventType === "UPDATE") {
          setGoals((prev) =>
            prev.map((g) => g.id === (payload.new as Goal).id ? { ...g, ...(payload.new as Goal) } : g)
          );
        } else if (payload.eventType === "DELETE") {
          setGoals((prev) => prev.filter((g) => g.id !== (payload.old as Goal).id));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId, supabase]);

  const filtered = goals.filter((g) =>
    filter === "all" ? true : g.status === filter
  );

  const filterOptions: Array<"all" | "active" | "completed" | "withdrawn"> = [
    "all", "active", "completed", "withdrawn",
  ];

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.5rem",
        }}
      >
        <h1
          style={{
            fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif",
            fontSize: "1.5rem",
            fontWeight: 800,
            color: "var(--midnight)",
          }}
        >
          My Goals
        </h1>
        <a
          href="/dashboard/goals/new"
          style={{
            padding: "0.625rem 1.25rem",
            background: "var(--teal)",
            color: "var(--midnight)",
            fontWeight: 700,
            fontSize: "0.875rem",
            borderRadius: "var(--radius-md)",
            textDecoration: "none",
          }}
        >
          + New Goal
        </a>
      </div>

      {/* Filter pills */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        {filterOptions.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: "0.375rem 0.875rem",
              borderRadius: "20px",
              border: filter === f ? "2px solid var(--teal)" : "1px solid var(--border)",
              background: filter === f ? "var(--teal-pale)" : "white",
              color: filter === f ? "var(--teal)" : "var(--text-secondary)",
              fontSize: "0.8125rem",
              fontWeight: filter === f ? 600 : 400,
              cursor: "pointer",
              textTransform: "capitalize",
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Goals grid or empty state */}
      {filtered.length === 0 ? (
        <div
          style={{
            background: "white",
            borderRadius: "var(--radius-lg)",
            padding: "3rem",
            textAlign: "center",
            border: "2px dashed var(--border)",
          }}
        >
          <Target size={40} style={{ color: "var(--gray-300)", marginBottom: "0.75rem" }} />
          <p style={{ color: "var(--text-muted)", marginBottom: "1rem" }}>
            {filter === "active"
              ? "No active goals. Create your first goal."
              : `No ${filter} goals.`}
          </p>
          <a
            href="/dashboard/goals/new"
            style={{
              padding: "0.625rem 1.25rem",
              background: "var(--teal)",
              color: "var(--midnight)",
              fontWeight: 700,
              fontSize: "0.875rem",
              borderRadius: "var(--radius-md)",
              textDecoration: "none",
            }}
          >
            + Create goal
          </a>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "1rem",
          }}
        >
          {filtered.map((goal) => (
            <a
              key={goal.id}
              href={`/dashboard/goals/${goal.id}`}
              style={{ textDecoration: "none" }}
            >
              <GoalCardFull goal={goal} />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
