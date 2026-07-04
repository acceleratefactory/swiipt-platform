"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.875rem",
  fontWeight: 600,
  color: "var(--text-primary)",
  marginBottom: "0.375rem",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.75rem 1rem",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-md)",
  fontSize: "0.9375rem",
  color: "var(--text-primary)",
  outline: "none",
  transition: "border-color 0.15s",
};

const categoryOptions = [
  { value: "residency_permit", label: "Residency Permit" },
  { value: "work_visa", label: "Work Visa" },
  { value: "remote_work_visa", label: "Remote Work Visa" },
  { value: "second_citizenship", label: "2nd Citizenship" },
  { value: "company_registration", label: "Company Registration" },
  { value: "holiday_package", label: "Holiday Package" },
  { value: "general_travel", label: "General Travel Fund" },
  { value: "custom", label: "Custom Goal" },
];

export default function CreateGoalForm({
  goalData,
  onSuccess,
  onBack,
  submitLabel = "Continue →",
  prefilledData,
}: {
  goalData?: { destination?: string; destinationLabel?: string; goalCategory?: string };
  onSuccess?: (goalId: string, formValues?: {
    goalName: string;
    category: string;
    targetAmount: number;
    currency: string;
    lockType: "locked" | "flexible";
    lockMonths: number;
  }) => void;
  onBack?: () => void;
  submitLabel?: string;
  prefilledData?: {
    goalName?: string;
    goalCategory?: string;
    destination?: string;
    currency?: string;
    targetAmount?: number;
    lockType?: "locked" | "flexible";
    lockMonths?: number;
  };
}) {
  const router = useRouter();
  const defaultCategory = (() => {
    if (goalData?.destination === "StKitts") return "second_citizenship";
    if (goalData?.destination === "Maldives" || goalData?.destination === "CapeTown")
      return "holiday_package";
    if (goalData?.goalCategory) return goalData.goalCategory;
    return "residency_permit";
  })();

  const [category, setCategory] = useState(prefilledData?.goalCategory ?? defaultCategory);
  const [goalName, setGoalName] = useState(prefilledData?.goalName ?? "");
  const [targetAmount, setTargetAmount] = useState(prefilledData?.targetAmount?.toString() ?? "");
  const [currency, setCurrency] = useState(prefilledData?.currency ?? "NGN");
  const [lockType, setLockType] = useState<"locked" | "flexible">(prefilledData?.lockType ?? "locked");
  const [lockMonths, setLockMonths] = useState(prefilledData?.lockMonths ?? 12);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCreateGoal() {
    if (!goalName || !targetAmount) return;
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const startDate = new Date();
    const maturityDate =
      lockType === "locked"
        ? new Date(startDate.getTime() + lockMonths * 30 * 24 * 60 * 60 * 1000)
        : null;

    const { data: newGoal, error: insertError } = await supabase
      .from("savings_goals")
      .insert({
        user_id: user!.id,
        goal_name: goalName,
        goal_category: category,
        destination: goalData?.destination ?? prefilledData?.destination ?? null,
        currency,
        target_amount: Number(targetAmount),
        is_locked: lockType === "locked",
        lock_period_months: lockType === "locked" ? lockMonths : null,
        start_date: startDate.toISOString().split("T")[0],
        maturity_date: maturityDate ? maturityDate.toISOString().split("T")[0] : null,
        early_exit_penalty_rate: 0.03,
        status: "active",
        linked_service_package_id: null,
        linked_holiday_package_id: null,
      })
      .select()
      .single();

    if (insertError || !newGoal) {
      setError("Failed to create goal. Please try again.");
      setLoading(false);
      return;
    }

    await supabase.from("activity_log").insert({
      user_id: user!.id,
      event_type: "goal_created",
      event_data: {
        goal_name: goalName,
        category,
        destination: goalData?.destination,
        currency,
        target: targetAmount,
      },
    });

    await supabase.rpc("increment_mobility_score", {
      user_id_input: user!.id,
      points: 20,
    });

    fetch("/api/readiness/recalculate", { method: "POST" }).catch(() => {});
    fetch("/api/achievements/generate-card", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user!.id,
        cardType: "goal_created",
        data: { goalName, subtitle: "Swiipt — Plan, fund, and execute your global move" },
      }),
    }).catch(() => {});

    setLoading(false);
    if (onSuccess) {
      onSuccess(newGoal.id, {
        goalName,
        category,
        targetAmount: Number(targetAmount),
        currency,
        lockType,
        lockMonths,
      });
    } else {
      router.push(`/dashboard/goals/${newGoal.id}`);
    }
  }

  const canSubmit = !!goalName && !!targetAmount && !loading;

  return (
    <div>
      <div style={{ display: "grid", gap: "1.25rem" }}>
        <div>
          <label style={labelStyle}>Goal name</label>
          <input
            type="text"
            placeholder={`e.g. My ${goalData?.destinationLabel || ""} Move Fund`.trim()}
            value={goalName}
            onChange={(e) => setGoalName(e.target.value)}
            style={inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>Goal type</label>
          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              flexWrap: "wrap",
              marginTop: "0.375rem",
            }}
          >
            {categoryOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setCategory(opt.value)}
                style={{
                  padding: "0.5rem 0.875rem",
                  borderRadius: "20px",
                  border:
                    category === opt.value ? "2px solid var(--teal)" : "1px solid var(--border)",
                  background: category === opt.value ? "var(--teal-pale)" : "white",
                  color: category === opt.value ? "var(--teal)" : "var(--text-secondary)",
                  fontSize: "0.8125rem",
                  fontWeight: category === opt.value ? 600 : 400,
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "120px 1fr",
            gap: "0.75rem",
          }}
          className="currency-amount-grid"
        >
          <div>
            <label style={labelStyle}>Currency</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              style={{ ...inputStyle, cursor: "pointer" }}
            >
              {["NGN", "USD", "AED", "QAR", "GBP", "CAD", "EUR"].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Target amount</label>
            <input
              type="number"
              placeholder="0"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              style={inputStyle}
              min="1000"
            />
          </div>
        </div>

        <div>
          <label style={labelStyle}>Savings type</label>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "0.5rem",
              marginTop: "0.375rem",
            }}
          >
            <button
              onClick={() => setLockType("locked")}
              style={{
                padding: "0.875rem",
                border:
                  lockType === "locked" ? "2px solid var(--teal)" : "1px solid var(--border)",
                borderRadius: "var(--radius-md)",
                background: lockType === "locked" ? "var(--teal-pale)" : "white",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <div style={{ fontWeight: 700, fontSize: "0.875rem", color: "var(--midnight)" }}>
                🔒 Locked
              </div>
              <div
                style={{
                  fontSize: "0.75rem",
                  color: "var(--text-muted)",
                  marginTop: "0.25rem",
                }}
              >
                Unlock milestone rewards. 3% fee for early exit.
              </div>
            </button>
            <button
              onClick={() => setLockType("flexible")}
              style={{
                padding: "0.875rem",
                border:
                  lockType === "flexible" ? "2px solid var(--teal)" : "1px solid var(--border)",
                borderRadius: "var(--radius-md)",
                background: lockType === "flexible" ? "var(--teal-pale)" : "white",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <div style={{ fontWeight: 700, fontSize: "0.875rem", color: "var(--midnight)" }}>
                🔓 Flexible
              </div>
              <div
                style={{
                  fontSize: "0.75rem",
                  color: "var(--text-muted)",
                  marginTop: "0.25rem",
                }}
              >
                Withdraw anytime. No penalty. No milestone rewards.
              </div>
            </button>
          </div>
        </div>

        {lockType === "locked" && (
          <div>
            <label style={labelStyle}>
              Lock period: <strong>{lockMonths} months</strong>
            </label>
            <input
              type="range"
              min={3}
              max={24}
              step={3}
              value={lockMonths}
              onChange={(e) => setLockMonths(Number(e.target.value))}
              style={{ width: "100%", accentColor: "var(--teal)" }}
            />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "0.75rem",
                color: "var(--text-muted)",
              }}
            >
              <span>3 months</span>
              <span>12 months</span>
              <span>24 months</span>
            </div>
            <div
              style={{
                marginTop: "0.75rem",
                padding: "0.75rem",
                background: "var(--teal-pale)",
                borderRadius: "var(--radius-md)",
                fontSize: "0.8125rem",
                color: "var(--text-secondary)",
              }}
            >
              Maturity date:{" "}
              <strong>
                {new Date(Date.now() + lockMonths * 30 * 24 * 60 * 60 * 1000).toLocaleDateString(
                  "en-NG",
                  { month: "long", year: "numeric" }
                )}
              </strong>
            </div>
          </div>
        )}

        {error && (
          <div
            style={{
              padding: "0.75rem",
              background: "#FEE",
              border: "1px solid #FCC",
              borderRadius: "var(--radius-md)",
              color: "#C33",
              fontSize: "0.875rem",
            }}
          >
            {error}
          </div>
        )}

        <button
          disabled={!canSubmit}
          onClick={handleCreateGoal}
          style={{
            width: "100%",
            padding: "0.875rem",
            background: canSubmit ? "var(--teal)" : "var(--gray-100)",
            color: canSubmit ? "var(--midnight)" : "var(--text-muted)",
            fontWeight: 700,
            fontSize: "1rem",
            borderRadius: "var(--radius-md)",
            border: "none",
            cursor: canSubmit ? "pointer" : "not-allowed",
            marginTop: "0.5rem",
            transition: "all 0.15s",
          }}
        >
          {loading ? "Creating..." : submitLabel}
        </button>

        {onBack && (
          <button
            onClick={onBack}
            style={{
              background: "none",
              border: "none",
              color: "var(--text-muted)",
              fontSize: "0.875rem",
              cursor: "pointer",
              padding: "0.5rem",
            }}
          >
            ← Back
          </button>
        )}
      </div>

      <style jsx>{`
        @media (max-width: 480px) {
          :global(.currency-amount-grid) {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
