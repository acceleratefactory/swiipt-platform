"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Menu, Bell } from "lucide-react";

const titleMap: Record<string, string> = {
  "/dashboard": "Home",
  "/dashboard/goals": "My Goals",
  "/dashboard/services": "Services",
  "/dashboard/flights": "Flights",
  "/dashboard/holidays": "Holidays",
  "/dashboard/documents": "Documents",
  "/dashboard/rewards": "Rewards",
  "/dashboard/refer": "Refer & Earn",
  "/dashboard/community": "Community",
  "/dashboard/wallet": "Wallet",
  "/dashboard/settings": "Settings",
};

export default function TopBar({
  profile,
  unreadCount,
  onNotificationClick,
  onMenuClick,
}: {
  profile: { full_name: string };
  unreadCount: number;
  onNotificationClick: () => void;
  onMenuClick: () => void;
}) {
  const pathname = usePathname();
  const pageTitle = titleMap[pathname] || "Dashboard";

  return (
    <header
      style={{
        height: "64px",
        background: "white",
        boxShadow: "var(--shadow-sm)",
        position: "sticky",
        top: 0,
        zIndex: 30,
        display: "flex",
        alignItems: "center",
        padding: "0 1.5rem",
        gap: "1rem",
      }}
    >
      {/* Mobile menu button */}
      <button
        onClick={onMenuClick}
        className="md:hidden"
        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--midnight)" }}
      >
        <Menu size={22} />
      </button>

      {/* Page title */}
      <h1
        style={{
          fontSize: "1rem",
          fontWeight: 700,
          color: "var(--midnight)",
          fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif",
        }}
      >
        {pageTitle}
      </h1>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Add funds button */}
      <Link
        href="/dashboard/goals"
        style={{
          padding: "0.5rem 1rem",
          background: "var(--teal)",
          color: "var(--midnight)",
          fontWeight: 700,
          fontSize: "0.8125rem",
          borderRadius: "var(--radius-md)",
          textDecoration: "none",
          whiteSpace: "nowrap",
        }}
      >
        + Add Funds
      </Link>

      {/* Notification bell */}
      <button
        onClick={onNotificationClick}
        style={{
          position: "relative",
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "var(--text-secondary)",
          padding: "0.25rem",
        }}
      >
        <Bell size={22} />
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: -2,
              right: -2,
              width: 18,
              height: 18,
              background: "var(--danger)",
              borderRadius: "50%",
              fontSize: "0.6875rem",
              fontWeight: 700,
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Avatar */}
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          background: "var(--midnight)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontWeight: 700,
          fontSize: "0.875rem",
          cursor: "pointer",
          flexShrink: 0,
        }}
      >
        {profile.full_name?.charAt(0).toUpperCase()}
      </div>
    </header>
  );
}
