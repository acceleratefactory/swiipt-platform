import type { CoverStyleProps } from "./types";

const FONT = "Cabinet Grotesk, Plus Jakarta Sans, sans-serif";

const TYPE_GRADIENTS: Record<string, [string, string]> = {
  visa_programme: ["#1e40af", "#3b82f6"],
  internship: ["#1e3a5f", "#3b82f6"],
  training: ["#374151", "#6b7280"],
  residency: ["#0f766e", "#14b8a6"],
  healthcare: ["#0c4a6e", "#0284c7"],
};

const DEFAULT_GRADIENT: [string, string] = ["#374151", "#6b7280"];

export default function StyleB({ title, organisation, location_country, type }: CoverStyleProps) {
  const [from, to] = TYPE_GRADIENTS[type] || DEFAULT_GRADIENT;
  const meta = `${type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}${location_country ? ` · ${location_country}` : ""}`;
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
        background: `linear-gradient(135deg, ${from}, ${to})`,
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        padding: "0 0 1rem 0",
      }}
    >
      <div
        style={{
          margin: "0 0.75rem",
          background: "#FFFFFF",
          borderRadius: 18,
          padding: "1rem 1rem 0.85rem",
          boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
        }}
      >
        <div
          style={{
            color: "#000000",
            fontWeight: 700,
            fontSize: "clamp(0.85rem, 2vw, 1.1rem)",
            lineHeight: 1.25,
            fontFamily: FONT,
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {title || organisation}
        </div>
        {organisation && title ? (
          <div style={{ color: "#666", fontSize: "0.72rem", fontFamily: FONT, marginTop: "0.25rem" }}>
            {organisation}
          </div>
        ) : null}
        <div
          style={{
            marginTop: "0.5rem",
            background: "rgba(0,0,0,0.06)",
            color: "#555",
            fontSize: "0.65rem",
            fontWeight: 600,
            padding: "0.2rem 0.55rem",
            borderRadius: 999,
            fontFamily: FONT,
            display: "inline-block",
          }}
        >
          {meta}
        </div>
      </div>
    </div>
  );
}
