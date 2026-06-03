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
  user,
}: {
  user: { id: string; full_name?: string; referral_code?: string };
}) {
  const [step, setStep] = useState(1);
  const [goalData, setGoalData] = useState<Partial<GoalFormData>>({});
  const totalSteps = 4;

  return (
    <div style={{ minHeight: "100vh", background: "white" }}>
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
        <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
          Step {step} of {totalSteps}
        </span>
      </div>

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

      <div
        style={{
          maxWidth: "560px",
          margin: "0 auto",
          padding: "3rem 1.5rem",
        }}
      >
        {step === 1 && (
          <StepDestination
            onNext={(data) => {
              setGoalData({ ...goalData, ...data });
              setStep(2);
            }}
          />
        )}
        {step === 2 && (
          <StepGoalSetup
            goalData={goalData}
            onNext={(data) => {
              setGoalData({ ...goalData, ...data });
              setStep(3);
            }}
            onBack={() => setStep(1)}
          />
        )}
        {step === 3 && (
          <StepReferral
            user={user}
            onNext={() => setStep(4)}
            onBack={() => setStep(2)}
          />
        )}
        {step === 4 && <StepWelcome goalData={goalData} user={user} />}
      </div>
    </div>
  );
}
