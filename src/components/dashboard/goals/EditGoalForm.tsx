"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Goal {
  id: string;
  goal_name: string;
  target_amount: number;
  current_balance: number;
  currency: string;
  is_locked: boolean;
  maturity_date: string | null;
  destination: string | null;
  goal_category: string;
}

export default function EditGoalForm({
  goal,
  onClose,
}: {
  goal: Goal;
  onClose: () => void;
}) {
  const [name, setName] = useState(goal.goal_name);
  const [target, setTarget] = useState(String(goal.target_amount));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const supabase = createClient();

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Goal name is required.");
      return;
    }

    const parsedTarget = parseFloat(target);
    if (isNaN(parsedTarget) || parsedTarget < goal.current_balance) {
      setError(`Target amount cannot be less than current balance (${goal.currency} ${goal.current_balance.toLocaleString()}).`);
      return;
    }

    setSaving(true);
    const { error: updateError } = await supabase
      .from("savings_goals")
      .update({ goal_name: trimmedName, target_amount: parsedTarget })
      .eq("id", goal.id);

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
    } else {
      window.location.reload();
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "1rem",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: "var(--radius-xl)",
          padding: "2rem",
          width: "100%",
          maxWidth: "480px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1.5rem",
          }}
        >
          <h2
            style={{
              fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif",
              fontSize: "1.25rem",
              fontWeight: 800,
              color: "var(--midnight)",
              margin: 0,
            }}
          >
            Edit Goal
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "1.25rem",
              cursor: "pointer",
              color: "var(--text-muted)",
            }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSave}>
          <div style={{ marginBottom: "1rem" }}>
            <label
              style={{
                display: "block",
                fontSize: "0.875rem",
                fontWeight: 600,
                color: "var(--midnight)",
                marginBottom: "0.375rem",
              }}
            >
              Goal Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "0.625rem 0.75rem",
                fontSize: "0.9375rem",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border)",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label
              style={{
                display: "block",
                fontSize: "0.875rem",
                fontWeight: 600,
                color: "var(--midnight)",
                marginBottom: "0.375rem",
              }}
            >
              Target Amount ({goal.currency})
            </label>
            <input
              type="number"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              min={goal.current_balance}
              step="0.01"
              required
              style={{
                width: "100%",
                padding: "0.625rem 0.75rem",
                fontSize: "0.9375rem",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border)",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div
            style={{
              padding: "0.75rem",
              background: "var(--teal-pale)",
              borderRadius: "var(--radius-md)",
              fontSize: "0.8125rem",
              color: "var(--text-secondary)",
              marginBottom: "1rem",
            }}
          >
            Destination, currency, and lock type cannot be changed after a goal is created.
          </div>

          {error && (
            <p style={{ color: "var(--danger)", fontSize: "0.875rem", marginBottom: "0.75rem" }}>
              {error}
            </p>
          )}

          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "0.625rem 1.25rem",
                background: "var(--off-white)",
                color: "var(--midnight)",
                fontWeight: 600,
                fontSize: "0.875rem",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border)",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: "0.625rem 1.25rem",
                background: "var(--teal)",
                color: "var(--midnight)",
                fontWeight: 700,
                fontSize: "0.875rem",
                borderRadius: "var(--radius-md)",
                border: "none",
                cursor: "pointer",
                opacity: saving ? 0.6 : 1,
              }}
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
