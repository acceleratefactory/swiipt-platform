"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function JoinGroupSection({ inviteCode }: { inviteCode: string }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUserId(data.user.id);
    });
  }, []);

  async function handleJoin() {
    setJoining(true);
    setError("");
    try {
      const res = await fetch("/api/group-buy/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to join group");
      setJoined(true);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setJoining(false);
    }
  }

  if (joined) {
    return (
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🎉</div>
        <h3 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontWeight: 700, color: "var(--midnight)", marginBottom: "0.5rem" }}>
          You joined the group!
        </h3>
        <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginBottom: "1.5rem" }}>
          You are now part of this group. You will be notified when the group is full and ready for payment.
        </p>
        <a
          href="/dashboard/groups"
          style={{ display: "block", padding: "0.75rem", background: "var(--midnight)", color: "white", fontWeight: 700, fontSize: "0.9375rem", borderRadius: "var(--radius-md)", textDecoration: "none", textAlign: "center" }}
        >
          View my groups →
        </a>
      </div>
    );
  }

  if (userId) {
    return (
      <div>
        {error && (
          <p style={{ fontSize: "0.8125rem", color: "#EF4444", textAlign: "center", marginBottom: "1rem" }}>{error}</p>
        )}
        <button
          onClick={handleJoin}
          disabled={joining}
          style={{
            width: "100%",
            padding: "1rem",
            background: joining ? "var(--gray-300)" : "var(--teal)",
            color: joining ? "var(--text-muted)" : "var(--midnight)",
            fontWeight: 700,
            fontSize: "1rem",
            borderRadius: "var(--radius-md)",
            border: "none",
            cursor: joining ? "not-allowed" : "pointer",
          }}
        >
          {joining ? "Joining group..." : "Join this group →"}
        </button>
      </div>
    );
  }

  return (
    <div>
      <a
        href={`/signup?return=/join/${inviteCode}`}
        style={{ display: "block", padding: "1rem", background: "var(--teal)", color: "var(--midnight)", fontWeight: 700, fontSize: "1rem", borderRadius: "var(--radius-md)", textDecoration: "none", textAlign: "center", marginBottom: "0.75rem" }}
      >
        Join this group →
      </a>
      <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", textAlign: "center" }}>
        Already have an account? <a href={`/login?return=/join/${inviteCode}`} style={{ color: "var(--teal)" }}>Sign in</a>
      </p>
    </div>
  );
}
