"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Menu, Bell } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

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
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setAvatarMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

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
        className="hidden md:block"
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
        className="flex items-center justify-center flex-shrink-0 text-[0.8125rem] font-bold no-underline whitespace-nowrap bg-[var(--teal)] text-[var(--midnight)] w-9 h-9 rounded-full md:w-auto md:h-auto md:px-4 md:py-2 md:rounded-[var(--radius-md)]"
      >
        <span className="md:hidden">+</span>
        <span className="hidden md:inline">+ Add Funds</span>
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

      {/* Avatar with dropdown */}
      <div ref={menuRef} style={{ position: "relative" }}>
        <button
          onClick={() => setAvatarMenuOpen(!avatarMenuOpen)}
          style={{
            width: 36, height: 36, borderRadius: "50%",
            background: "var(--midnight)", color: "white",
            fontWeight: 700, fontSize: "0.875rem",
            border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {profile.full_name?.charAt(0).toUpperCase()}
        </button>

        {avatarMenuOpen && (
          <div style={{
            position: "absolute", top: "calc(100% + 8px)", right: 0,
            background: "white", borderRadius: "var(--radius-md)",
            border: "1px solid var(--border)", boxShadow: "var(--shadow-md)",
            minWidth: "180px", zIndex: 100, overflow: "hidden",
          }}>
            <div style={{ padding: "0.75rem 1rem", borderBottom: "1px solid var(--border)" }}>
              <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--midnight)" }}>{profile.full_name}</p>
            </div>
            <a href="/dashboard/settings" style={{ display: "block", padding: "0.75rem 1rem", fontSize: "0.875rem", color: "var(--text-secondary)", textDecoration: "none", borderBottom: "1px solid var(--border)" }}
              onClick={() => setAvatarMenuOpen(false)}>
              Settings
            </a>
            <button
              onClick={handleSignOut}
              style={{
                width: "100%", padding: "0.75rem 1rem",
                background: "none", border: "none",
                textAlign: "left", fontSize: "0.875rem",
                color: "var(--danger)", cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
