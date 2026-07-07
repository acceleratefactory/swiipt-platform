"use client";

interface IconProps {
  size?: number;
}

export function HeartIcon({ filled, size = 24 }: IconProps & { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size}
      fill={filled ? "#ed4956" : "none"}
      stroke={filled ? "#ed4956" : "#000000"}
      strokeWidth={filled ? 0 : 1.5}
    >
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5
        2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09
        C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5
        c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  );
}

export function CommentIcon({ size = 24, count }: IconProps & { count?: number }) {
  return (
    <span style={{ position: "relative", display: "inline-flex" }}>
      <svg viewBox="0 0 24 24" width={size} height={size}
        fill="none" stroke="#000000" strokeWidth={1.5}
        strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 11.5a8.5 8.5 0 01-8.5 8.5H6l-4 4V7.5
          A4.5 4.5 0 016.5 3h6A8.5 8.5 0 0121 11.5z" />
      </svg>
      {count !== undefined && count > 0 && (
        <span style={{ position: "absolute", top: -4, right: -6, minWidth: 14, height: 14, borderRadius: 7, background: "#000000", color: "#ffffff", fontSize: "0.5625rem", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 3px" }}>
          {count > 99 ? "99+" : count}
        </span>
      )}
    </span>
  );
}

export function ReshareIcon({ size = 24 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size}
      fill="none" stroke="#000000" strokeWidth={1.5}
      strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 2l4 4-4 4" />
      <path d="M3 11v-1a4 4 0 014-4h14" />
      <path d="M7 22l-4-4 4-4" />
      <path d="M21 13v1a4 4 0 01-4 4H3" />
    </svg>
  );
}

export function SaveIcon({ filled, size = 24 }: IconProps & { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size}
      fill={filled ? "#000000" : "none"}
      stroke="#000000" strokeWidth={1.5}
      strokeLinejoin="round">
      <path d="M5 3h14v18l-7-5.5L5 21V3z" />
    </svg>
  );
}

export function ApplyIcon({ size = 24 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size}
      fill="none" stroke="#000000" strokeWidth={1.5}
      strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 17L17 7" />
      <path d="M7 7h10v10" />
    </svg>
  );
}
