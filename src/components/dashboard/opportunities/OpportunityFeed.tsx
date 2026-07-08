"use client";

import { useState, useEffect, useRef, useCallback, Fragment } from "react";
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

const PAGE_SIZE = 10;

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
  const [displayed, setDisplayed] = useState<Oppty[]>([]);
  const [page, setPage] = useState(1);
  const [applyCount, setApplyCount] = useState(0);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const topMatch = useRef<Oppty | null>(null);
  const router = useRouter();

  const visible = allOpportunities;

  const bestOpp = visible.length > 0
    ? visible.reduce((a, b) => ((a.relevanceScore || 0) >= (b.relevanceScore || 0) ? a : b))
    : null;
  topMatch.current = bestOpp;

  useEffect(() => {
    setDisplayed(visible.slice(0, PAGE_SIZE));
    setPage(1);
    setApplyCount(0);
    setShowUpgrade(false);
  }, [visible.length]);

  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          const next = page + 1;
          setDisplayed(visible.slice(0, next * PAGE_SIZE));
          setPage(next);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [page, visible.length]);

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

  const isDone = displayed.length >= visible.length;

  return (
    <div style={{ display: "flex", flexDirection: "column", paddingBottom: "80px" }}>
      {visible.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
            {displayed.map((opp, index) => {
              const isFeaturedPosition =
                topMatch.current &&
                index > 0 &&
                (index + 1) % 5 === 0 &&
                topMatch.current.id !== opp.id;

              return (
                <Fragment key={opp.id}>
                  <AnimatedCard delay={(index % 10) * 60}>
                    <OpportunityCard
                      opportunity={opp}
                      onApply={handleApply}
                      onSave={handleSave}
                    />
                  </AnimatedCard>
                  {isFeaturedPosition && topMatch.current && (
                    <div>
                      <div style={{ borderRadius: "var(--radius-md)", padding: "0.5rem" }}>
                        <p style={{ fontSize: "0.625rem", color: "#8e8e8e", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", padding: "0 0.5rem", marginBottom: "0.25rem" }}>
                          {"\u2B50"} Top match for your profile
                        </p>
                        <OpportunityCard
                          opportunity={topMatch.current}
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

      {!isDone && (
        <div ref={sentinelRef} style={{ height: 1 }} />
      )}

      {isDone && visible.length > 0 && (
        <div style={{ height: 40 }} />
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
