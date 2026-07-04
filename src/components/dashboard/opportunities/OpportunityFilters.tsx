"use client";

interface Props {
  types: string[];
  selectedType: string | null;
  onTypeChange: (type: string | null) => void;
}

const TYPE_LABELS: Record<string, string> = {
  job: "Jobs",
  scholarship: "Scholarships",
  visa_programme: "Visa Programmes",
  sports_trial: "Trials",
  remote_work: "Remote",
  training: "Training",
};

export default function OpportunityFilters({ types, selectedType, onTypeChange }: Props) {
  return (
    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
      <button
        onClick={() => onTypeChange(null)}
        style={{
          padding: "0.375rem 0.75rem",
          borderRadius: "999px",
          border: "1px solid #e2e8f0",
          background: selectedType === null ? "var(--teal)" : "white",
          color: selectedType === null ? "var(--midnight)" : "#475569",
          fontWeight: 600,
          fontSize: "0.75rem",
          cursor: "pointer",
        }}
      >
        All
      </button>
      {types.map((t) => (
        <button
          key={t}
          onClick={() => onTypeChange(t === selectedType ? null : t)}
          style={{
            padding: "0.375rem 0.75rem",
            borderRadius: "999px",
            border: "1px solid #e2e8f0",
            background: selectedType === t ? "var(--teal)" : "white",
            color: selectedType === t ? "var(--midnight)" : "#475569",
            fontWeight: 600,
            fontSize: "0.75rem",
            cursor: "pointer",
          }}
        >
          {TYPE_LABELS[t] || t}
        </button>
      ))}
    </div>
  );
}
