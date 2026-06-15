"use client";

import { useState } from "react";
import CreateGoalForm from "./CreateGoalForm";

interface GoalTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  destination: string | null;
  target_amount_ngn: number;
  lock_type: "locked" | "flexible";
  lock_months: number | null;
  icon: string;
  segment: string | null;
  related_niche_page_slug: string | null;
  sort_order: number;
  is_active: boolean;
}

export default function GoalTemplateLibrary({
  templates,
  preSelected,
}: {
  templates: GoalTemplate[];
  preSelected: GoalTemplate | null;
}) {
  const [selected, setSelected] = useState<GoalTemplate | null>(preSelected);
  const [showCustom, setShowCustom] = useState(false);

  const cardStyle: React.CSSProperties = {
    padding: "1rem",
    background: "white",
    borderRadius: "var(--radius-md)",
    border: "1px solid var(--border)",
    cursor: "pointer",
    transition: "all 0.15s",
  };

  const showForm = selected || showCustom;

  return (
    <div>
      {!showForm && (
        <>
          <h1
            style={{
              fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif",
              fontSize: "1.5rem",
              fontWeight: 800,
              color: "var(--midnight)",
              marginBottom: "0.375rem",
            }}
          >
            Create a savings goal
          </h1>
          <p
            style={{
              fontSize: "0.875rem",
              color: "var(--text-muted)",
              marginBottom: "1.5rem",
            }}
          >
            Choose a goal template or create a custom goal.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
              gap: "0.75rem",
              marginBottom: "1.5rem",
            }}
          >
            {templates.map((template) => (
              <div
                key={template.id}
                onClick={() => setSelected(template)}
                style={cardStyle}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--teal)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
                }}
              >
                <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>
                  {template.icon}
                </div>
                <p
                  style={{
                    fontWeight: 700,
                    color: "var(--midnight)",
                    fontSize: "0.9375rem",
                    marginBottom: "0.25rem",
                  }}
                >
                  {template.name}
                </p>
                <p
                  style={{
                    fontSize: "0.8125rem",
                    color: "var(--text-muted)",
                    lineHeight: 1.4,
                    marginBottom: "0.75rem",
                  }}
                >
                  {template.description}
                </p>
                <p
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: 700,
                    color: "var(--teal)",
                  }}
                >
                  Target: ₦{template.target_amount_ngn.toLocaleString()}
                </p>
                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  {template.lock_type === "locked"
                    ? `🔒 ${template.lock_months} months locked`
                    : "🔓 Flexible"}
                </p>
              </div>
            ))}

            <div
              onClick={() => setShowCustom(true)}
              style={{
                padding: "1rem",
                background: "white",
                borderRadius: "var(--radius-md)",
                border: "2px dashed var(--border)",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "140px",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "var(--teal)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
              }}
            >
              <span style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>✏️</span>
              <p style={{ fontWeight: 600, color: "var(--text-muted)" }}>
                Custom goal
              </p>
            </div>
          </div>
        </>
      )}

      {showForm && (
        <div>
          {selected && (
            <div
              style={{
                background: "var(--teal-pale)",
                borderRadius: "var(--radius-md)",
                padding: "0.875rem 1rem",
                marginBottom: "1.5rem",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: "var(--midnight)",
                }}
              >
                {selected.icon} Template: {selected.name}
              </span>
              <button
                onClick={() => {
                  setSelected(null);
                  setShowCustom(false);
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  fontSize: "0.8125rem",
                }}
              >
                Change
              </button>
            </div>
          )}

          <CreateGoalForm
            submitLabel="Create Goal"
            prefilledData={
              selected
                ? {
                    goalName: selected.name,
                    goalCategory: selected.category,
                    destination: selected.destination ?? undefined,
                    currency: "NGN",
                    targetAmount: selected.target_amount_ngn,
                    lockType: selected.lock_type,
                    lockMonths: selected.lock_months ?? undefined,
                  }
                : undefined
            }
          />
        </div>
      )}
    </div>
  );
}
