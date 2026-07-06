"use client";

import { useState, useEffect, useRef } from "react";
import { X, Bookmark, Share2 } from "lucide-react";
import type { TypeStyleMap } from "@/lib/opportunity-types";

interface OpportunityDetailModalProps {
  opportunity: any;
  typeStyles: TypeStyleMap;
  onClose: () => void;
  onApply: () => void;
  onSave: () => void;
  isSaved: boolean;
}

export default function OpportunityDetailModal({
  opportunity,
  typeStyles,
  onClose,
  onApply,
  onSave,
  isSaved,
}: OpportunityDetailModalProps) {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  useEffect(() => {
    function check() { setIsDesktop(window.innerWidth >= 768); }
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const openedAt = useRef(Date.now());

  useEffect(() => {
    return () => {
      const dwellMs = Date.now() - openedAt.current;
      const signalType = dwellMs >= 30000 ? "dwell_long" : dwellMs < 5000 ? "dwell_short" : null;
      if (signalType) {
        fetch("/api/opportunities/signal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ opportunityId: opportunity.id, signalType }),
        }).catch(() => {});
      }
    };
  }, [opportunity.id]);

  const type = typeStyles[opportunity.type] || { bg: "#f3f4f6", color: "#64748b", label: opportunity.type || "Opportunity" };

  const daysToDeadline = opportunity.deadline
    ? Math.ceil((new Date(opportunity.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0,
          background: "rgba(0,0,0,0.6)",
          zIndex: 100,
          backdropFilter: "blur(2px)",
        }}
      />
      <div style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 101,
        background: "white",
        borderRadius: isDesktop ? "var(--radius-xl)" : "20px 20px 0 0",
        maxHeight: isDesktop ? "85vh" : "92vh",
        overflowY: "auto",
        ...(isDesktop ? {
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          bottom: "auto",
          maxWidth: "640px",
          width: "100%",
        } : {}),
      }}>
        <div style={{ width: 40, height: 4, background: "#E5E7EB", borderRadius: 2, margin: "12px auto 0" }} />

        <div style={{ padding: "1.25rem 1.25rem 0", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start", flex: 1 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12,
              background: "var(--midnight)", color: "white",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "1.25rem", fontWeight: 800, flexShrink: 0,
            }}>
              {opportunity.organisation?.charAt(0)}
            </div>
            <div>
              <h2 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1rem", fontWeight: 800, color: "var(--midnight)", lineHeight: 1.3, margin: "0 0 4px" }}>
                {opportunity.title}
              </h2>
              <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", margin: 0 }}>
                {opportunity.organisation}
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "var(--text-muted)", flexShrink: 0 }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: "0.875rem 1.25rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
            {opportunity.location_country}{opportunity.location_city ? ` · ${opportunity.location_city}` : ""}
          </span>
          <span style={{ fontSize: "0.6875rem", fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: type.bg, color: type.color }}>
            {type.label}
          </span>
          {daysToDeadline !== null && daysToDeadline > 0 && (
            <span style={{ fontSize: "0.6875rem", fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: daysToDeadline <= 7 ? "#FEF2F2" : "#FEF3C7", color: daysToDeadline <= 7 ? "#991B1B" : "#92400E" }}>
              {"\u23F0"} {daysToDeadline}d left
            </span>
          )}
        </div>

        {(opportunity.salary_range || opportunity.funding_amount) && (
          <div style={{ padding: "0 1.25rem 0.875rem" }}>
            <p style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1.25rem", fontWeight: 800, color: "var(--teal)", margin: 0 }}>
              {opportunity.salary_range || opportunity.funding_amount}
            </p>
          </div>
        )}

        <div style={{ height: 1, background: "var(--gray-100)", margin: "0 1.25rem" }} />

        <div style={{ padding: "1rem 1.25rem" }}>
          <h3 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "0.875rem", fontWeight: 700, color: "var(--midnight)", marginBottom: "0.5rem" }}>
            About this opportunity
          </h3>
          <p style={{ fontSize: "0.9375rem", color: "var(--text-secondary)", lineHeight: 1.65, margin: 0 }}>
            {opportunity.description}
          </p>
        </div>

        {opportunity.requirements && (
          <div style={{ padding: "0 1.25rem 1rem" }}>
            <h3 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "0.875rem", fontWeight: 700, color: "var(--midnight)", marginBottom: "0.5rem" }}>
              Requirements
            </h3>
            <p style={{ fontSize: "0.9375rem", color: "var(--text-secondary)", lineHeight: 1.65, margin: 0, whiteSpace: "pre-wrap" }}>
              {opportunity.requirements}
            </p>
          </div>
        )}

        {opportunity.deadline && (
          <div style={{ padding: "0 1.25rem 1rem" }}>
            <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
              <strong style={{ color: "var(--midnight)" }}>Application deadline:</strong>{" "}
              {new Date(opportunity.deadline).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
        )}

        {opportunity.related_service_slug && (
          <div style={{ margin: "0 1.25rem 1rem", background: "var(--teal-pale)", borderRadius: "var(--radius-md)", padding: "0.875rem 1rem" }}>
            <p style={{ fontSize: "0.875rem", color: "var(--midnight)", margin: 0 }}>
              {"\uD83D\uDCA1"} You may need a visa or service for this opportunity.{" "}
              <a href={`/${opportunity.related_service_slug}`} style={{ color: "var(--teal)", fontWeight: 600, textDecoration: "none" }}>
                We can help →
              </a>
            </p>
          </div>
        )}

        {opportunity.source_url && opportunity.source_name && (
          <div style={{ padding: "0 1.25rem 1rem" }}>
            <a
              href={`/resources/guide?src=${encodeURIComponent(opportunity.source_url)}`}
              style={{ fontSize: "0.875rem", color: "var(--text-muted)", textDecoration: "none", display: "flex", alignItems: "center", gap: "0.375rem" }}
            >
              {"\uD83D\uDCD6"} Read the full guide on {opportunity.source_name} →
            </a>
          </div>
        )}

        <div style={{
          position: "sticky", bottom: 0,
          background: "white",
          borderTop: "1px solid var(--gray-100)",
          padding: "1rem 1.25rem",
          display: "flex", gap: "0.75rem",
        }}>
          <button
            onClick={onApply}
            style={{
              flex: 1, padding: "0.875rem",
              background: "var(--midnight)", color: "white",
              fontWeight: 700, fontSize: "0.9375rem",
              borderRadius: "var(--radius-md)", border: "none", cursor: "pointer",
            }}
          >
            Apply now →
          </button>
          <button
            onClick={onSave}
            style={{
              padding: "0.875rem 1rem",
              background: isSaved ? "var(--teal-pale)" : "var(--off-white)",
              color: isSaved ? "var(--teal)" : "var(--text-muted)",
              borderRadius: "var(--radius-md)", border: "1px solid var(--border)", cursor: "pointer",
            }}
            title={isSaved ? "Saved" : "Save"}
          >
            <Bookmark size={18} fill={isSaved ? "currentColor" : "none"} />
          </button>
          <button
            onClick={() => {
              const text = `Check out this opportunity on Swiipt — ${opportunity.title} at ${opportunity.organisation} in ${opportunity.location_country}${opportunity.salary_range ? `. ${opportunity.salary_range}` : ""}.`;
              const url = `https://swiipt.com/opportunities/${opportunity.id}`;
              if (navigator.share) {
                navigator.share({ title: opportunity.title, text, url });
              } else {
                const wa = `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`;
                window.open(wa, "_blank");
              }
            }}
            style={{
              padding: "0.875rem 1rem",
              background: "var(--off-white)",
              color: "var(--text-muted)",
              borderRadius: "var(--radius-md)", border: "1px solid var(--border)", cursor: "pointer",
            }}
          >
            <Share2 size={18} />
          </button>
        </div>
      </div>
    </>
  );
}
