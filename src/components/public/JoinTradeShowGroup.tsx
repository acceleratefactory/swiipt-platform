"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function JoinTradeShowGroup({ inviteCode }: { inviteCode: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");

  async function handleJoin() {
    setJoining(true);
    setError("");

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push(`/login?return=/join/trade-show/${inviteCode}`);
      return;
    }

    const res = await fetch("/api/trade-shows/join-group", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inviteCode }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Failed to join group");
      setJoining(false);
      return;
    }

    router.push(`/dashboard/trade-shows/groups/${data.groupId}`);
    router.refresh();
  }

  return (
    <div>
      {error && (
        <p style={{ fontSize: "0.8125rem", color: "#EF4444", textAlign: "center", marginBottom: "0.75rem" }}>
          {error}
        </p>
      )}
      <button
        onClick={handleJoin}
        disabled={joining}
        style={{
          width: "100%",
          padding: "0.75rem 1.5rem",
          background: "var(--teal)",
          color: "var(--midnight)",
          fontWeight: 700,
          fontSize: "0.9375rem",
          border: "none",
          borderRadius: "var(--radius-sm)",
          cursor: joining ? "not-allowed" : "pointer",
          opacity: joining ? 0.6 : 1,
        }}
      >
        {joining ? "Joining..." : "Join this group"}
      </button>
    </div>
  );
}
