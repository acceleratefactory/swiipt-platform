import type { CoverStyleProps } from "./types";

const FONT = "Cabinet Grotesk, Plus Jakarta Sans, sans-serif";

export default function StyleC({ title, organisation, location_country, type }: CoverStyleProps) {
  const meta = `${type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}${location_country ? ` · ${location_country}` : ""}`;
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
        background: "linear-gradient(135deg, #FDF8F0 0%, #F5E6D3 100%)",
        padding: "1.5rem",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      <div style={{ position: "absolute", top: "0.75rem", right: "1rem", fontSize: "3rem", lineHeight: 1, color: "rgba(0,0,0,0.08)", fontFamily: "Georgia, serif", userSelect: "none", pointerEvents: "none" }}>
        &ldquo;
      </div>
      <div
        style={{
          color: "#3D2C1A",
          fontWeight: 500,
          fontSize: "clamp(1rem, 2.4vw, 1.35rem)",
          lineHeight: 1.4,
          fontFamily: "Georgia, 'Times New Roman', serif",
          display: "-webkit-box",
          WebkitLineClamp: 4,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
          maxWidth: "88%",
        }}
      >
        {title || organisation}
      </div>
      <div style={{ color: "rgba(61,44,26,0.35)", fontSize: "1.3rem", lineHeight: 1, marginTop: "0.6rem", marginBottom: "0.6rem", fontFamily: FONT }}>
        &rarr;
      </div>
      {organisation && title ? (
        <div style={{ color: "#7A6A5A", fontSize: "0.75rem", fontFamily: FONT, marginBottom: "0.4rem" }}>
          {organisation}
        </div>
      ) : null}
      <div
        style={{
          alignSelf: "flex-start",
          background: "rgba(61,44,26,0.1)",
          color: "#5A4A3A",
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
