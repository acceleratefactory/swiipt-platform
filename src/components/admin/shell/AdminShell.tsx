"use client";

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
      />
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
          <a
            href="/dashboard"
            style={{
              fontSize: "0.8125rem",
              color: "var(--text-muted)",
              textDecoration: "none",
            }}
          >
            ← User dashboard
          </a>
        </div>
        <main style={{ flex: 1, padding: "1.5rem", overflowY: "auto" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
