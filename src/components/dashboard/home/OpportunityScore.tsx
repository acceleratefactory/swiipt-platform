"use client";
import { useState } from "react";

interface OpportunityScoreProps {
  score: number;
  destination: string | null;
  userId: string;
}

function getOpportunityCount(score: number): number {
  return Math.round((score / 100) * 35);
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
    label: "Building foundation",
    color: "#B45309",
    message: "Create a savings goal and unlock opportunities that match your financial goals.",
    nextAction: "Create a savings goal",
    ctaHref: "/dashboard/goals",
  };
  if (score < 60) return {
    label: "Making progress",
    color: "#0D9488",
    message: "Upload your passport and key documents to unlock more opportunities.",
    nextAction: "Upload your passport",
    ctaHref: "/dashboard/documents",
  };
  if (score < 80) return {
    label: "Well prepared",
    color: "var(--teal)",
    message: "Order a service to unlock premium opportunities.",
    nextAction: "Order a service",
    ctaHref: "/dashboard/services",
  };
  return {
    label: "Move-ready",
    color: "#059669",
    message: "You are ready to move. Book your travel and start your new chapter.",
    nextAction: "Book your move",
    ctaHref: "/dashboard/flights",
  };
}

export default function OpportunityScore({ score, destination, userId }: OpportunityScoreProps) {
  const [refreshing, setRefreshing] = useState(false);
  const [currentScore, setCurrentScore] = useState(score);
  const tier = getScoreTier(currentScore);
  const opportunityCount = getOpportunityCount(currentScore);

  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (currentScore / 100) * circumference;

  async function handleRefresh() {
    setRefreshing(true);
    try {
      const res = await fetch("/api/readiness/recalculate", { method: "POST" });
      const data = await res.json();
      if (data.score !== undefined) setCurrentScore(data.score);
    } catch {
      // Fire-and-forget — don't block UI
    }
    setRefreshing(false);
  }

  return (
    <div style={{
      background: "linear-gradient(135deg, #06112B, #1A3560)",
      borderRadius: "var(--radius-xl)",
      padding: "1.5rem",
      marginBottom: "1.5rem",
      display: "flex",
      alignItems: "center",
      gap: "1.5rem",
      flexWrap: "wrap",
    }}>
      {/* Circular progress */}
      <div style={{ position: "relative", width: 128, height: 128, flexShrink: 0 }}>
        <svg width="128" height="128" style={{ transform: "rotate(-90deg)" }}>
          <circle cx="64" cy="64" r={radius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
          <circle
            cx="64" cy="64" r={radius} fill="none"
            stroke={tier.color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{ transition: "stroke-dashoffset 1s ease" }}
          />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1.875rem", fontWeight: 800, color: "white", lineHeight: 1 }}>
            {currentScore}
          </span>
          <span style={{ fontSize: "0.6875rem", color: "rgba(255,255,255,0.5)", marginTop: "2px" }}>/ 100</span>
        </div>
      </div>

      {/* Score details */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.375rem" }}>
          <span style={{ fontSize: "0.75rem", fontWeight: 700, padding: "2px 8px", borderRadius: "20px", background: `${tier.color}22`, color: tier.color }}>
            {tier.label}
          </span>
          {destination && (
            <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)" }}>
              → {destination}
            </span>
          )}
        </div>
        <p style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1.25rem", fontWeight: 800, color: "white", marginBottom: "0.25rem" }}>
          You qualify for <span style={{ color: "var(--teal)" }}>{opportunityCount} opportunities</span> today
        </p>
        <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", marginBottom: "0.5rem" }}>
          Readiness: {currentScore}/100
        </p>
        <p style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.6)", lineHeight: 1.5, marginBottom: "0.875rem" }}>
          {tier.message}
        </p>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <a href={tier.ctaHref} style={{ padding: "0.5rem 1rem", background: "var(--teal)", color: "var(--midnight)", fontWeight: 700, fontSize: "0.8125rem", borderRadius: "var(--radius-sm)", textDecoration: "none" }}>
            {tier.nextAction} →
          </a>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            style={{ padding: "0.5rem 0.875rem", background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)", fontWeight: 600, fontSize: "0.8125rem", borderRadius: "var(--radius-sm)", border: "1px solid rgba(255,255,255,0.15)", cursor: refreshing ? "not-allowed" : "pointer" }}
          >
            {refreshing ? "Updating..." : "Refresh score"}
          </button>
        </div>
      </div>
    </div>
  );
}
