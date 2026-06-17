"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import AdminSidebar from "./AdminSidebar";

export default function AdminShell({
  adminEmail,
  adminRole,
  pendingDeposits,
  pendingWithdrawals,
  children,
}: {
  adminEmail: string;
  adminRole: string;
  pendingDeposits: number;
  pendingWithdrawals: number;
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "var(--gray-100)",
        fontFamily: "Plus Jakarta Sans, sans-serif",
        fontSize: "0.875rem",
      }}
    >
      <AdminSidebar
        pendingDeposits={pendingDeposits}
        pendingWithdrawals={pendingWithdrawals}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            zIndex: 25,
            display: "block",
          }}
          className="admin-sidebar-overlay"
        />
      )}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
        }}
      >
        <div
          style={{
            background: "white",
            borderBottom: "1px solid var(--border)",
            padding: "0.75rem 1.5rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <button
              onClick={() => setSidebarOpen(true)}
              className="admin-hamburger"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "4px",
                color: "var(--midnight)",
                display: "none",
              }}
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
            <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
              Signed in as{" "}
              <strong style={{ color: "var(--midnight)" }}>{adminEmail}</strong>
              <span
                style={{
                  marginLeft: "0.5rem",
                  padding: "2px 8px",
                  background: "var(--teal-pale)",
                  color: "var(--teal)",
                  borderRadius: "20px",
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                }}
              >
                {adminRole}
              </span>
            </span>
          </div>
          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            <a href="/dashboard" style={{ fontSize: "0.8125rem", color: "var(--text-muted)", textDecoration: "none" }}>
              ← User dashboard
            </a>
            <button
              onClick={async () => {
                const supabase = createClient();
                await supabase.auth.signOut();
                window.location.href = "/login";
              }}
              style={{ fontSize: "0.8125rem", color: "var(--danger)", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}
            >
              Sign out
            </button>
          </div>
        </div>
        <main style={{ flex: 1, padding: "1.5rem", overflowY: "auto" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
