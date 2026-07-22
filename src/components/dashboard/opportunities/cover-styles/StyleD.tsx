import type { CoverStyleProps } from "./types";

const FONT = "Cabinet Grotesk, Plus Jakarta Sans, sans-serif";

export default function StyleD({ title, organisation, location_country, type }: CoverStyleProps) {
  const meta = `${type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}${location_country ? ` · ${location_country}` : ""}`;
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
        background: "linear-gradient(135deg, #06112B 0%, #000000 100%)",
        padding: "1.5rem",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "0.75rem",
          right: "0.75rem",
          background: "rgba(255,255,255,0.12)",
          color: "rgba(255,255,255,0.85)",
          fontSize: "0.6rem",
          fontWeight: 600,
          padding: "0.2rem 0.5rem",
          borderRadius: 999,
          fontFamily: FONT,
        }}
      >
        {meta}
      </div>
      <div
        style={{
          color: "#FFFFFF",
          fontWeight: 800,
          fontSize: "clamp(1.1rem, 2.6vw, 1.5rem)",
          lineHeight: 1.25,
          fontFamily: FONT,
          textAlign: "center",
          textShadow: "0 2px 8px rgba(0,0,0,0.4)",
          display: "-webkit-box",
          WebkitLineClamp: 4,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
          maxWidth: "92%",
        }}
      >
        {title || organisation}
      </div>
      {organisation && title ? (
        <div
          style={{
            color: "rgba(255,255,255,0.65)",
            fontSize: "0.78rem",
            fontFamily: FONT,
            marginTop: "0.5rem",
            textAlign: "center",
          }}
        >
          {organisation}
        </div>
      ) : null}
    </div>
  );
}
