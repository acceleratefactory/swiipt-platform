"use client";

import { useState } from "react";
import { X } from "lucide-react";

interface CreateGroupBuyModalProps {
  itemType: "holiday_package" | "service";
  itemId: string;
  itemTitle: string;
  originalPrice: number;
  onClose: () => void;
}

const discounts: Record<number, number> = { 2: 10, 3: 12, 4: 15, 5: 18, 6: 20, 7: 22, 8: 25, 9: 27, 10: 30 };

export default function CreateGroupBuyModal({ itemType, itemId, itemTitle, originalPrice, onClose }: CreateGroupBuyModalProps) {
  const [groupSize, setGroupSize] = useState(4);
  const [customTitle, setCustomTitle] = useState(`Group ${itemTitle}`);
  const [creating, setCreating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const discountPct = discounts[groupSize] || 10;
  const discountedPrice = Math.round(originalPrice * (1 - discountPct / 100));
  const savings = originalPrice - discountedPrice;

  function copyLink() {
    if (!result?.inviteUrl) return;
    navigator.clipboard.writeText(result.inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleCreate() {
    setCreating(true);
    setError("");
    try {
      const res = await fetch("/api/group-buy/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemType, itemId, targetSize: groupSize, title: customTitle }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create group.");
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setCreating(false);
    }
  }

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 50 }} />
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", background: "white", borderRadius: "var(--radius-xl)", padding: "2rem", width: "460px", maxWidth: "95vw", zIndex: 51, boxShadow: "var(--shadow-lg)" }}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h3 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontWeight: 700, color: "var(--midnight)" }}>
            Create a group
          </h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
            <X size={20} />
          </button>
        </div>

        {!result ? (
          <>
            <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginBottom: "1.25rem" }}>
              Invite friends to join you. {itemType === "holiday_package" ? "The more people join, the bigger the discount for everyone." : "The more people join, the lower the price for everyone."}
            </p>

            <div style={{ marginBottom: "1rem" }}>
              <label style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--midnight)", display: "block", marginBottom: "0.375rem" }}>
                Group name
              </label>
              <input
                value={customTitle}
                onChange={e => setCustomTitle(e.target.value)}
                style={{ width: "100%", padding: "0.625rem 0.875rem", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", fontSize: "0.875rem", outline: "none", color: "var(--midnight)" }}
              />
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--midnight)", display: "block", marginBottom: "0.75rem" }}>
                Group size — {groupSize} people = {discountPct}% off
              </label>
              <input
                type="range" min={2} max={10} value={groupSize}
                onChange={e => setGroupSize(Number(e.target.value))}
                style={{ width: "100%", accentColor: "var(--teal)" }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                <span>2 people (10% off)</span>
                <span>10 people (30% off)</span>
              </div>
            </div>

            <div style={{ background: "var(--off-white)", borderRadius: "var(--radius-md)", padding: "1rem", marginBottom: "1.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem", marginBottom: "0.375rem" }}>
                <span style={{ color: "var(--text-muted)" }}>
                  {itemType === "holiday_package" ? "Solo price per person" : "Regular price"}
                </span>
                <span style={{ color: "var(--text-muted)", textDecoration: "line-through" }}>₦{originalPrice.toLocaleString()}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1rem" }}>
                <span style={{ fontWeight: 700, color: "var(--midnight)" }}>
                  {itemType === "holiday_package" ? "Group price per person" : "Group price"}
                </span>
                <span style={{ fontWeight: 800, color: "var(--teal)" }}>₦{discountedPrice.toLocaleString()}</span>
              </div>
              <p style={{ fontSize: "0.8125rem", color: "var(--teal)", textAlign: "right", marginTop: "0.25rem" }}>
                {itemType === "holiday_package"
                  ? `Each person saves ₦${savings.toLocaleString()}`
                  : `Total savings of ₦${savings.toLocaleString()}`}
              </p>
            </div>

            {error && <p style={{ color: "#EF4444", fontSize: "0.875rem", marginBottom: "1rem" }}>{error}</p>}

            <button
              onClick={handleCreate}
              disabled={creating}
              style={{ width: "100%", padding: "0.875rem", background: creating ? "var(--gray-300)" : "var(--teal)", color: creating ? "var(--text-muted)" : "var(--midnight)", fontWeight: 700, fontSize: "0.9375rem", borderRadius: "var(--radius-md)", border: "none", cursor: creating ? "not-allowed" : "pointer" }}
            >
              {creating ? "Creating group..." : "Create group and get invite link →"}
            </button>
          </>
        ) : (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🎉</div>
            <h3 style={{ fontWeight: 700, color: "var(--midnight)", marginBottom: "0.5rem" }}>Group created!</h3>
            <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginBottom: "1.5rem" }}>
              Share this link with {groupSize - 1} friend{(groupSize - 1) !== 1 ? "s" : ""}. When the group is full, everyone pays <strong>₦{discountedPrice.toLocaleString()}</strong> — saving {discountPct}%.
            </p>

            <div style={{ background: "var(--off-white)", borderRadius: "var(--radius-md)", padding: "1rem", marginBottom: "1rem", display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <p style={{ flex: 1, fontSize: "0.8125rem", color: "var(--midnight)", fontFamily: "monospace", wordBreak: "break-all", textAlign: "left" }}>
                {result.inviteUrl}
              </p>
              <button
                onClick={copyLink}
                style={{ padding: "0.5rem 0.75rem", background: copied ? "var(--teal)" : "var(--midnight)", color: "white", fontWeight: 600, fontSize: "0.75rem", borderRadius: "var(--radius-sm)", border: "none", cursor: "pointer", whiteSpace: "nowrap" }}
              >
                {copied ? "Copied ✓" : "Copy"}
              </button>
            </div>

            <div style={{ display: "flex", gap: "0.75rem" }}>
              <a href="/dashboard/groups" style={{ flex: 1, padding: "0.75rem", background: "var(--midnight)", color: "white", fontWeight: 700, fontSize: "0.875rem", borderRadius: "var(--radius-md)", textDecoration: "none", textAlign: "center" }}>
                View my groups →
              </a>
              <button onClick={onClose} style={{ padding: "0.75rem 1rem", background: "var(--gray-100)", color: "var(--text-secondary)", fontWeight: 600, borderRadius: "var(--radius-md)", border: "none", cursor: "pointer" }}>
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
