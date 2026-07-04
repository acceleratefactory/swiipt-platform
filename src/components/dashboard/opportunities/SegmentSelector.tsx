"use client";

interface Segment {
  slug: string;
  name: string;
  icon?: string;
}

interface Props {
  segments: Segment[];
  selected: string;
  onSelect: (slug: string) => void;
}

const SEGMENT_ICONS: Record<string, string> = {
  job_seeker: "\uD83D\uDCBC",
  student: "\uD83C\uDF93",
  footballer: "\u26BD",
  healthcare: "\uD83C\uDFE5",
  tech_professional: "\uD83D\uDCBB",
  freelancer: "\uD83D\uDCBC",
  entrepreneur: "\uD83D\uDEE0\uFE0F",
  trade_worker: "\uD83D\uDD28",
  caregiver: "\uD83D\uDC97",
  sports_professional: "\uD83C\uDFC6",
};

export default function SegmentSelector({ segments, selected, onSelect }: Props) {
  return (
    <div style={{ display: "flex", gap: "0.5rem", overflowX: "auto", paddingBottom: "0.5rem" }}>
      {segments.map((seg) => (
        <button
          key={seg.slug}
          onClick={() => onSelect(seg.slug)}
          style={{
            padding: "0.5rem 1rem",
            borderRadius: "999px",
            border: "1px solid",
            borderColor: selected === seg.slug ? "var(--teal)" : "#e2e8f0",
            background: selected === seg.slug ? "rgba(0,200,150,0.1)" : "white",
            color: selected === seg.slug ? "var(--teal)" : "#475569",
            fontWeight: 600,
            fontSize: "0.8125rem",
            cursor: "pointer",
            whiteSpace: "nowrap",
            display: "flex",
            alignItems: "center",
            gap: "0.375rem",
          }}
        >
          <span>{SEGMENT_ICONS[seg.slug] || seg.icon || ""}</span>
          {seg.name}
        </button>
      ))}
    </div>
  );
}
