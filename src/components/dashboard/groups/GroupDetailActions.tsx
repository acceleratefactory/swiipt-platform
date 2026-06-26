"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import CountdownTimer from "./CountdownTimer";

interface GroupDetailActionsProps {
  groupId: string;
  groupStatus: string;
  currentUserId: string;
  creatorId: string;
  membershipRole: string;
  membershipStatus: string;
  inviteCode: string;
  inviteUrl: string;
  groupTitle: string;
  expiresAt: string;
}

export default function GroupDetailActions({
  groupId,
  groupStatus,
  currentUserId: _currentUserId,
  creatorId: _creatorId,
  membershipRole,
  membershipStatus,
  inviteCode,
  inviteUrl,
  groupTitle: _groupTitle,
  expiresAt,
}: GroupDetailActionsProps) {
  const router = useRouter();
  const [paying, setPaying] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [payResult, setPayResult] = useState<any>(null);
  const [payError, setPayError] = useState("");
  const [leaveError, setLeaveError] = useState("");

  async function handlePay() {
    setPaying(true);
    setPayError("");
    try {
      const res = await fetch("/api/group-buy/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupBuyId: groupId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to process payment");
      setPayResult(data);
    } catch (err: any) {
      setPayError(err.message || "Something went wrong");
    } finally {
      setPaying(false);
    }
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

  if (payResult) {
    return (
      <div style={{ background: "var(--off-white)", borderRadius: "var(--radius-md)", padding: "1.25rem", marginBottom: "1.5rem" }}>
        <p style={{ fontSize: "1.5rem", marginBottom: "0.75rem", textAlign: "center" }}>🎉</p>
        <h3 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontWeight: 700, color: "var(--midnight)", marginBottom: "0.5rem", textAlign: "center" }}>
          Payment initiated
        </h3>
        <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginBottom: "1rem", textAlign: "center" }}>
          Transfer the total amount to the bank details below to complete your group purchase.
        </p>
        <div style={{ display: "grid", gap: "0.5rem", marginBottom: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "0.375rem 0", borderBottom: "1px solid var(--gray-100)" }}>
            <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>Reference</span>
            <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--midnight)" }}>{payResult.reference}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "0.375rem 0", borderBottom: "1px solid var(--gray-100)" }}>
            <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>Total</span>
            <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--midnight)" }}>₦{payResult.totalPrice?.toLocaleString()}</span>
          </div>
          {payResult.bankDetails?.bank_name && (
            <div style={{ display: "flex", justifyContent: "space-between", padding: "0.375rem 0", borderBottom: "1px solid var(--gray-100)" }}>
              <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>Bank</span>
              <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--midnight)" }}>{payResult.bankDetails.bank_name}</span>
            </div>
          )}
          {payResult.bankDetails?.bank_account_name && (
            <div style={{ display: "flex", justifyContent: "space-between", padding: "0.375rem 0", borderBottom: "1px solid var(--gray-100)" }}>
              <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>Account name</span>
              <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--midnight)" }}>{payResult.bankDetails.bank_account_name}</span>
            </div>
          )}
          {payResult.bankDetails?.bank_account_number && (
            <div style={{ display: "flex", justifyContent: "space-between", padding: "0.375rem 0", borderBottom: "1px solid var(--gray-100)" }}>
              <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>Account number</span>
              <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--midnight)" }}>{payResult.bankDetails.bank_account_number}</span>
            </div>
          )}
        </div>
        <a
          href="/dashboard/groups"
          style={{ display: "block", padding: "0.75rem", background: "var(--midnight)", color: "white", fontWeight: 700, fontSize: "0.875rem", borderRadius: "var(--radius-md)", textDecoration: "none", textAlign: "center" }}
        >
          Back to groups →
        </a>
      </div>
    );
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
          {payError && (
            <p style={{ fontSize: "0.8125rem", color: "#EF4444", marginBottom: "0.75rem" }}>{payError}</p>
          )}
          <button
            onClick={handlePay}
            disabled={paying}
            style={{
              width: "100%",
              padding: "1rem",
              background: paying ? "var(--gray-300)" : "var(--teal)",
              color: paying ? "var(--text-muted)" : "var(--midnight)",
              fontWeight: 700,
              fontSize: "1rem",
              borderRadius: "var(--radius-md)",
              border: "none",
              cursor: paying ? "not-allowed" : "pointer",
            }}
          >
            {paying ? "Processing..." : "Pay now — ₦ group price"}
          </button>
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
    </div>
  );
}
