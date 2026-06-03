"use client";

import { useState, ReactNode } from "react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import BottomTabs from "./BottomTabs";
import NotificationDrawer from "./NotificationDrawer";

export default function DashboardShell({
  profile,
  wallet,
  unreadNotificationCount,
  children,
}: {
  profile: { id: string; full_name: string; preferred_currency: string; mobility_score: number };
  wallet: { balance_ngn: number; total_locked_ngn: number } | null;
  unreadNotificationCount: number;
  children: ReactNode;
}) {
  const [notificationDrawerOpen, setNotificationDrawerOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--off-white)", fontFamily: "Plus Jakarta Sans, sans-serif" }}>
      {/* Sidebar — desktop only */}
      <Sidebar
        profile={profile}
        wallet={wallet}
        open={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />

      {/* Main content area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Top bar */}
        <TopBar
          profile={profile}
          unreadCount={unreadNotificationCount}
          onNotificationClick={() => setNotificationDrawerOpen(true)}
          onMenuClick={() => setMobileSidebarOpen(true)}
        />

        {/* Page content */}
        <main style={{ flex: 1, padding: "1.5rem", overflowY: "auto", paddingBottom: "5rem" }}>
          {children}
        </main>
      </div>

      {/* Notification drawer */}
      <NotificationDrawer
        open={notificationDrawerOpen}
        onClose={() => setNotificationDrawerOpen(false)}
        userId={profile.id}
      />

      {/* Bottom tabs — mobile only */}
      <BottomTabs />
    </div>
  );
}
