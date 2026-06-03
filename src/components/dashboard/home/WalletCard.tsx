"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

export default function WalletCard({
  wallet,
  profile,
  goalCount,
}: {
  wallet: { balance_ngn: number; total_locked_ngn: number; total_credits_ngn: number } | null;
  profile: { full_name: string };
  goalCount: number;
}) {
  const [balanceVisible, setBalanceVisible] = useState(true);

  const availableNGN = wallet?.balance_ngn || 0;
  const lockedNGN = wallet?.total_locked_ngn || 0;
  const creditsNGN = wallet?.total_credits_ngn || 0;
  const totalNGN = availableNGN + lockedNGN + creditsNGN;

  return (
    <div
      style={{
        background: "linear-gradient(135deg, var(--midnight) 0%, var(--midnight-muted) 100%)",
        borderRadius: "var(--radius-xl)",
        padding: "1.75rem",
        marginBottom: "1.5rem",
        color: "white",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
        <div>
          <p style={{ fontSize: "0.75rem", color: "var(--gray-500)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.375rem" }}>
            Good {getGreeting()}, {profile.full_name?.split(" ")[0]} 👋
          </p>
          <p style={{ fontSize: "0.8125rem", color: "var(--gray-300)" }}>Total balance</p>
        </div>
        <button
          onClick={() => setBalanceVisible(!balanceVisible)}
          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--gray-500)" }}
        >
          {balanceVisible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>

      {/* Total balance */}
      <div style={{ marginBottom: "1.5rem" }}>
        <p style={{ fontSize: "2.25rem", fontWeight: 800, color: "white", fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", lineHeight: 1 }}>
          {balanceVisible
            ? `₦${totalNGN.toLocaleString()}`
            : "₦ ••••••"
          }
        </p>
      </div>

      {/* Three sub-balances */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem", marginBottom: "1.5rem" }}>
        {[
          { label: "Available", value: availableNGN, color: "var(--teal)" },
          { label: "Locked", value: lockedNGN, color: "#F59E0B" },
          { label: "Credits", value: creditsNGN, color: "#A78BFA" },
        ].map((item) => (
          <div key={item.label} style={{ background: "rgba(255,255,255,0.06)", borderRadius: "var(--radius-md)", padding: "0.75rem" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: item.color, marginBottom: "0.5rem" }} />
            <p style={{ fontSize: "0.7rem", color: "var(--gray-500)", marginBottom: "0.25rem" }}>{item.label}</p>
            <p style={{ fontSize: "0.9375rem", fontWeight: 700, color: "white" }}>
              {balanceVisible ? `₦${item.value.toLocaleString()}` : "••••"}
            </p>
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem" }}>
        {[
          { label: "Add Funds", href: "/dashboard/goals", bg: "var(--teal)", color: "var(--midnight)" },
          { label: "Withdraw", href: "/dashboard/wallet", bg: "rgba(255,255,255,0.1)", color: "white" },
          { label: "New Goal", href: "/dashboard/goals/new", bg: "rgba(255,255,255,0.1)", color: "white" },
        ].map((btn) => (
          <a
            key={btn.label}
            href={btn.href}
            style={{ padding: "0.625rem", background: btn.bg, color: btn.color, fontWeight: 700, fontSize: "0.8125rem", borderRadius: "var(--radius-md)", textAlign: "center", textDecoration: "none", border: "none", cursor: "pointer" }}
          >
            {btn.label}
          </a>
        ))}
      </div>
    </div>
  );
}
