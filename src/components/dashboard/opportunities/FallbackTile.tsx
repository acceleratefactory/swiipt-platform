"use client";
import { useState } from "react";

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
  sports_trial: ["#14532d", "#22c55e"],
  healthcare: ["#0c4a6e", "#0284c7"],
  residency: ["#0f766e", "#14b8a6"],
  citizenship: ["#1e40af", "#6366f1"],
};

const DEFAULT_GRADIENT: [string, string] = ["#374151", "#6b7280"];
const FONT = "Cabinet Grotesk, Plus Jakarta Sans, sans-serif";

function getGradient(type: string): [string, string] {
  return TYPE_GRADIENTS[type] || DEFAULT_GRADIENT;
}

function humanize(type: string): string {
  return (type || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

interface Props {
  type: string;
  organisation: string;
  location_country: string;
  title?: string | null;
  logoUrl?: string | null;
}

export default function FallbackTile({
  type,
  organisation,
  location_country,
  title,
  logoUrl,
}: Props) {
  const [from, to] = getGradient(type);
  const [logoFailed, setLogoFailed] = useState(false);
  const bg = `linear-gradient(135deg, ${from}, ${to})`;
  const monogram = (organisation || "?").trim().charAt(0).toUpperCase();
  const showLogo = !!logoUrl && !logoFailed;
  const logoSrc = showLogo
    ? `/api/opportunities/cover?url=${encodeURIComponent(logoUrl as string)}`
    : null;
  const meta = `${humanize(type)}${location_country ? " · " + location_country : ""}`;

  // Logo-on-colour card (LinkedIn-style): brand background, logo centred in a
  // white chip, title/organisation captioned at the foot.
  if (showLogo && logoSrc) {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
          overflow: "hidden",
          background: bg,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "14%",
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 18,
              padding: "12%",
              boxShadow: "0 8px 24px rgba(0,0,0,0.20)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              maxWidth: "72%",
              maxHeight: "72%",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logoSrc}
              alt=""
              onError={() => setLogoFailed(true)}
              style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
            />
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            padding: "1.5rem 1rem 0.85rem",
            background: "linear-gradient(to top, rgba(0,0,0,0.5), rgba(0,0,0,0))",
          }}
        >
          <div
            style={{
              color: "#fff",
              fontWeight: 700,
              fontSize: "0.9rem",
              fontFamily: FONT,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {title || organisation}
          </div>
          <div style={{ color: "rgba(255,255,255,0.82)", fontSize: "0.72rem", marginTop: 2 }}>
            {meta}
          </div>
        </div>
      </div>
    );
  }

  // Typographic colour card (Instagram-Story style): brand background, strong
  // title type, organisation, and a type/country chip. No illustration.
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
        background: bg,
        padding: "1.25rem",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "1rem",
          right: "1.25rem",
          width: 44,
          height: 44,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.16)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          fontWeight: 700,
          fontSize: "1.1rem",
          fontFamily: FONT,
        }}
      >
        {monogram}
      </div>
      <div
        style={{
          color: "#fff",
          fontWeight: 700,
          fontSize: "clamp(1rem, 2.4vw, 1.35rem)",
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
      {title ? (
        <div
          style={{
            color: "rgba(255,255,255,0.85)",
            fontSize: "0.82rem",
            marginTop: "0.4rem",
            fontFamily: FONT,
          }}
        >
          {organisation}
        </div>
      ) : null}
      <div
        style={{
          marginTop: "0.85rem",
          alignSelf: "flex-start",
          background: "rgba(255,255,255,0.18)",
          color: "#fff",
          fontSize: "0.7rem",
          fontWeight: 600,
          padding: "0.28rem 0.65rem",
          borderRadius: 999,
          fontFamily: FONT,
        }}
      >
        {meta}
      </div>
    </div>
  );
}
