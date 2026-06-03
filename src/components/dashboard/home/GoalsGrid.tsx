"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Target, Plus } from "lucide-react";

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
}

function GoalCard({ goal }: { goal: Goal }) {
  const percentage = goal.target_amount > 0
    ? Math.min((goal.current_balance / goal.target_amount) * 100, 100)
    : 0;

  const daysRemaining = goal.maturity_date
    ? Math.max(0, Math.ceil((new Date(goal.maturity_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  const nextMilestone = !goal.milestone_25_unlocked ? 25
    : !goal.milestone_50_unlocked ? 50
    : !goal.milestone_75_unlocked ? 75
    : !goal.milestone_100_unlocked ? 100
    : null;

  const amountToNextMilestone = nextMilestone
    ? (goal.target_amount * nextMilestone / 100) - goal.current_balance
    : 0;

  return (
    <a href={`/dashboard/goals/${goal.id}`} style={{ textDecoration: "none" }}>
      <div
        style={{
          background: "white",
          borderRadius: "var(--radius-lg)",
          padding: "1.25rem",
          border: "1px solid var(--border)",
          transition: "box-shadow 0.15s, transform 0.15s",
          cursor: "pointer",
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
        {/* Goal header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
          <div>
            <p style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--midnight)", marginBottom: "0.25rem" }}>{goal.goal_name}</p>
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{goal.destination || goal.goal_category}</p>
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
        <div style={{ marginBottom: "0.75rem" }}>
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

        {/* Next milestone nudge */}
        {nextMilestone && amountToNextMilestone > 0 && (
          <p style={{ fontSize: "0.75rem", color: "var(--teal)", background: "var(--teal-pale)", padding: "0.375rem 0.625rem", borderRadius: "var(--radius-sm)" }}>
            {goal.currency} {Math.ceil(amountToNextMilestone).toLocaleString()} more → {nextMilestone}% milestone
          </p>
        )}

        {/* Maturity date */}
        {daysRemaining !== null && (
          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>
            {daysRemaining === 0 ? "🎉 Matured today!" : `${daysRemaining} days to maturity`}
          </p>
        )}
      </div>
    </a>
  );
}

export default function GoalsGrid({
  goals: initialGoals,
  userId,
}: {
  goals: Goal[];
  userId: string;
}) {
  const [goals, setGoals] = useState(initialGoals);
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase
      .channel(`goals:${userId}`)
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "savings_goals",
        filter: `user_id=eq.${userId}`,
      }, (payload) => {
        setGoals((prev) =>
          prev.map((g) => g.id === (payload.new as Goal).id ? { ...g, ...(payload.new as Goal) } : g)
        );
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId, supabase]);

  return (
    <div style={{ marginBottom: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--midnight)", fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif" }}>
          My savings goals
        </h2>
        <a href="/dashboard/goals" style={{ fontSize: "0.8125rem", color: "var(--teal)", fontWeight: 600, textDecoration: "none" }}>
          View all →
        </a>
      </div>

      {goals.length === 0 ? (
        <div style={{ background: "white", borderRadius: "var(--radius-lg)", padding: "2rem", textAlign: "center", border: "2px dashed var(--border)" }}>
          <Target size={32} style={{ color: "var(--gray-300)", marginBottom: "0.75rem" }} />
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginBottom: "1rem" }}>No goals yet. Create your first savings goal.</p>
          <a href="/dashboard/goals/new" style={{ padding: "0.625rem 1.25rem", background: "var(--teal)", color: "var(--midnight)", fontWeight: 700, fontSize: "0.875rem", borderRadius: "var(--radius-md)", textDecoration: "none" }}>
            + Create goal
          </a>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
          {goals.map((goal) => <GoalCard key={goal.id} goal={goal} />)}

          {/* Create new goal card */}
          <a
            href="/dashboard/goals/new"
            style={{
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              background: "white", borderRadius: "var(--radius-lg)", border: "2px dashed var(--border)",
              padding: "2rem", textDecoration: "none", color: "var(--text-muted)",
              minHeight: "160px", gap: "0.5rem",
              transition: "border-color 0.15s",
            }}
          >
            <Plus size={24} />
            <span style={{ fontSize: "0.875rem", fontWeight: 600 }}>New goal</span>
          </a>
        </div>
      )}
    </div>
  );
}
