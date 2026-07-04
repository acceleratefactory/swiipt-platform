"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateCampaignForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [rewardType, setRewardType] = useState("fixed");
  const [rewardAmountNgn, setRewardAmountNgn] = useState("");
  const [rewardPerInvite, setRewardPerInvite] = useState(false);
  const [invitesTarget, setInvitesTarget] = useState("");
  const [requiresSegment, setRequiresSegment] = useState("");
  const [minReadinessScore, setMinReadinessScore] = useState("0");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [maxParticipants, setMaxParticipants] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title) { setError("Title is required"); return; }
    setSubmitting(true);
    setError("");

    const res = await fetch("/api/admin/campaigns/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description: description || undefined,
        rewardType,
        rewardAmountNgn: rewardAmountNgn ? Number(rewardAmountNgn) : undefined,
        rewardPerInvite,
        invitesTarget: invitesTarget ? Number(invitesTarget) : undefined,
        requiresSegment: requiresSegment || undefined,
        minReadinessScore: Number(minReadinessScore),
        startsAt: startsAt || undefined,
        endsAt: endsAt || undefined,
        maxParticipants: maxParticipants ? Number(maxParticipants) : undefined,
      }),
    });

    if (!res.ok) {
      const json = await res.json();
      setError(json.error || "Failed to create campaign");
      setSubmitting(false);
      return;
    }

    router.push("/admin/campaigns");
    router.refresh();
  }

  const inputStyle = { width: "100%", padding: "0.625rem 0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", fontSize: "0.875rem", background: "white" };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: "600px", display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div>
        <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "var(--midnight)", marginBottom: "0.375rem" }}>Title *</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Referral Frenzy Q3" style={inputStyle} />
      </div>

      <div>
        <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "var(--midnight)", marginBottom: "0.375rem" }}>Description</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Campaign details, rules, and terms" style={{ ...inputStyle, resize: "vertical" }} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <div>
          <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "var(--midnight)", marginBottom: "0.375rem" }}>Reward Type</label>
          <select value={rewardType} onChange={(e) => setRewardType(e.target.value)} style={inputStyle}>
            <option value="fixed">Fixed ₦ reward</option>
            <option value="per_invite">₦ per invite</option>
            <option value="tiered">Tiered rewards</option>
          </select>
        </div>
        <div>
          <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "var(--midnight)", marginBottom: "0.375rem" }}>Reward Amount (₦)</label>
          <input type="number" value={rewardAmountNgn} onChange={(e) => setRewardAmountNgn(e.target.value)} placeholder="e.g. 5000" style={inputStyle} />
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <input type="checkbox" id="rewardPerInvite" checked={rewardPerInvite} onChange={(e) => setRewardPerInvite(e.target.checked)} style={{ accentColor: "var(--midnight)" }} />
        <label htmlFor="rewardPerInvite" style={{ fontSize: "0.8125rem", color: "var(--midnight)" }}>Reward per invite conversion (not per participant)</label>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <div>
          <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "var(--midnight)", marginBottom: "0.375rem" }}>Invites Target</label>
          <input type="number" value={invitesTarget} onChange={(e) => setInvitesTarget(e.target.value)} placeholder="e.g. 5" style={inputStyle} />
        </div>
        <div>
          <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "var(--midnight)", marginBottom: "0.375rem" }}>Max Participants</label>
          <input type="number" value={maxParticipants} onChange={(e) => setMaxParticipants(e.target.value)} placeholder="Unlimited" style={inputStyle} />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <div>
          <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "var(--midnight)", marginBottom: "0.375rem" }}>Min Readiness Score</label>
          <input type="number" value={minReadinessScore} onChange={(e) => setMinReadinessScore(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "var(--midnight)", marginBottom: "0.375rem" }}>Requires Segment</label>
          <input value={requiresSegment} onChange={(e) => setRequiresSegment(e.target.value)} placeholder="e.g. student (optional)" style={inputStyle} />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <div>
          <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "var(--midnight)", marginBottom: "0.375rem" }}>Start Date</label>
          <input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "var(--midnight)", marginBottom: "0.375rem" }}>End Date</label>
          <input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} style={inputStyle} />
        </div>
      </div>

      {error && <p style={{ fontSize: "0.8125rem", color: "#EF4444" }}>{error}</p>}

      <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
        <button type="submit" disabled={submitting} style={{ padding: "0.75rem 1.5rem", background: submitting ? "var(--gray-500)" : "var(--midnight)", color: "white", fontWeight: 700, fontSize: "0.875rem", borderRadius: "var(--radius-md)", border: "none", cursor: submitting ? "not-allowed" : "pointer" }}>
          {submitting ? "Creating..." : "Create Campaign"}
        </button>
        <a href="/admin/campaigns" style={{ padding: "0.75rem 1.5rem", color: "var(--text-muted)", fontWeight: 600, fontSize: "0.875rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", textDecoration: "none" }}>Cancel</a>
      </div>
    </form>
  );
}
/* eslint-enable @typescript-eslint/no-explicit-any */
