"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { TypeStyleMap } from "@/lib/opportunity-types";
import OpportunityDetailModal from "./OpportunityDetailModal";
import FallbackTile from "./FallbackTile";
import ServiceCTA from "./ServiceCTA";

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
  is_liked?: boolean;
  like_count?: number;
  cover_image_url?: string | null;
  video_url?: string | null;
  media_type?: string | null;
  thumbnail_url?: string | null;
  media_source?: string | null;
  media_aspect_ratio?: string | null;
  org_logo_url?: string | null;
  service_cta_type?: string | null;
  service_url?: string | null;
}

interface Props {
  opportunity: Oppty;
  typeStyles: TypeStyleMap;
  onApply: (id: string) => void;
  onSave: (id: string, saved: boolean) => void;
  onDismiss?: (id: string) => void;
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

export default function OpportunityCard({ opportunity: opp, typeStyles, onApply, onSave, onDismiss }: Props) {
  const [detailOpen, setDetailOpen] = useState(false);
  const [saved, setSaved] = useState(opp.is_saved || false);
  const [liked, setLiked] = useState(opp.is_liked || false);
  const [likeCount, setLikeCount] = useState(opp.like_count || 0);
  const [applied, setApplied] = useState(opp.is_applied || false);
  const [showSharePrompt, setShowSharePrompt] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const el = cardRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        timer = setTimeout(() => {
          fetch("/api/opportunities/signal", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ opportunityId: opp.id, signalType: "view" }),
          }).catch(() => {});
        }, 2000);
      } else {
        clearTimeout(timer);
      }
    }, { threshold: 0.5 });
    observer.observe(el);
    return () => { observer.disconnect(); clearTimeout(timer); };
  }, [opp.id]);

  const initials = opp.organisation.charAt(0).toUpperCase();
  const daysLeft = getDaysLeft(opp.deadline);
  const typeStyle = typeStyles[opp.type] || { bg: "#f3f4f6", color: "#64748b", label: opp.type };
  const matchInfo = getMatchLabel(opp.relevanceScore);
  const flag = getFlag(opp.location_country);

  const hasCover = opp.cover_image_url && opp.media_source !== "fallback";

  const handleApply = useCallback(async () => {
    if (applied) return;
    setApplied(true);
    onApply(opp.id);
    window.open(`/api/opportunities/apply?id=${opp.id}`, "_blank");
    fetch("/api/opportunities/signal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ opportunityId: opp.id, signalType: "apply" }),
    }).catch(() => {});
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
    fetch("/api/opportunities/signal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ opportunityId: opp.id, signalType: "save" }),
    }).catch(() => {});
    try {
      await fetch("/api/opportunities/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ opportunityId: opp.id }),
      });
    } catch {}
  }, [opp.id, saved, onSave]);

  const handleLike = useCallback(async () => {
    const prevLiked = liked;
    const prevCount = likeCount;
    setLiked(!liked);
    setLikeCount(c => liked ? c - 1 : c + 1);
    try {
      const res = await fetch("/api/opportunities/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ opportunityId: opp.id }),
      });
      if (!res.ok) {
        setLiked(prevLiked);
        setLikeCount(prevCount);
      } else {
        const data = await res.json();
        setLiked(data.liked);
        setLikeCount(data.like_count);
      }
    } catch {
      setLiked(prevLiked);
      setLikeCount(prevCount);
    }
  }, [opp.id, liked, likeCount]);

  const handleCardClick = useCallback(() => {
    setDetailOpen(true);
    fetch("/api/opportunities/signal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ opportunityId: opp.id, signalType: "expand" }),
    }).catch(() => {});
  }, [opp.id]);

  const handleDismiss = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    fetch("/api/opportunities/signal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ opportunityId: opp.id, signalType: "dismiss" }),
    }).catch(() => {});
    onDismiss?.(opp.id);
  }, [opp.id, onDismiss]);

  const handleShare = useCallback(async () => {
    const text = `${opp.title} at ${opp.organisation} — ${opp.location_country}\n\n${opp.description.slice(0, 200)}...\n\nView on Swiipt: ${window.location.origin}/dashboard/opportunities/${opp.id}`;
    fetch("/api/opportunities/signal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ opportunityId: opp.id, signalType: "share" }),
    }).catch(() => {});
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
    <div
      ref={cardRef}
      onClick={handleCardClick}
      style={{ background: "white", borderRadius: "var(--radius-md)", border: "1px solid #e2e8f0", position: "relative", display: "flex", flexDirection: "column", gap: "0.75rem", width: "100%", cursor: "pointer", overflow: "hidden" }}
    >
      {opp.media_type !== "none" && (
        <div style={{ position: "relative", width: "100%" }}>
          {hasCover && opp.cover_image_url ? (
            <div style={{ position: "relative", width: "100%", aspectRatio: opp.media_aspect_ratio === "4:5" ? "4 / 5" : "16 / 9" }}>
              <img
                src={opp.cover_image_url}
                alt=""
                loading="lazy"
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
          ) : (
            <FallbackTile
              type={opp.type}
              organisation={opp.organisation}
              location_country={opp.location_country}
              aspectRatio={opp.media_aspect_ratio || undefined}
            />
          )}
          <div style={{ position: "absolute", top: "0.5rem", left: "0.5rem", display: "flex", gap: "0.375rem", flexWrap: "wrap" }}>
            <span style={{ fontSize: "0.6875rem", fontWeight: 600, padding: "0.125rem 0.5rem", borderRadius: "999px", background: "rgba(0,0,0,0.5)", color: "white", backdropFilter: "blur(4px)" }}>
              {flag} {opp.location_country}
            </span>
            <span style={{ fontSize: "0.6875rem", fontWeight: 600, padding: "0.125rem 0.5rem", borderRadius: "999px", background: typeStyle.bg, color: "#1e293b" }}>
              {(opp as any).is_ad ? "Sponsored" : typeStyle.label}
            </span>
          </div>
        </div>
      )}

      <div style={{ padding: opp.media_type !== "none" ? "0 1.25rem 0 1.25rem" : "1.25rem 1.25rem 0 1.25rem" }}>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
          {opp.org_logo_url ? (
            <img src={opp.org_logo_url} alt="" style={{ width: 48, height: 48, borderRadius: 12, objectFit: "cover", flexShrink: 0 }} />
          ) : (
            <div style={{ width: 48, height: 48, borderRadius: 12, background: "var(--teal)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: "1.25rem", flexShrink: 0 }}>
              {initials}
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: "0.9375rem", color: "var(--midnight)", lineHeight: 1.3, marginBottom: "0.125rem", fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
              {opp.title}
            </div>
            <div style={{ fontSize: "0.8125rem", color: "#64748b", marginBottom: "0.375rem" }}>{opp.organisation}</div>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
              {opp.ai_generated && (
                <span style={{ fontSize: "0.6875rem", color: "#0d9488", display: "flex", alignItems: "center", gap: "0.125rem" }}>
                  {"\u2705"} Trusted
                </span>
              )}
              {matchInfo && (
                <span style={{ fontSize: "0.6875rem", color: matchInfo.color }}>
                  {"\u25CF".repeat(Math.round((matchInfo.label === "Excellent match" ? 4 : matchInfo.label === "Good match" ? 3 : 2)))} Match
                </span>
              )}
              {daysLeft && (
                <span style={{ fontSize: "0.6875rem", color: daysLeft.color }}>
                  {"\u23F3"} {daysLeft.days}d
                </span>
              )}
            </div>
          </div>
          <div style={{ display: "flex", gap: "0.25rem", flexShrink: 0 }}>
            <button onClick={(e) => { e.stopPropagation(); handleSave(); }} title={saved ? "Saved" : "Save"} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.125rem", padding: "0.25rem", lineHeight: 1 }}>
              {saved ? "\uD83D\uDCCD" : "\uD83D\uDCCC"}
            </button>
            <button onClick={handleDismiss} title="Not interested" style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: "0.25rem", fontSize: "0.875rem", lineHeight: 1 }}>
              {"\u2715"}
            </button>
          </div>
        </div>

        {opp.salary_range && (
          <div style={{ fontWeight: 700, fontSize: "1rem", color: "var(--teal)", fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", marginTop: "0.5rem" }}>
            {opp.salary_range}
          </div>
        )}

        <div style={{ fontSize: "0.8125rem", color: "#64748b", lineHeight: 1.4, margin: "0.5rem 0" }}>
          <span style={descExpanded ? {} : { display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {opp.description}
          </span>
          {!descExpanded && opp.description.length > 120 && (
            <span
              onClick={(e) => { e.stopPropagation(); setDescExpanded(true); }}
              style={{ color: "var(--teal)", fontWeight: 600, cursor: "pointer", marginLeft: "0.25rem", fontSize: "0.75rem" }}
            >
              {"\u2026"}more
            </span>
          )}
        </div>
      </div>

      <div style={{ padding: "0 1.25rem 1.25rem 1.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.75rem", paddingBottom: "0.75rem", borderBottom: "1px solid #f1f5f9" }}>
          <button onClick={(e) => { e.stopPropagation(); handleLike(); }} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.8125rem", color: liked ? "#ef4444" : "#64748b", fontWeight: liked ? 700 : 400, padding: "0.25rem 0" }}>
            {liked ? "\u2764\uFE0F" : "\u2661"} <span>{likeCount}</span>
          </button>
          <button onClick={(e) => { e.stopPropagation(); handleSave(); }} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.8125rem", color: saved ? "var(--teal)" : "#64748b", fontWeight: saved ? 700 : 400, padding: "0.25rem 0" }}>
            {saved ? "\uD83D\uDCCD" : "\uD83D\uDCCC"} <span>Save</span>
          </button>
          <button onClick={(e) => { e.stopPropagation(); handleShare(); }} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.8125rem", color: "#64748b", padding: "0.25rem 0" }}>
            {"\uD83D\uDD17"} <span>Share</span>
          </button>
        </div>

        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button onClick={(e) => { e.stopPropagation(); handleApply(); }} disabled={applied} style={{ flex: 1, padding: "0.5rem 1rem", borderRadius: "var(--radius-md)", border: "none", background: applied ? "#e2e8f0" : "var(--teal)", color: applied ? "#94a3b8" : "white", fontWeight: 600, fontSize: "0.8125rem", cursor: applied ? "default" : "pointer" }}>
            {applied ? "Applied \u2705" : "Apply now \u2192"}
          </button>
        </div>

        <ServiceCTA
          type={opp.type}
          location_country={opp.location_country}
          opportunityId={opp.id}
          service_url={opp.service_url}
        />

        {opp.source_name && (
          <a href={opp.source_url || "#"} target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.6875rem", color: "#94a3b8", textDecoration: "none", marginTop: "0.25rem", display: "inline-block" }}>
            {"\uD83D\uDCD6"} Read the full guide on {opp.source_name} &rarr;
          </a>
        )}
      </div>

      {showSharePrompt && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(6,17,43,0.85)", borderRadius: "var(--radius-md)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "0.75rem", padding: "1.5rem", zIndex: 10 }}>
          <p style={{ color: "white", fontWeight: 700, fontSize: "0.9375rem", margin: 0, textAlign: "center" }}>
            Share this opportunity with friends!
          </p>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button onClick={(e) => { e.stopPropagation(); handleWhatsAppShare(); }} style={{ padding: "0.625rem 1.25rem", borderRadius: "var(--radius-md)", border: "none", background: "#25D366", color: "white", fontWeight: 600, fontSize: "0.8125rem", cursor: "pointer" }}>
              {"\uD83D\uDCF1"} WhatsApp
            </button>
            <button onClick={(e) => { e.stopPropagation(); setShowSharePrompt(false); }} style={{ padding: "0.625rem 1.25rem", borderRadius: "var(--radius-md)", border: "1px solid rgba(255,255,255,0.3)", background: "transparent", color: "white", fontWeight: 600, fontSize: "0.8125rem", cursor: "pointer" }}>
              Skip
            </button>
          </div>
        </div>
      )}

      {detailOpen && (
        <OpportunityDetailModal
          opportunity={opp}
          typeStyles={typeStyles}
          onClose={() => setDetailOpen(false)}
          onApply={handleApply}
          onSave={handleSave}
          isSaved={saved}
        />
      )}
    </div>
  );
}
