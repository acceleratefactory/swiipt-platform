"use client";
import { useState, useEffect } from "react";
import SuccessStoryForm from "./SuccessStoryForm";

interface SuccessStoryPromptProps {
  userId: string;
  firstName: string;
  hasCompletedService: boolean;
  serviceName?: string;
  destinationPrefill?: string;
}

export default function SuccessStoryPrompt({ userId, firstName, hasCompletedService, serviceName, destinationPrefill }: SuccessStoryPromptProps) {
  const [dismissed, setDismissed] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [hasStory, setHasStory] = useState(false);

  useEffect(() => {
    if (!hasCompletedService) return;
    (async () => {
      const supabase = (await import("@/lib/supabase/client")).createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from("success_stories")
        .select("id")
        .eq("user_id", userId)
        .limit(1);
      if (data?.length) setHasStory(true);
    })();
  }, [hasCompletedService, userId]);

  if (!hasCompletedService || hasStory || dismissed) return null;

  if (showForm) {
    return (
      <SuccessStoryForm
        firstName={firstName}
        serviceName={serviceName || "your service"}
        destinationPrefill={destinationPrefill}
        onClose={() => setShowForm(false)}
        onSubmit={() => { setShowForm(false); setHasStory(true); }}
      />
    );
  }

  return (
    <div
      style={{
        background: "linear-gradient(135deg, var(--midnight-light), var(--midnight))",
        borderRadius: "var(--radius-lg)",
        padding: "1.25rem 1.5rem",
        marginBottom: "1.5rem",
        border: "1px solid rgba(0,200,150,0.25)",
        display: "flex",
        alignItems: "center",
        gap: "1rem",
        flexWrap: "wrap",
      }}
    >
      <span style={{ fontSize: "2rem" }}>🌟</span>
      <div style={{ flex: 1, minWidth: "200px" }}>
        <p style={{ fontSize: "0.9375rem", fontWeight: 700, color: "white", marginBottom: "0.125rem" }}>Your story could inspire someone</p>
        <p style={{ fontSize: "0.8125rem", color: "var(--gray-500)" }}>
          You completed a service on Swiipt! Share your journey to help others planning their move.
        </p>
      </div>
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
        <button
          onClick={() => setShowForm(true)}
          style={{
            padding: "0.5rem 1rem", background: "var(--teal)", color: "var(--midnight)",
            border: "none", borderRadius: "var(--radius-md)", fontSize: "0.8125rem", fontWeight: 700, cursor: "pointer",
          }}
        >
          Share my story →
        </button>
        <button
          onClick={() => setDismissed(true)}
          style={{
            padding: "0.5rem 1rem", background: "transparent", color: "var(--gray-500)",
            border: "1px solid rgba(255,255,255,0.1)", borderRadius: "var(--radius-md)", fontSize: "0.8125rem", cursor: "pointer",
          }}
        >
          Maybe later
        </button>
      </div>
    </div>
  );
}
