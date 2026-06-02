"use client";

import { useState } from "react";
import StepDestination from "./StepDestination";
import StepGoalSetup from "./StepGoalSetup";
import StepReferral from "./StepReferral";
import StepWelcome from "./StepWelcome";

type GoalFormData = {
  destination?: string;
  destinationLabel?: string;
  goalCategory?: string;
  goalName?: string;
  targetAmount?: number;
  currency?: string;
  lockType?: "locked" | "flexible";
  lockMonths?: number;
};

export default function OnboardingShell({
  user: _user,
}: {
  user: { id: string; full_name?: string; referral_code?: string };
}) {
  const [step, _setStep] = useState(1);
  const [_goalData, _setGoalData] = useState<Partial<GoalFormData>>({});
  const totalSteps = 4;

  return (
    <div style={{ minHeight: "100vh", background: "white" }}>
      {/* Top bar */}
      <div
        style={{
          padding: "1.5rem 2rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <a
          href="/"
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "1.25rem",
            fontWeight: 800,
            color: "var(--midnight)",
            textDecoration: "none",
          }}
        >
          Swiipt
        </a>
        <span
          style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}
        >
          Step {step} of {totalSteps}
        </span>
      </div>

      {/* Progress bar */}
      <div style={{ height: "3px", background: "var(--gray-100)" }}>
        <div
          style={{
            height: "100%",
            background: "var(--teal)",
            width: `${(step / totalSteps) * 100}%`,
            transition: "width 0.3s ease",
          }}
        />
      </div>

      {/* Step content */}
      <div
        style={{
          maxWidth: "560px",
          margin: "0 auto",
          padding: "3rem 1.5rem",
        }}
      >
        {step === 1 && <StepDestination />}
        {step === 2 && <StepGoalSetup />}
        {step === 3 && <StepReferral />}
        {step === 4 && <StepWelcome />}
      </div>
    </div>
  );
}
