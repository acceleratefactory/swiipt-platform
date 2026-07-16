"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import FallbackTile from "./FallbackTile";
import ServiceCTA from "./ServiceCTA";
import { HeartIcon, CommentIcon, ReshareIcon, SaveIcon, ApplyIcon } from "./Icons";
import { trackSignal } from "@/lib/feed-signals";

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
  comment_count?: number;
}

interface Props {
  opportunity: Oppty;
  onApply: (id: string) => void;
  onSave: (id: string, saved: boolean) => void;
}

function getDaysLeft(deadline: string | null): { days: number; urgent: boolean } | null {
  if (!deadline) return null;
  const diff = new Date(deadline).getTime() - Date.now();
  if (diff <= 0) return null;
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return { days, urgent: days <= 7 };
}

function formatDeadline(deadline: string): string {
  return new Date(deadline).toLocaleDateString("en-NG", {
    day: "numeric", month: "long", year: "numeric",
  });
}

export default function OpportunityCard({ opportunity: opp, onApply, onSave }: Props) {
  const router = useRouter();
  const [saved, setSaved] = useState(opp.is_saved || false);
  const [liked, setLiked] = useState(opp.is_liked || false);
  const [likeCount, setLikeCount] = useState(opp.like_count || 0);
  const [applied, setApplied] = useState(opp.is_applied || false);
  const [descExpanded, setDescExpanded] = useState(false);
  const [showSharePrompt, setShowSharePrompt] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const dwellStartedAt = useRef<number | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const el = cardRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        timer = setTimeout(() => {
          trackSignal(opp.id, "view");
        }, 2000);
      } else {
        clearTimeout(timer);
      }
    }, { threshold: 0.5 });
    observer.observe(el);
    return () => { observer.disconnect(); clearTimeout(timer); };
  }, [opp.id]);

  useEffect(() => {
    if (!(opp as any).is_ad || !(opp as any).ad_data?.id) return;
    let fired = false;
    const el = cardRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !fired) {
        fired = true;
        fetch("/api/feed-ads/track-impression", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ adId: (opp as any).ad_data.id }),
        }).catch(() => {});
      }
    }, { threshold: 0.5 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [opp.id, (opp as any).ad_data?.id, (opp as any).is_ad]);

  useEffect(() => {
    if (!descExpanded) {
      if (dwellStartedAt.current !== null) {
        const elapsed = (Date.now() - dwellStartedAt.current) / 1000;
        dwellStartedAt.current = null;
        const signalType = elapsed >= 30 ? "dwell_long" : elapsed < 5 ? "dwell_short" : null;
        if (signalType) {
          trackSignal(opp.id, signalType);
        }
      }
      return;
    }
    dwellStartedAt.current = Date.now();
  }, [descExpanded, opp.id]);

  const handleAdClick = useCallback(() => {
    const adId = (opp as any).ad_data?.id;
    if (adId) {
      fetch("/api/feed-ads/track-click", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adId }),
      }).catch(() => {});
    }
    if (opp.application_url) window.open(opp.application_url, "_blank");
  }, [opp]);

  const videoAutoPlay = (() => {
    try {
      const conn = (navigator as any).connection;
      if (conn?.saveData) return false;
      if (conn?.effectiveType === "2g" || conn?.effectiveType === "slow-2g") return false;
    } catch {}
    return true;
  })();

  const daysLeft = getDaysLeft(opp.deadline);
  const hasCover = opp.cover_image_url && opp.media_source !== "fallback";
  const [coverFailed, setCoverFailed] = useState(false);
  const [coverRetry, setCoverRetry] = useState(0);
  const [coverIsPortrait, setCoverIsPortrait] = useState(false);

  // Serve external cover images via our own origin so ad-blockers / hotlink
  // protection / mixed-content rules in the browser don't suppress them.
  const coverSrc =
    opp.cover_image_url && opp.cover_image_url.startsWith("http")
      ? `/api/opportunities/cover?url=${encodeURIComponent(opp.cover_image_url)}`
      : opp.cover_image_url ?? undefined;

  // Single retry through the proxy (helps on cold-start / transient failures)
  // before falling back to the branded tile.
  const proxiedSrc =
    coverRetry > 0 && coverSrc?.startsWith("/api/opportunities/cover")
      ? `${coverSrc}&r=${coverRetry}`
      : coverSrc;

  const handleApply = useCallback(() => {
    if (applied) return;
    setApplied(true);
    onApply(opp.id);
    window.open(`/api/opportunities/apply?id=${opp.id}`, "_blank");
    trackSignal(opp.id, "apply");
    setTimeout(() => setShowSharePrompt(true), 2000);
  }, [opp.id, applied, onApply]);

  const handleSave = useCallback(async () => {
    const next = !saved;
    setSaved(next);
    onSave(opp.id, next);
    trackSignal(opp.id, "save");
    try {
      await fetch("/api/opportunities/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ opportunityId: opp.id, saved: next }),
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

  const handleShare = useCallback(async () => {
    const text = `${opp.title} at ${opp.organisation} — ${opp.location_country}\n\n${opp.description.slice(0, 200)}...\n\nView on Swiipt: ${window.location.origin}/dashboard/opportunities/${opp.id}`;
    trackSignal(opp.id, "share");
    if (navigator.share) {
      try { await navigator.share({ title: opp.title, text }); } catch {}
    } else {
      try { await navigator.clipboard.writeText(text); } catch {}
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
      style={{ display: "flex", flexDirection: "column", width: "100%", position: "relative", marginBottom: "0.75rem" }}
    >
      {(
        <div style={{ width: "100%", position: "relative" }}>
          {opp.video_url ? (
            <div style={{ width: "100%", aspectRatio: "4 / 5", position: "relative" }}>
              <video
                ref={videoRef}
                src={opp.video_url}
                poster={opp.thumbnail_url || undefined}
                muted
                playsInline
                autoPlay={videoAutoPlay}
                preload={videoAutoPlay ? "metadata" : "none"}
                onClick={(e) => { e.stopPropagation(); const v = videoRef.current; if (v) { if (v.paused) { v.play(); } else { v.pause(); } } }}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", cursor: "pointer" }}
              />
            </div>
          ) : hasCover && opp.cover_image_url && !coverFailed ? (
            <img
              src={proxiedSrc}
              alt=""
              loading="lazy"
              style={
                coverIsPortrait
                  ? { width: "100%", aspectRatio: "4 / 5", objectFit: "cover", display: "block" }
                  : { width: "100%", height: "auto", display: "block" }
              }
              onLoad={(e) => {
                const img = e.currentTarget;
                if (img.naturalHeight > img.naturalWidth) setCoverIsPortrait(true);
              }}
              onError={() => {
                if (coverRetry < 1) setCoverRetry((n) => n + 1);
                else setCoverFailed(true);
              }}
            />
          ) : (
            <div style={{ width: "100%", aspectRatio: "4 / 5", position: "relative" }}>
              <FallbackTile
                type={opp.type}
                organisation={opp.organisation}
                location_country={opp.location_country}
                title={opp.title}
                logoUrl={opp.org_logo_url}
              />
            </div>
          )}
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 80, background: "linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 100%)", pointerEvents: "none", zIndex: 1 }} />
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, display: "flex", alignItems: "center", gap: "0.5rem", padding: "8px 12px", zIndex: 2 }}>
            {opp.org_logo_url ? (
              <img src={opp.org_logo_url} alt="" style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(255,255,255,0.8)" }} />
            ) : (
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.9)", display: "flex", alignItems: "center", justifyContent: "center", color: "#000000", fontWeight: 700, fontSize: "0.75rem", flexShrink: 0 }}>
                {opp.organisation.charAt(0).toUpperCase()}
              </div>
            )}
            <span style={{ fontWeight: 600, fontSize: "0.8125rem", color: "white", textShadow: "0 1px 3px rgba(0,0,0,0.5)" }}>{opp.organisation}</span>
            {(opp as any).is_ad && (
              <span style={{ fontSize: "0.6875rem", color: "rgba(255,255,255,0.7)" }}>· Sponsored</span>
            )}
          </div>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem 0.75rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <button onClick={(e) => { e.stopPropagation(); handleLike(); }} title="Like" style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", gap: "0.25rem", height: 40 }}>
            <HeartIcon filled={liked} />
            <span style={{ fontSize: "0.8125rem", color: "#000000", fontWeight: 400 }}>{likeCount}</span>
          </button>
          <button onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/opportunities/${opp.id}`); }} title="Comment" style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", gap: "0.25rem", height: 40 }}>
            <CommentIcon count={opp.comment_count} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); handleShare(); }} title="Share" style={{ background: "none", border: "none", cursor: "pointer", padding: 0, height: 40 }}>
            <ReshareIcon />
          </button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <button onClick={(e) => { e.stopPropagation(); handleSave(); }} title={saved ? "Saved" : "Save"} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, height: 40 }}>
            <SaveIcon filled={saved} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); if ((opp as any).is_ad) { handleAdClick(); } else { handleApply(); } }} title="Apply" style={{ background: "none", border: "none", cursor: "pointer", padding: 0, height: 40 }}>
            <ApplyIcon />
          </button>
        </div>
      </div>

      <div style={{ padding: "0 0.75rem" }}>
        <div style={{ fontSize: "0.8125rem", color: "#000000", fontWeight: 600 }}>
          {opp.title}{opp.location_country ? ` — ${opp.location_country}` : ""}
        </div>

        {(daysLeft || opp.salary_range) && (
          <div style={{ fontSize: "0.75rem", color: "#8e8e8e", display: "flex", alignItems: "center", gap: "0.375rem", marginTop: "0.125rem" }}>
            {opp.salary_range && <span style={{ color: "#000000", fontWeight: 600, fontSize: "0.8125rem" }}>{opp.salary_range}</span>}
            {daysLeft && (
              <span>{daysLeft.urgent ? "\u23F0" : "\u23F3"} {daysLeft.days}d</span>
            )}
          </div>
        )}
      </div>

      <div style={{ fontSize: "0.8125rem", color: "#000000", lineHeight: 1.4, marginTop: "0.25rem", padding: "0 0.75rem" }}>
        <span style={descExpanded ? {} : { display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {opp.description}
        </span>
        {!descExpanded && opp.description.length > 120 && (
          <span
            onClick={(e) => { e.stopPropagation(); setDescExpanded(true); trackSignal(opp.id, "expand"); }}
            style={{ color: "#8e8e8e", cursor: "pointer", marginLeft: "0.25rem", fontSize: "0.8125rem" }}
          >
            more
          </span>
        )}
      </div>

      {descExpanded && (
        <div style={{ fontSize: "0.8125rem", color: "#000000", lineHeight: 1.5, marginTop: "0.5rem", padding: "0 0.75rem" }}>
          {opp.requirements && (
            <p style={{ margin: "0.25rem 0" }}>
              <strong>Requirements:</strong> {opp.requirements}
            </p>
          )}
          <ServiceCTA
            type={opp.type}
            location_country={opp.location_country}
            opportunityId={opp.id}
            service_url={opp.service_url}
          />
          {opp.source_name && (() => {
            const guideUrl = opp.application_url || opp.source_url || "";
            const validGuideUrl = /^https?:\/\//i.test(guideUrl);
            return validGuideUrl ? (
              <a href={guideUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#000000", textDecoration: "none", display: "inline-block", marginTop: "0.25rem" }}>
                {"\uD83D\uDCD6"} Read the full guide on {opp.source_name} {"\u2192"}
              </a>
            ) : (
              <p style={{ margin: "0.25rem 0", color: "#8e8e8e" }}>
                Source: {opp.source_name}
              </p>
            );
          })()}
          {opp.deadline && (
            <p style={{ margin: "0.25rem 0", color: "#8e8e8e" }}>
              Apply by: {formatDeadline(opp.deadline)}
            </p>
          )}
        </div>
      )}

      {showSharePrompt && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(6,17,43,0.85)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "0.75rem", padding: "1.5rem", zIndex: 10 }}>
          <p style={{ color: "white", fontWeight: 700, fontSize: "0.9375rem", margin: 0, textAlign: "center" }}>
            Share this opportunity with friends!
          </p>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button onClick={(e) => { e.stopPropagation(); handleWhatsAppShare(); }} style={{ padding: "0.625rem 1.25rem", borderRadius: 8, border: "none", background: "#25D366", color: "white", fontWeight: 600, fontSize: "0.8125rem", cursor: "pointer" }}>
              {"\uD83D\uDCF1"} WhatsApp
            </button>
            <button onClick={(e) => { e.stopPropagation(); setShowSharePrompt(false); }} style={{ padding: "0.625rem 1.25rem", borderRadius: 8, border: "1px solid rgba(255,255,255,0.3)", background: "transparent", color: "white", fontWeight: 600, fontSize: "0.8125rem", cursor: "pointer" }}>
              Skip
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
