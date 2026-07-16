"use client";

import { useState, useEffect, useRef, useCallback, useMemo, Fragment } from "react";
import { useRouter } from "next/navigation";
import OpportunityCard from "./OpportunityCard";

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
  created_at?: string;
  relevanceScore?: number;
  is_saved?: boolean;
  is_applied?: boolean;
}

interface Props {
  allOpportunities: Oppty[];
  userTier: string;
  referralLink?: string;
}

interface DisplayItem {
  opp: Oppty;
  loopIndex: number;
  posInLoop: number;
}

const PAGE_SIZE = 10;
const TOP_MATCH_THRESHOLD = 70;
const TOP_MATCH_COUNT = 8;

function AnimatedCard({ children, delay }: { children: React.ReactNode; delay: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(16px)",
        transition: `opacity 0.35s ease ${delay}ms, transform 0.35s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

export default function OpportunityFeed({ allOpportunities, userTier, referralLink }: Props) {
  const [displayed, setDisplayed] = useState<DisplayItem[]>([]);
  const [page, setPage] = useState(1);
  const [applyCount, setApplyCount] = useState(0);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const visible = allOpportunities;

  // Fix 3: a deduplicated list of genuinely high-relevance matches (not a
  // single repeated card). Only items scoring >= threshold qualify; capped at
  // K so we feature a handful of DISTINCT matches, each shown once.
  const topMatches = useMemo(() => {
    const seen = new Set<string>();
    const distinct: Oppty[] = [];
    for (const o of [...visible]
      .filter((o) => (o.relevanceScore || 0) >= TOP_MATCH_THRESHOLD)
      .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))) {
      if (!seen.has(o.id)) {
        seen.add(o.id);
        distinct.push(o);
      }
    }
    return distinct.slice(0, TOP_MATCH_COUNT);
  }, [visible]);

  // Build `count` display items by cycling through the ranked pool. Once the
  // pool is exhausted we wrap back to the start (loopIndex increments each
  // full cycle) so the feed never hard-ends. loopIndex/posInLoop drive the
  // composite React key and the "caught up" divider.
  const buildDisplayed = useCallback(
    (count: number): DisplayItem[] => {
      if (visible.length === 0) return [];
      const items: DisplayItem[] = [];
      for (let i = 0; i < count; i++) {
        const loopIndex = Math.floor(i / visible.length);
        const posInLoop = i % visible.length;
        items.push({ opp: visible[posInLoop], loopIndex, posInLoop });
      }
      return items;
    },
    [visible]
  );

  useEffect(() => {
    setDisplayed(buildDisplayed(PAGE_SIZE));
    setPage(1);
    setApplyCount(0);
    setShowUpgrade(false);
  }, [visible.length, buildDisplayed]);

  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          const next = page + 1;
          setDisplayed(buildDisplayed(next * PAGE_SIZE));
          setPage(next);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [page, visible.length, buildDisplayed]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    router.refresh();
  }, []);

  useEffect(() => {
    const onFocus = () => {
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
      router.refresh();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  const handleApply = useCallback(
    (_id: string) => {
      const next = applyCount + 1;
      setApplyCount(next);
      if (next >= 3 && userTier === "free" && !showUpgrade) {
        setShowUpgrade(true);
      }
    },
    [applyCount, userTier, showUpgrade]
  );

  const handleSave = useCallback((_id: string, _saved: boolean) => {}, []);

  const handleCopyReferral = useCallback(() => {
    if (referralLink) {
      navigator.clipboard.writeText(referralLink).catch(() => {});
    }
  }, [referralLink]);

  return (
    <div style={{ display: "flex", flexDirection: "column", paddingBottom: "80px" }}>
      {visible.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
            {displayed.map((item, index) => {
              const { opp, loopIndex, posInLoop } = item;
              const isLoopStart = loopIndex > 0 && posInLoop === 0;
              // Fix 3: every 5th slot features the NEXT distinct top match.
              // featuredSlotIndex maps slot -> topMatches[]; once we run past
              // the list, we stop injecting (no repeats). Collision guard keeps
              // us from featuring the card already on screen at that position.
              const featuredSlotIndex =
                index > 0 && (index + 1) % 5 === 0 ? (index + 1) / 5 - 1 : -1;
              const featuredMatch =
                featuredSlotIndex >= 0 && featuredSlotIndex < topMatches.length
                  ? topMatches[featuredSlotIndex]
                  : null;
              const showFeatured = featuredMatch !== null && featuredMatch.id !== opp.id;

              return (
                <Fragment key={`${opp.id}-${loopIndex}`}>
                  {isLoopStart && (
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "1.25rem 0.5rem 0.75rem" }}>
                      <div style={{ flex: 1, height: 1, background: "#e5e5e5" }} />
                      <p style={{ fontSize: "0.6875rem", color: "#8e8e8e", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", margin: 0, whiteSpace: "nowrap" }}>
                        You{"\u2019"}re all caught up {"\u2014"} more for you
                      </p>
                      <div style={{ flex: 1, height: 1, background: "#e5e5e5" }} />
                    </div>
                  )}
                  <AnimatedCard delay={(index % 10) * 60}>
                    <OpportunityCard
                      opportunity={opp}
                      onApply={handleApply}
                      onSave={handleSave}
                    />
                  </AnimatedCard>
                  {showFeatured && featuredMatch && (
                    <div>
                      <div style={{ borderRadius: "var(--radius-md)", padding: "0.5rem" }}>
                        <p style={{ fontSize: "0.625rem", color: "#8e8e8e", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", padding: "0 0.5rem", marginBottom: "0.25rem" }}>
                          {featuredSlotIndex === 0
                            ? "\u2B50 Top match for your profile"
                            : "\u2728 Also for you"}
                        </p>
                        <OpportunityCard
                          opportunity={featuredMatch}
                          onApply={handleApply}
                          onSave={handleSave}
                        />
                      </div>
                    </div>
                  )}
                </Fragment>
              );
            })}
          </div>
      )}

      {visible.length > 0 && (
        <div ref={sentinelRef} style={{ height: 1 }} />
      )}

      {showUpgrade && (
        <div style={{ background: "#06112B", borderRadius: "var(--radius-md)", padding: "1.5rem", color: "white", textAlign: "center" }}>
          <h3 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1.125rem", fontWeight: 800, margin: "0 0 0.5rem 0" }}>
            Upgrade your access
          </h3>
          <p style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.7)", margin: "0 0 1rem 0" }}>
            Get AI match scores, deadline alerts & priority opportunities
          </p>
          <p style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.6)", margin: "0 0 1rem 0" }}>
            Refer 3 friends to unlock Plus tier free
          </p>
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
            <button
              onClick={handleCopyReferral}
              style={{ padding: "0.625rem 1.25rem", borderRadius: "var(--radius-md)", border: "none", background: "#000000", color: "white", fontWeight: 600, fontSize: "0.8125rem", cursor: "pointer" }}
            >
              Share my referral link
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
