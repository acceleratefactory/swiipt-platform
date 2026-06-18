"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { X } from "lucide-react";

interface PrizeConvertModalProps {
  reward: {
    id: string;
    reward_label: string;
    milestone_type: string;
  };
  onClose: () => void;
  onConverted: (creditAmount: number) => void;
}

// Credit values per reward type — must match what is in platform_settings
const CREDIT_VALUES: Record<string, number> = {
  welcome_gift: 25000,
  streak_30day: 5000,
  streak_90day: 25000,
  "25_percent": 15000,
  "50_percent": 20000,
  "75_percent": 30000,
  spin_win: 0, // spin wins have variable amounts — handled separately
};

export default function PrizeConvertModal({ reward, onClose, onConverted }: PrizeConvertModalProps) {
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const creditAmount = CREDIT_VALUES[reward.milestone_type] || 10000;

  async function handleConvert() {
    setConfirming(true);
    setError("");

    const supabase = createClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: rpcError } = await (supabase as any).rpc("add_credit_to_wallet", {
      user_id_input: (await supabase.auth.getUser()).data.user?.id,
      credit_amount_input: creditAmount,
      reward_id_input: reward.id,
    });

    setConfirming(false);

    if (rpcError) {
      setError("Failed to convert reward. Please try again.");
      return;
    }

    setDone(true);
    onConverted(creditAmount);
  }

  if (done) {
    return (
      <>
        <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 50 }} />
        <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", background: "white", borderRadius: "var(--radius-xl)", padding: "2rem", width: "440px", maxWidth: "95vw", zIndex: 51, boxShadow: "var(--shadow-lg)", textAlign: "center" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>✓</div>
          <h3 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontWeight: 700, color: "var(--midnight)", marginBottom: "0.5rem" }}>
            ₦{creditAmount.toLocaleString()} travel credit added
          </h3>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9375rem", lineHeight: 1.6, marginBottom: "1.5rem" }}>
            Your credit is now in your wallet. Use it to reduce the price of any service or holiday on Swiipt.
          </p>
          <div style={{ background: "#FEF3C7", border: "1px solid #FDE68A", borderRadius: "var(--radius-md)", padding: "0.875rem", marginBottom: "1.5rem", fontSize: "0.8125rem", color: "#92400E", textAlign: "left" }}>
            ⚠️ <strong>Travel credit cannot be withdrawn as cash.</strong> It can only be used to pay for services, visas, flights, or holiday packages on Swiipt.
          </div>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <a href="/dashboard/services" style={{ flex: 1, padding: "0.75rem", background: "var(--teal)", color: "var(--midnight)", fontWeight: 700, fontSize: "0.875rem", borderRadius: "var(--radius-md)", textDecoration: "none", textAlign: "center" }}>
              Browse services →
            </a>
            <button onClick={onClose} style={{ padding: "0.75rem 1.25rem", background: "var(--gray-100)", color: "var(--text-secondary)", fontWeight: 600, fontSize: "0.875rem", borderRadius: "var(--radius-md)", border: "none", cursor: "pointer" }}>
              Close
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 50 }} />
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", background: "white", borderRadius: "var(--radius-xl)", padding: "2rem", width: "440px", maxWidth: "95vw", zIndex: 51, boxShadow: "var(--shadow-lg)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
          <h3 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontWeight: 700, color: "var(--midnight)" }}>
            Convert to travel credit
          </h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ background: "var(--off-white)", borderRadius: "var(--radius-md)", padding: "1.25rem", marginBottom: "1.25rem" }}>
          <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>Converting</p>
          <p style={{ fontWeight: 700, color: "var(--midnight)", fontSize: "1rem", marginBottom: "0.75rem" }}>{reward.reward_label}</p>
          <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>Credit value</p>
          <p style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1.5rem", fontWeight: 800, color: "var(--teal)" }}>
            ₦{creditAmount.toLocaleString()}
          </p>
        </div>

        <div style={{ background: "#FEF3C7", border: "1px solid #FDE68A", borderRadius: "var(--radius-md)", padding: "0.875rem", marginBottom: "1.25rem", fontSize: "0.8125rem", color: "#92400E" }}>
          <strong>Important — please read before converting:</strong>
          <ul style={{ margin: "0.5rem 0 0", paddingLeft: "1.25rem", lineHeight: 1.7 }}>
            <li>Travel credit is added directly to your wallet credit balance</li>
            <li>It <strong>cannot be withdrawn as cash</strong> under any circumstances</li>
            <li>It can only be spent on services, visas, flights, or holidays on Swiipt</li>
            <li>It will be applied automatically at checkout when you place an order</li>
            <li>Credits expire 12 months from conversion if unused</li>
          </ul>
        </div>

        {error && (
          <p style={{ color: "var(--danger)", fontSize: "0.875rem", marginBottom: "1rem" }}>{error}</p>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          <button onClick={onClose} style={{ padding: "0.75rem", background: "var(--gray-100)", color: "var(--text-secondary)", fontWeight: 600, borderRadius: "var(--radius-md)", border: "none", cursor: "pointer" }}>
            Cancel
          </button>
          <button
            onClick={handleConvert}
            disabled={confirming}
            style={{ padding: "0.75rem", background: confirming ? "var(--gray-300)" : "var(--teal)", color: confirming ? "var(--text-muted)" : "var(--midnight)", fontWeight: 700, borderRadius: "var(--radius-md)", border: "none", cursor: confirming ? "not-allowed" : "pointer" }}
          >
            {confirming ? "Converting..." : "Convert to credit ✓"}
          </button>
        </div>
      </div>
    </>
  );
}
