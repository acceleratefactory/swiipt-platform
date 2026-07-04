"use client";

import { useState, useCallback } from "react";

interface Oppty {
  id: string;
  title: string;
  organisation: string;
  location_country: string;
  location_city: string | null;
  type: string;
  description: string;
  requirements: string | null;
  salary_range: string | null;
  funding_amount: string | null;
  deadline: string | null;
  application_url: string;
  is_featured: boolean;
  related_service_slug: string | null;
  related_goal_template_id: string | null;
  source_url: string | null;
  source_name: string | null;
  ai_generated: boolean;
  ai_relevance_score: number | null;
  relevanceScore?: number;
  is_saved?: boolean;
  is_applied?: boolean;
}

interface Props {
  opportunity: Oppty;
  userTier: string;
  onApply: (id: string) => void;
  onSave: (id: string, saved: boolean) => void;
}

const COUNTRY_FLAGS: Record<string, string> = {
  usa: "\uD83C\uDDFA\uD83C\uDDF8",
  "united states": "\uD83C\uDDFA\uD83C\uDDF8",
  "uk": "\uD83C\uDDEC\uD83C\uDDE7",
  "united kingdom": "\uD83C\uDDEC\uD83C\uDDE7",
  canada: "\uD83C\uDDE8\uD83C\uDDE6",
  germany: "\uD83C\uDDE9\uD83C\uDDEA",
  sweden: "\uD83C\uDDF8\uD83C\uDDEA",
  denmark: "\uD83C\uDDE9\uD83C\uDDF0",
  china: "\uD83C\uDDE8\uD83C\uDDF3",
  uae: "\uD83C\uDDE6\uD83C\uDDEA",
  global: "\uD83C\uDF0D",
  multiple: "\uD83C\uDF0D",
};

const TYPE_STYLES: Record<string, { bg: string; label: string }> = {
  job: { bg: "#dbeafe", label: "Job" },
  scholarship: { bg: "#e9d5ff", label: "Scholarship" },
  visa_programme: { bg: "#ccfbf1", label: "Visa Programme" },
  sports_trial: { bg: "#fed7aa", label: "Trial" },
  remote_work: { bg: "#dbeafe", label: "Remote" },
  training: { bg: "#fef3c7", label: "Training" },
};

function getFlag(country: string): string {
  const c = country?.toLowerCase().trim();
  return COUNTRY_FLAGS[c] || "\uD83C\uDF0D";
}

function getDaysLeft(deadline: string | null): { days: number; color: string } | null {
  if (!deadline) return null;
  const diff = new Date(deadline).getTime() - Date.now();
  if (diff <= 0) return null;
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  let color = "#6b7280";
  if (days <= 7) color = "#ef4444";
  else if (days <= 14) color = "#f59e0b";
  return { days, color };
}

function getMatchLabel(score: number | undefined): { label: string; color: string } | null {
  if (score === undefined || score === null) return null;
  if (score >= 80) return { label: "Excellent match", color: "#0d9488" };
  if (score >= 50) return { label: "Good match", color: "#2563eb" };
  return { label: "Fair match", color: "#d97706" };
}

