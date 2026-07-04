"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Home, Target, Globe, Gift, Users } from "lucide-react";

const tabs = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/dashboard/goals", label: "Goals", icon: Target },
  { href: "/dashboard/services", label: "Services", icon: Globe },
  { href: "/dashboard/rewards", label: "Rewards", icon: Gift },
  { href: "/dashboard/refer", label: "Refer", icon: Users },
];

export default function BottomTabs() {
  const pathname = usePathname();

  return (
    <nav
      className="md:hidden flex"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: "60px",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        background: "white",
        borderTop: "1px solid var(--border)",
        zIndex: 40,
      }}
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.2rem",
              textDecoration: "none",
              color: isActive ? "var(--teal)" : "var(--gray-500)",
            }}
          >
            <Icon size={20} />
            <span style={{ fontSize: "0.65rem", fontWeight: isActive ? 600 : 400 }}>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
