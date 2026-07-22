import type { CoverStyleProps } from "./types";

const FONT = "Cabinet Grotesk, Plus Jakarta Sans, sans-serif";

export default function StyleA({ title, organisation, location_country, type }: CoverStyleProps) {
  const meta = `${type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}${location_country ? ` · ${location_country}` : ""}`;
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
        background: "#FAFAFA",
        padding: "1.5rem",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          color: "#1A1A1A",
          fontWeight: 800,
          fontSize: "clamp(1.1rem, 2.6vw, 1.5rem)",
          lineHeight: 1.2,
          fontFamily: FONT,
          display: "-webkit-box",
          WebkitLineClamp: 4,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
          maxWidth: "90%",
        }}
      >
        {title || organisation}
      </div>
      <div
        style={{
          width: 60,
          height: 4,
          background: "#00C896",
          borderRadius: 2,
          marginTop: "0.75rem",
          marginBottom: "0.75rem",
        }}
      />
      {organisation && title ? (
        <div style={{ color: "#666", fontSize: "0.75rem", fontFamily: FONT, marginBottom: "0.5rem" }}>
          {organisation}
        </div>
      ) : null}
      <div
        style={{
          alignSelf: "flex-start",
          background: "rgba(0,0,0,0.06)",
          color: "#555",
          fontSize: "0.65rem",
          fontWeight: 600,
          padding: "0.25rem 0.6rem",
          borderRadius: 999,
          fontFamily: FONT,
        }}
      >
        {meta}
      </div>
    </div>
  );
}