export default function OpportunityCard({ opportunity: opp, userTier, onApply, onSave }: Props) {
  const [saved, setSaved] = useState(opp.is_saved || false);
  const [applied, setApplied] = useState(opp.is_applied || false);
  const [showSharePrompt, setShowSharePrompt] = useState(false);

  const initials = opp.organisation.charAt(0).toUpperCase();
  const daysLeft = getDaysLeft(opp.deadline);
  const typeStyle = TYPE_STYLES[opp.type] || { bg: "#f3f4f6", label: opp.type };
  const matchInfo = getMatchLabel(opp.relevanceScore);
  const showAIMatch = matchInfo && (userTier === "plus" || userTier === "pro" || userTier === "ambassador");
  const flag = getFlag(opp.location_country);

  const handleApply = useCallback(async () => {
    if (applied) return;
    setApplied(true);
    onApply(opp.id);
    try {
      await fetch("/api/opportunities/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ opportunityId: opp.id, action: "apply" }),
      });
    } catch {}
    setTimeout(() => setShowSharePrompt(true), 2000);
  }, [opp.id, applied, onApply]);

  const handleSave = useCallback(async () => {
    const next = !saved;
    setSaved(next);
    onSave(opp.id, next);
    try {
      await fetch("/api/opportunities/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ opportunityId: opp.id }),
      });
    } catch {}
  }, [opp.id, saved, onSave]);

  const handleShare = useCallback(async () => {
    const text = `${opp.title} at ${opp.organisation} — ${opp.location_country}\n\n${opp.description.slice(0, 200)}...\n\nView on Swiipt: ${window.location.origin}/dashboard/opportunities/${opp.id}`;
    if (navigator.share) {
      try { await navigator.share({ title: opp.title, text }); } catch {}
    } else {
      try {
        await navigator.clipboard.writeText(text);
      } catch {}
    }
  }, [opp]);

  const handleWhatsAppShare = useCallback(() => {
    const text = encodeURIComponent(
      `I just applied for "${opp.title}" at ${opp.organisation} — ${opp.location_country} on Swiipt! Check it out: ${window.location.origin}/dashboard/opportunities/${opp.id}`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
    setShowSharePrompt(false);
  }, [opp]);

  return (
    <div style={{ background: "white", borderRadius: "var(--radius-md)", border: "1px solid #e2e8f0", padding: "1.25rem", position: "relative", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
        <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--teal)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: "1rem", flexShrink: 0 }}>
          {initials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: "0.9375rem", color: "var(--midnight)", lineHeight: 1.3, marginBottom: "0.125rem", fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif" }}>
            {opp.title}
          </div>
          <div style={{ fontSize: "0.8125rem", color: "#64748b" }}>{opp.organisation}</div>
        </div>
        <div style={{ display: "flex", gap: "0.25rem", flexShrink: 0 }}>
          <button onClick={handleSave} title={saved ? "Saved" : "Save"} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.125rem", padding: "0.25rem", lineHeight: 1 }}>
            {saved ? "\uD83D\uDCCD" : "\uD83D\uDCCC"}
          </button>
        </div>
      </div>

      {opp.salary_range && (
        <div style={{ fontWeight: 700, fontSize: "1rem", color: "var(--teal)", fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif" }}>
          {opp.salary_range}
        </div>
      )}

      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ fontSize: "0.8125rem", color: "#475569", display: "flex", alignItems: "center", gap: "0.25rem" }}>
          {flag} {opp.location_city ? `${opp.location_city}, ` : ""}{opp.location_country}
        </span>
        <span style={{ fontSize: "0.6875rem", fontWeight: 600, padding: "0.125rem 0.5rem", borderRadius: "999px", background: typeStyle.bg, color: "#1e293b" }}>
          {typeStyle.label}
        </span>
        {daysLeft && (
          <span style={{ fontSize: "0.6875rem", fontWeight: 600, padding: "0.125rem 0.5rem", borderRadius: "999px", background: "#fef3c7", color: daysLeft.color }}>
            {"\u23F0"} {daysLeft.days}d left
          </span>
        )}
        {showAIMatch && (
          <span style={{ fontSize: "0.6875rem", fontWeight: 600, padding: "0.125rem 0.5rem", borderRadius: "999px", background: matchInfo!.color + "20", color: matchInfo!.color }}>
            {matchInfo!.label}
          </span>
        )}
      </div>

      <p style={{ fontSize: "0.8125rem", color: "#64748b", lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", margin: 0 }}>
        {opp.description}
      </p>

      <div style={{ display: "flex", gap: "0.5rem", marginTop: "auto" }}>
        <button onClick={handleApply} disabled={applied} style={{ flex: 1, padding: "0.5rem 1rem", borderRadius: "var(--radius-md)", border: "none", background: applied ? "#e2e8f0" : "var(--teal)", color: applied ? "#94a3b8" : "white", fontWeight: 600, fontSize: "0.8125rem", cursor: applied ? "default" : "pointer" }}>
          {applied ? "Applied \u2705" : "Apply now \u2192"}
        </button>
        <button onClick={handleShare} style={{ padding: "0.5rem 0.75rem", borderRadius: "var(--radius-md)", border: "1px solid #e2e8f0", background: "white", color: "#475569", fontWeight: 600, fontSize: "0.8125rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.25rem" }}>
          {"\uD83D\uDD17"} Share
        </button>
      </div>

      {opp.related_service_slug && (
        <a href={`/services/${opp.related_service_slug}`} style={{ fontSize: "0.75rem", color: "var(--teal)", fontWeight: 600, textDecoration: "none", display: "flex", alignItems: "center", gap: "0.25rem" }}>
          {"\uD83D\uDEE2\uFE0F"} Need a {opp.location_country} visa? We can help &rarr;
        </a>
      )}

      {opp.source_name && (
        <a href={opp.source_url || "#"} target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.6875rem", color: "#94a3b8", textDecoration: "none", marginTop: "0.25rem" }}>
          {"\uD83D\uDCD6"} Read the full guide on {opp.source_name} &rarr;
        </a>
      )}

      {showSharePrompt && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(6,17,43,0.85)", borderRadius: "var(--radius-md)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "0.75rem", padding: "1.5rem", zIndex: 10 }}>
          <p style={{ color: "white", fontWeight: 700, fontSize: "0.9375rem", margin: 0, textAlign: "center" }}>
            Share this opportunity with friends!
          </p>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button onClick={handleWhatsAppShare} style={{ padding: "0.625rem 1.25rem", borderRadius: "var(--radius-md)", border: "none", background: "#25D366", color: "white", fontWeight: 600, fontSize: "0.8125rem", cursor: "pointer" }}>
              {"\uD83D\uDCF1"} WhatsApp
            </button>
            <button onClick={() => setShowSharePrompt(false)} style={{ padding: "0.625rem 1.25rem", borderRadius: "var(--radius-md)", border: "1px solid rgba(255,255,255,0.3)", background: "transparent", color: "white", fontWeight: 600, fontSize: "0.8125rem", cursor: "pointer" }}>
              Skip
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
