"use client";

import { usePathname } from "next/navigation";
import { X, Layout, Crosshair, Search, Mail } from "lucide-react";
import {
  LayoutDashboard,
  ArrowDownCircle,
  ArrowUpCircle,
  Users,
  Package,
  FileText,
  Globe,
  Umbrella,
  DollarSign,
  FileEdit,
  Trophy,
  Tag,
  Bell,
  Building2,
  TrendingUp,
  Settings,
  BarChart2,
} from "lucide-react";

const navItems: Array<{
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}> = [
  { href: "/admin", label: "Overview", icon: <LayoutDashboard size={16} /> },
  { href: "/admin/deposits", label: "Deposits", icon: <ArrowDownCircle size={16} />, badge: 0 },
  { href: "/admin/visa-redemptions", label: "Visa Apps", icon: <FileText size={16} /> },
  { href: "/admin/withdrawals", label: "Withdrawals", icon: <ArrowUpCircle size={16} />, badge: 0 },
  { href: "/admin/users", label: "Users", icon: <Users size={16} /> },
  { href: "/admin/orders", label: "Orders", icon: <Package size={16} /> },
  { href: "/admin/documents", label: "Documents", icon: <FileText size={16} /> },
  { href: "/admin/services", label: "Services", icon: <Globe size={16} /> },
  { href: "/admin/groups", label: "Groups", icon: <Users size={16} /> },
  { href: "/admin/content", label: "Content", icon: <FileEdit size={16} /> },
  { href: "/admin/holidays", label: "Holiday Bookings", icon: <Umbrella size={16} /> },
  { href: "/admin/currencies", label: "Currencies", icon: <DollarSign size={16} /> },
  { href: "/admin/leaderboard", label: "Leaderboard", icon: <Trophy size={16} /> },
  { href: "/admin/promotions", label: "Promotions", icon: <Tag size={16} /> },
  { href: "/admin/notifications", label: "Notifications", icon: <Bell size={16} /> },
  { href: "/admin/subscribers", label: "Subscribers", icon: <Mail size={16} /> },
  { href: "/admin/corporate", label: "Corporate", icon: <Building2 size={16} /> },
  { href: "/admin/float", label: "Float Ledger", icon: <TrendingUp size={16} /> },
  { href: "/admin/settings", label: "Settings", icon: <Settings size={16} /> },
  { href: "/admin/analytics", label: "Analytics", icon: <BarChart2 size={16} /> },
  { href: "/admin/pages", label: "Landing Pages", icon: <Layout size={16} /> },
  { href: "/admin/goal-templates", label: "Goal Templates", icon: <Crosshair size={16} /> },
  { href: "/admin/seo", label: "SEO Manager", icon: <Search size={16} /> },
];

export default function AdminSidebar({
  pendingDeposits,
  pendingWithdrawals,
  open,
  onClose,
}: {
  pendingDeposits: number;
  pendingWithdrawals: number;
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();

  const items = navItems.map((item) => {
    let badge = item.badge;
    if (item.href === "/admin/deposits") badge = pendingDeposits;
    if (item.href === "/admin/withdrawals") badge = pendingWithdrawals;
    const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

    return (
      <a
        key={item.href}
        href={item.href}
        onClick={onClose}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0.5rem 0.75rem",
          borderRadius: "var(--radius-sm)",
          textDecoration: "none",
          color: isActive ? "var(--midnight)" : "var(--text-secondary)",
          background: isActive ? "var(--gray-100)" : "transparent",
          fontWeight: isActive ? 600 : 400,
          marginBottom: "0.125rem",
          fontSize: "0.8125rem",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {item.icon}
          {item.label}
        </span>
        {(badge ?? 0) > 0 && (
          <span
            style={{
              background: "var(--danger)",
              color: "white",
              borderRadius: "20px",
              fontSize: "0.65rem",
              fontWeight: 700,
              padding: "1px 6px",
              minWidth: 18,
              textAlign: "center",
            }}
          >
            {badge}
          </span>
        )}
      </a>
    );
  });

  return (
    <>
      <div
        className="admin-sidebar-desktop"
        style={{
          width: 220,
          minWidth: 220,
          background: "white",
          borderRight: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            padding: "1rem",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif",
                fontWeight: 800,
                fontSize: "1.125rem",
                color: "var(--midnight)",
              }}
            >
              Swiipt
            </div>
            <div
              style={{
                fontSize: "0.7rem",
                color: "var(--text-muted)",
                marginTop: "0.125rem",
              }}
            >
              Admin Panel
            </div>
          </div>
          <button
            onClick={onClose}
            className="admin-sidebar-close"
            style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", color: "var(--text-muted)", display: "none" }}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>
        <nav style={{ padding: "0.5rem", flex: 1 }}>{items}</nav>
      </div>

      <div
        className="admin-sidebar-mobile"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          width: 260,
          maxWidth: "80vw",
          background: "white",
          borderRight: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
          zIndex: 30,
          transform: open ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.2s ease",
        }}
      >
        <div
          style={{
            padding: "1rem",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif",
                fontWeight: 800,
                fontSize: "1.125rem",
                color: "var(--midnight)",
              }}
            >
              Swiipt
            </div>
            <div
              style={{
                fontSize: "0.7rem",
                color: "var(--text-muted)",
                marginTop: "0.125rem",
              }}
            >
              Admin Panel
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", color: "var(--text-muted)" }}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>
        <nav style={{ padding: "0.5rem", flex: 1 }}>{items}</nav>
      </div>
    </>
  );
}
