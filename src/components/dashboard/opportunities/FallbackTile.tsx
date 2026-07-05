"use client";

const TYPE_ICONS: Record<string, string> = {
  scholarship: "\uD83C\uDF93",
  visa_programme: "\uD83C\uDF0D",
  remote_work: "\uD83D\uDCBB",
  job: "\uD83D\uDCBC",
  fellowship: "\uD83C\uDF1F",
  grant: "\uD83D\uDCB0",
  internship: "\uD83D\uDC69\u200D\uD83C\uDF93",
  training: "\uD83D\uDCDA",
  competition: "\uD83C\uDFC6",
  conference: "\uD83C\uDF0D",
  exchange: "\u2708\uFE0F",
  trade_show: "\uD83C\uDFAA",
  trial: "\u26BD",
  healthcare: "\u2695\uFE0F",
  residency: "\uD83C\uDFE0",
  citizenship: "\uD83D\uDCDC",
  funding: "\uD83D\uDCB0",
  contest: "\uD83C\uDF1F",
  accelerator: "\uD83D\uDE80",
  award: "\uD83C\uDFC6",
};

const TYPE_GRADIENTS: Record<string, [string, string]> = {
  scholarship: ["#0f766e", "#0d9488"],
  visa_programme: ["#1e40af", "#3b82f6"],
  remote_work: ["#6b21a8", "#8b5cf6"],
  job: ["#166534", "#22c55e"],
  fellowship: ["#92400e", "#d97706"],
  grant: ["#831843", "#ec4899"],
  internship: ["#1e3a5f", "#3b82f6"],
  training: ["#374151", "#6b7280"],
  competition: ["#7c2d12", "#f97316"],
  conference: ["#0f172a", "#334155"],
  exchange: ["#0e7490", "#06b6d4"],
  trade_show: ["#4c1d95", "#7c3aed"],
  trial: ["#14532d", "#22c55e"],
  healthcare: ["#0c4a6e", "#0284c7"],
  residency: ["#0f766e", "#14b8a6"],
  citizenship: ["#1e40af", "#6366f1"],
};

const DEFAULT_GRADIENT: [string, string] = ["#374151", "#6b7280"];

function getTypeIcon(type: string): string {
  return TYPE_ICONS[type] || "\uD83C\uDF0D";
}

function getGradient(type: string): [string, string] {
  return TYPE_GRADIENTS[type] || DEFAULT_GRADIENT;
}

const COUNTRY_FLAGS: Record<string, string> = {
  usa: "\uD83C\uDDFA\uD83C\uDDF8",
  "united states": "\uD83C\uDDFA\uD83C\uDDF8",
  "uk": "\uD83C\uDDEC\uD83C\uDDE7",
  "united kingdom": "\uD83C\uDDEC\uD83C\uDDE7",
  canada: "\uD83C\uDDE8\uD83C\uDDE6",
  germany: "\uD83C\uDDE9\uD83C\uDDEA",
  sweden: "\uD83C\uDDF8\uD83C\uDDEA",
  denmark: "\uD83C\uDDE9\uD83C\uDDF0",
  china: "\uD83C\uDDE8\uD83C\uDDF3",
  uae: "\uD83C\uDDE6\uD83C\uDDEA",
  global: "\uD83C\uDF0D",
  multiple: "\uD83C\uDF0D",
};

function getFlag(country: string): string {
  const c = country?.toLowerCase().trim();
  return COUNTRY_FLAGS[c] || "\uD83C\uDF0D";
}

interface Props {
  type: string;
  organisation: string;
  location_country: string;
  aspectRatio?: string;
}

export default function FallbackTile({ type, organisation, location_country, aspectRatio = "16:9" }: Props) {
  const [from, to] = getGradient(type);
  const icon = getTypeIcon(type);
  const flag = getFlag(location_country);
  const ratio = aspectRatio === "4:5" ? "80%" : "56.25%";

  return (
    <div
      style={{
        width: "100%",
        paddingBottom: ratio,
        position: "relative",
        borderRadius: "var(--radius-md) var(--radius-md) 0 0",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(135deg, ${from}, ${to})`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.5rem",
        }}
      >
        <span style={{ fontSize: "2.5rem", lineHeight: 1 }}>{flag}</span>
        <span style={{ fontSize: "3rem", lineHeight: 1 }}>{icon}</span>
        <span
          style={{
            fontSize: "0.75rem",
            color: "rgba(255,255,255,0.9)",
            fontWeight: 600,
            textAlign: "center",
            padding: "0 1rem",
            maxWidth: "100%",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif",
          }}
        >
          {organisation}
        </span>
      </div>
    </div>
  );
}
