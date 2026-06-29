"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Home, Target, Globe, Plane, Umbrella,
  FileText, Gift, Users, MessageCircle,
  Settings, Wallet, LogOut,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import CurrencyDisplay from "@/components/dashboard/shared/CurrencyDisplay";

const navItems = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/dashboard/goals", label: "My Goals", icon: Target },
  { href: "/dashboard/services", label: "Services", icon: Globe },
  { href: "/dashboard/flights", label: "Flights", icon: Plane },
  { href: "/dashboard/holidays", label: "Holidays", icon: Umbrella },
  { href: "/dashboard/groups", label: "Groups", icon: Users },
  { href: "/dashboard/trade-shows", label: "Trade Shows", icon: Globe },
  { href: "/dashboard/documents", label: "Documents", icon: FileText },
  { href: "/dashboard/rewards", label: "Rewards", icon: Gift },
  { href: "/dashboard/refer", label: "Refer & Earn", icon: Users },
  { href: "/dashboard/community", label: "Community", icon: MessageCircle },
  { href: "/dashboard/wallet", label: "Wallet", icon: Wallet },
];

export default function Sidebar({
  profile,
  wallet,
  open,
  onClose,
}: {
  profile: { id: string; full_name: string; preferred_currency: string; mobility_score: number };
  wallet: { balance_ngn: number; total_locked_ngn: number } | null;
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="sidebar-overlay open"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`dashboard-sidebar${open ? " open" : ""}`}
        style={{
          width: "260px",
          background: "var(--midnight)",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
          top: 0,
        }}
      >
        {/* Logo */}
        <div style={{ padding: "1.5rem 1.25rem", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <Link href="/dashboard" style={{ textDecoration: "none" }}>
            <span style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontWeight: 800, fontSize: "1.375rem", color: "white" }}>
              Swiipt
            </span>
          </Link>
        </div>

        {/* Wallet balance card */}
        <div style={{ margin: "1rem 1rem 0", background: "rgba(0,200,150,0.1)", border: "1px solid rgba(0,200,150,0.2)", borderRadius: "var(--radius-md)", padding: "0.875rem 1rem" }}>
          <p style={{ fontSize: "0.7rem", color: "var(--gray-500)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.25rem" }}>Total balance</p>
          <p style={{ fontSize: "1.25rem", fontWeight: 700, color: "white" }}>
            <CurrencyDisplay amount={(wallet?.balance_ngn || 0) + (wallet?.total_locked_ngn || 0)} currency={profile.preferred_currency} walletData={wallet || {}} />
          </p>
          <Link href="/dashboard/goals/new" style={{ display: "block", marginTop: "0.625rem", fontSize: "0.75rem", color: "var(--teal)", fontWeight: 600, textDecoration: "none" }}>
            + Add funds →
          </Link>
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, padding: "0.75rem 0.75rem", overflowY: "auto" }}>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.625rem 0.75rem",
                  borderRadius: "var(--radius-md)",
                  textDecoration: "none",
                  marginBottom: "0.125rem",
                  background: isActive ? "rgba(0,200,150,0.15)" : "transparent",
                  color: isActive ? "var(--teal)" : "var(--gray-500)",
                  transition: "all 0.15s",
                  fontSize: "0.875rem",
                  fontWeight: isActive ? 600 : 400,
                }}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User profile at bottom */}
        <div style={{ padding: "1rem", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--midnight-muted)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: "0.875rem", flexShrink: 0 }}>
              {profile.full_name?.charAt(0).toUpperCase()}
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "white", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{profile.full_name}</p>
              <p style={{ fontSize: "0.7rem", color: "var(--gray-500)" }}>Score: {profile.mobility_score}</p>
            </div>
            <Link href="/dashboard/settings" style={{ marginLeft: "auto", color: "var(--gray-500)" }}>
              <Settings size={16} />
            </Link>
          </div>
          <button
            onClick={handleSignOut}
            style={{
              width: "100%", padding: "0.75rem 1rem",
              background: "rgba(255,255,255,0.05)", border: "none",
              color: "rgba(255,255,255,0.5)", cursor: "pointer",
              fontSize: "0.8125rem", textAlign: "left",
              display: "flex", alignItems: "center", gap: "0.5rem",
            }}
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
