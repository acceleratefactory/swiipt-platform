"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import CountdownTimer from "./CountdownTimer";
import GroupBuyPaymentModal from "./GroupBuyPaymentModal";

interface GroupDetailActionsProps {
  groupId: string;
  groupStatus: string;
  currentUserId: string;
  creatorId: string;
  membershipRole: string;
  membershipStatus: string;
  userConfirmedAt: string | null;
  inviteCode: string;
  inviteUrl: string;
  groupTitle: string;
  expiresAt: string;
  groupData: {
    id: string;
    item_type: "holiday_package" | "service";
    group_price_ngn: number;
    original_price_ngn: number;
    title: string;
    status: string;
  };
  activeGoals: Array<{
    id: string;
    goal_name: string;
    current_balance: number;
    currency: string;
    milestone_100_unlocked: boolean;
    status: string;
  }>;
  walletCredits: number;
  preferredCurrency: string;
}

export default function GroupDetailActions({
  groupId,
  groupStatus,
  currentUserId,
  creatorId: _creatorId,
  membershipRole,
  membershipStatus,
  userConfirmedAt,
  inviteCode,
  inviteUrl,
  groupTitle: _groupTitle,
  expiresAt,
  groupData,
  activeGoals,
  walletCredits,
  preferredCurrency,
}: GroupDetailActionsProps) {
  const router = useRouter();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [leaveError, setLeaveError] = useState("");

  // Realtime: auto-refresh when admin confirms payment
  useEffect(() => {
    if (membershipStatus !== "pending_payment" || !userConfirmedAt) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`group_buy_member:${groupId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "group_buy_members",
          filter: `group_buy_id=eq.${groupId}`,
        },
        (payload) => {
          if ((payload.new as any).user_id === currentUserId && (payload.new as any).status === "paid") {
            router.refresh();
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [groupId, currentUserId, membershipStatus, userConfirmedAt, router]);

  function handlePayClick() {
    setShowPaymentModal(true);
  }

  async function handleLeave() {
    setLeaving(true);
    setLeaveError("");
    try {
      const res = await fetch("/api/group-buy/leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupBuyId: groupId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to leave group");
      router.push("/dashboard/groups");
      router.refresh();
    } catch (err: any) {
      setLeaveError(err.message || "Something went wrong");
    } finally {
      setLeaving(false);
    }
  }

  function copyLink() {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div>
      {groupStatus === "open" && (
        <div style={{ marginBottom: "1.5rem" }}>
          <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--midnight)", marginBottom: "0.5rem" }}>Time remaining to join</p>
          <CountdownTimer expiresAt={expiresAt} />
        </div>
      )}

      {groupStatus === "filled" && membershipStatus === "committed" && (
        <div style={{ marginBottom: "1.5rem" }}>
          <button
            onClick={handlePayClick}
            style={{
              width: "100%",
              padding: "1rem",
              background: "var(--teal)",
              color: "var(--midnight)",
              fontWeight: 700,
              fontSize: "1rem",
              borderRadius: "var(--radius-md)",
              border: "none",
              cursor: "pointer",
            }}
          >
            Pay now — ₦{groupData.group_price_ngn.toLocaleString()} →
          </button>
        </div>
      )}

      {groupStatus === "filled" && membershipStatus === "pending_payment" && !userConfirmedAt && (
        <div style={{ marginBottom: "1.5rem" }}>
          <button
            onClick={handlePayClick}
            style={{
              width: "100%",
              padding: "1rem",
              background: "#FEF3C7",
              color: "#92400E",
              fontWeight: 700,
              fontSize: "1rem",
              borderRadius: "var(--radius-md)",
              border: "1px solid #FDE68A",
              cursor: "pointer",
            }}
          >
            Continue payment → (₦{groupData.group_price_ngn.toLocaleString()})
          </button>
        </div>
      )}

      {groupStatus === "filled" && membershipStatus === "pending_payment" && userConfirmedAt && (
        <div style={{ marginBottom: "1.5rem", padding: "1rem", background: "var(--teal-pale)", borderRadius: "var(--radius-md)", border: "1px solid var(--teal)" }}>
          <p style={{ fontWeight: 700, color: "var(--teal)", fontSize: "0.9375rem", marginBottom: "0.25rem" }}>
            ✓ Payment submitted
          </p>
          <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
            Awaiting admin confirmation. This usually takes 24–48 hours.
          </p>
        </div>
      )}

      <div style={{ background: "var(--off-white)", borderRadius: "var(--radius-md)", padding: "1rem", marginBottom: "1.5rem" }}>
        <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>Share invite link</p>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <p style={{ flex: 1, fontSize: "0.75rem", color: "var(--midnight)", fontFamily: "monospace", wordBreak: "break-all" }}>
            {inviteUrl}
          </p>
          <button
            onClick={copyLink}
            style={{
              padding: "0.5rem 0.75rem",
              background: copied ? "var(--teal)" : "var(--midnight)",
              color: "white",
              fontWeight: 600,
              fontSize: "0.75rem",
              borderRadius: "var(--radius-sm)",
              border: "none",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {copied ? "Copied ✓" : "Copy"}
          </button>
        </div>
        <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "0.375rem" }}>
          Invite code: <strong>{inviteCode}</strong>
        </p>
      </div>

      {groupStatus === "open" && membershipRole !== "creator" && (
        <div>
          {leaveError && (
            <p style={{ fontSize: "0.8125rem", color: "#EF4444", marginBottom: "0.75rem" }}>{leaveError}</p>
          )}
          <button
            onClick={handleLeave}
            disabled={leaving}
            style={{
              width: "100%",
              padding: "0.75rem",
              background: "transparent",
              color: "#EF4444",
              fontWeight: 600,
              fontSize: "0.875rem",
              borderRadius: "var(--radius-md)",
              border: "1px solid #EF4444",
              cursor: leaving ? "not-allowed" : "pointer",
              opacity: leaving ? 0.5 : 1,
            }}
          >
            {leaving ? "Leaving..." : "Leave group"}
          </button>
        </div>
      )}

      {showPaymentModal && (
        <GroupBuyPaymentModal
          group={groupData}
          activeGoals={activeGoals}
          walletCredits={walletCredits}
          preferredCurrency={preferredCurrency}
          userId={currentUserId}
          isResuming={membershipStatus === "pending_payment"}
          onClose={() => setShowPaymentModal(false)}
          onPaymentComplete={() => {
            setShowPaymentModal(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
