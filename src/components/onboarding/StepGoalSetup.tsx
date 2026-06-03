"use client";

import CreateGoalForm from "@/components/dashboard/goals/CreateGoalForm";

export default function StepGoalSetup({
  goalData,
  onNext,
  onBack,
}: {
  goalData: { destination?: string; destinationLabel?: string; goalCategory?: string };
  onNext: (data: {
    goalName?: string;
    category?: string;
    targetAmount?: number;
    currency?: string;
    lockType?: "locked" | "flexible";
    lockMonths?: number;
  }) => void;
  onBack: () => void;
}) {
  return (
    <div>
      <h2
        style={{
          fontSize: "1.75rem",
          fontWeight: 800,
          color: "var(--midnight)",
          marginBottom: "0.5rem",
        }}
      >
        Set up your goal
      </h2>
      <p style={{ color: "var(--text-muted)", marginBottom: "2rem" }}>
        How you want to save toward {goalData.destinationLabel || "your destination"}.
      </p>

      <CreateGoalForm
        goalData={goalData}
        onBack={onBack}
        onSuccess={(_goalId, formValues) => {
          onNext(
            formValues ?? {
              goalName: "",
              category: "",
              targetAmount: 0,
              currency: "NGN",
              lockType: "locked",
              lockMonths: 12,
            }
          );
        }}
      />
    </div>
  );
}
