"use client";

import { useState } from "react";

interface Props {
  groupId: string;
  inviteCode: string;
}

export default function QuickJoinGroupButton({ groupId, inviteCode }: Props) {
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState("");

  async function handleJoin() {
    setJoining(true);
    setJoinError("");
    const res = await fetch("/api/trade-shows/join-group", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inviteCode }),
    });
    if (res.ok) {
      window.location.href = `/dashboard/trade-shows/groups/${groupId}`;
    } else {
      const data = await res.json();
      setJoinError(data.error || "Failed to join");
      setJoining(false);
    }
  }

  return (
    <div>
      <button
        onClick={handleJoin}
        disabled={joining}
        style={{
          padding: "0.625rem 1.5rem",
          background: "var(--teal)",
          color: "var(--midnight)",
          fontWeight: 700,
          fontSize: "0.875rem",
          borderRadius: "var(--radius-sm)",
          border: "none",
          cursor: joining ? "not-allowed" : "pointer",
          opacity: joining ? 0.6 : 1,
        }}
      >
        {joining ? "Joining..." : "Quick join first group"}
      </button>
      {joinError && (
        <p style={{ color: "var(--danger)", fontSize: "0.8125rem", marginTop: "0.5rem" }}>{joinError}</p>
      )}
    </div>
  );
}
