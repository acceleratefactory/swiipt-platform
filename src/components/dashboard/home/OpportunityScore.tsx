"use client";
import { useState } from "react";

interface OpportunityScoreProps {
  score: number;
  opportunityCount: number;
  destination: string | null;
  userId: string;
}

function getScoreTier(score: number): { label: string; color: string; message: string; nextAction: string; ctaHref: string } {
  if (score < 20) return {
    label: "Getting started",
    color: "#6B7280",
    message: "Complete your profile to unlock more opportunities tailored to you.",
    nextAction: "Complete your profile",
    ctaHref: "/dashboard/settings",
  };
  if (score < 40) return {
    label: "Building profile",
    color: "#3B82F6",
    message: "You are building your profile. Add documents and create savings goals to increase your readiness.",
    nextAction: "Create a goal",
    ctaHref: "/dashboard/goals/new",
  };
  if (score < 60) return {
    label: "Getting ready",
    color: "#F59E0B",
    message: "You are making progress. Keep saving and uploading documents to unlock more opportunities.",
    nextAction: "Upload documents",
    ctaHref: "/dashboard/documents",
  };
  if (score < 80) return {
    label: "Almost there",
    color: "#0D9488",
    message: "You are almost there! A few more steps to maximise your readiness score.",
    nextAction: "View opportunities",
    ctaHref: "/dashboard/opportunities",
  };
  return {
    label: "Move-ready",
    color: "#10B981",
    message: "You are ready to move. Explore opportunities that match your profile.",
    nextAction: "Explore opportunities",
    ctaHref: "/dashboard/opportunities",
  };
}

export default function OpportunityScore({ score, opportunityCount, destination, userId }: OpportunityScoreProps) {
  const [refreshing, setRefreshing] = useState(false);
  const tier = getScoreTier(score);
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await fetch("/api/readiness/recalculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      window.location.reload();
    } catch {
      setRefreshing(false);
    }
  }

  return (
    <div style={{ background: "linear-gradient(135deg, #06112B, #1A3560)", borderRadius: "var(--radius-lg)", padding: "1.25rem", display: "flex", alignItems: "center", gap: "1.25rem", marginBottom: "1.5rem" }}>
      <div style={{ position: "relative", width: 120, height: 120, flexShrink: 0 }}>
        <svg width="120" height="120" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
          <circle
            cx="60" cy="60" r={radius}
            fill="none" stroke={tier.color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform="rotate(-90 60 60)"
            style={{ transition: "stroke-dashoffset 0.6s ease" }}
          />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1.875rem", fontWeight: 800, color: "white", lineHeight: 1 }}>
            {opportunityCount}
          </span>
          <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)", marginTop: "2px" }}>opportunities</span>
        </div>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
          <span style={{ fontSize: "0.6875rem", fontWeight: 700, padding: "0.125rem 0.5rem", borderRadius: "999px", background: tier.color + "30", color: tier.color }}>
            {tier.label}
          </span>
          <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)" }}>
            Readiness: {score}/100
          </span>
        </div>
        <p style={{ fontSize: "0.9375rem", fontWeight: 700, color: "white", margin: "0 0 0.25rem 0" }}>
          You qualify for <span style={{ color: "var(--teal)" }}>{opportunityCount} opportunities</span> today
        </p>
        <p style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.6)", margin: 0 }}>
          {tier.message}
        </p>
        <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem" }}>
          <a href={tier.ctaHref} style={{ padding: "0.375rem 1rem", borderRadius: "var(--radius-md)", background: "var(--teal)", color: "var(--midnight)", fontWeight: 700, fontSize: "0.75rem", textDecoration: "none" }}>
            {tier.nextAction} &rarr;
          </a>
          <button onClick={handleRefresh} disabled={refreshing} style={{ padding: "0.375rem 0.75rem", borderRadius: "var(--radius-md)", border: "1px solid rgba(255,255,255,0.2)", background: "transparent", color: "rgba(255,255,255,0.6)", fontSize: "0.75rem", cursor: "pointer" }}>
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {destination && (
          <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", marginTop: "0.5rem" }}>
            Target destination: <span style={{ color: "rgba(255,255,255,0.7)" }}>{destination}</span>
          </p>
        )}
      </div>
    </div>
  );
}
