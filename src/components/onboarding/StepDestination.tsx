"use client";

import { useState } from "react";

const destinations = [
  { value: "UAE", label: "Dubai / UAE", flag: "🇦🇪", topGoal: "Residency" },
  { value: "Canada", label: "Canada", flag: "🇨🇦", topGoal: "Express Entry" },
  { value: "UK", label: "United Kingdom", flag: "🇬🇧", topGoal: "Skilled Worker" },
  { value: "Qatar", label: "Qatar", flag: "🇶🇦", topGoal: "Work Visa" },
  { value: "Portugal", label: "Portugal", flag: "🇵🇹", topGoal: "Remote Work" },
  { value: "Georgia", label: "Georgia", flag: "🇬🇪", topGoal: "Remote Work" },
  { value: "Maldives", label: "Maldives", flag: "🇲🇻", topGoal: "Holiday" },
  { value: "CapeTown", label: "Cape Town", flag: "🇿🇦", topGoal: "Holiday" },
  { value: "StKitts", label: "2nd Citizenship", flag: "🌍", topGoal: "St Kitts / Grenada" },
];

export default function StepDestination({
  onNext,
}: {
  onNext: (data: { destination: string; destinationLabel?: string; goalCategory?: string }) => void;
}) {
  const [selected, setSelected] = useState("");

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
        Where do you want to go?
      </h2>
      <p
        style={{
          color: "var(--text-muted)",
          marginBottom: "2rem",
        }}
      >
        We will set up your personalised dashboard. You can add more destinations later.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: "0.75rem",
        }}
        className="destination-grid"
      >
        {destinations.map((dest) => (
          <div
            key={dest.value}
            onClick={() => setSelected(dest.value)}
            style={{
              padding: "1rem",
              border: selected === dest.value ? "2px solid var(--teal)" : "1px solid var(--border)",
              borderRadius: "var(--radius-md)",
              cursor: "pointer",
              textAlign: "center",
              background: selected === dest.value ? "var(--teal-pale)" : "white",
              transition: "all 0.15s",
            }}
          >
            <div style={{ fontSize: "2rem", marginBottom: "0.375rem" }}>{dest.flag}</div>
            <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--midnight)" }}>
              {dest.label}
            </div>
            <div
              style={{
                fontSize: "0.75rem",
                color: "var(--text-muted)",
                marginTop: "0.25rem",
              }}
            >
              {dest.topGoal}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => onNext({ destination: "unsure", goalCategory: "general_travel" })}
        style={{
          width: "100%",
          padding: "0.875rem",
          background: "none",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-md)",
          color: "var(--text-muted)",
          fontSize: "0.9375rem",
          cursor: "pointer",
          marginTop: "0.75rem",
        }}
      >
        I&apos;m not sure yet — show me everything
      </button>

      <button
        disabled={!selected}
        onClick={() => {
          const dest = destinations.find((d) => d.value === selected);
          onNext({ destination: selected, destinationLabel: dest?.label });
        }}
        style={{
          width: "100%",
          padding: "0.875rem",
          background: selected ? "var(--teal)" : "var(--gray-100)",
          color: selected ? "var(--midnight)" : "var(--text-muted)",
          fontWeight: 700,
          fontSize: "1rem",
          borderRadius: "var(--radius-md)",
          border: "none",
          cursor: selected ? "pointer" : "not-allowed",
          marginTop: "1.5rem",
          transition: "all 0.15s",
        }}
      >
        Continue →
      </button>

      <style jsx>{`
        @media (max-width: 640px) {
          :global(.destination-grid) {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
        }
      `}</style>
    </div>
  );
}
