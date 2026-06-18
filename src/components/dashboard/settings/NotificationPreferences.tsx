"use client";
import { useState, useEffect } from "react";

const DEFAULTS = [
  { key: "deposit_confirmed", label: "Deposit confirmed", desc: "Your deposit has been verified and credited", inApp: true, email: true },
  { key: "milestone_unlocked", label: "Milestone unlocked", desc: "You've reached a savings milestone", inApp: true, email: true },
  { key: "document_requests", label: "Document requests", desc: "An admin has requested a document from you", inApp: true, email: true },
  { key: "document_verified", label: "Document verified / rejected", desc: "Your document has been reviewed", inApp: true, email: false },
  { key: "order_status", label: "Order status updates", desc: "Your purchase order has changed status", inApp: true, email: true },
  { key: "referral_commissions", label: "Referral commissions", desc: "You earned a referral commission", inApp: true, email: false },
  { key: "weekly_digest", label: "Weekly visa intelligence digest", desc: "Curated visa news and tips every Monday", inApp: false, email: true },
];

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      style={{
        width: 36,
        height: 20,
        borderRadius: 10,
        border: "none",
        background: checked ? "var(--teal)" : "var(--gray-300)",
        cursor: "pointer",
        position: "relative",
        transition: "background 0.2s",
        flexShrink: 0,
      }}
    >
      <span style={{
        position: "absolute",
        top: 2,
        left: checked ? 18 : 2,
        width: 16,
        height: 16,
        borderRadius: "50%",
        background: "white",
        transition: "left 0.2s",
      }} />
    </button>
  );
}

function buildDefaults(): Record<string, { inApp: boolean; email: boolean }> {
  const initial: Record<string, { inApp: boolean; email: boolean }> = {};
  DEFAULTS.forEach(d => { initial[d.key] = { inApp: d.inApp, email: d.email }; });
  return initial;
}

export default function NotificationPreferences({ userId: _userId }: { userId: string }) {
  const [prefs, setPrefs] = useState<Record<string, { inApp: boolean; email: boolean }>>(buildDefaults);

  // Load from API on mount, fall back to localStorage, then to defaults
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/settings/update-notifications");
        if (res.ok) {
          const data = await res.json();
          if (data.preferences && Object.keys(data.preferences).length > 0) {
            setPrefs(prev => {
              const merged = { ...prev, ...data.preferences };
              localStorage.setItem("swiipt_notification_prefs", JSON.stringify(merged));
              return merged;
            });
            return;
          }
        }
      } catch {
        // API unavailable — fall through to localStorage
      }

      // Fallback to localStorage
      const stored = localStorage.getItem("swiipt_notification_prefs");
      if (stored) {
        setPrefs(prev => ({ ...prev, ...JSON.parse(stored) }));
      }
    }
    load();
  }, []);

  function toggle(key: string, type: "inApp" | "email") {
    setPrefs(prev => {
      const next = { ...prev, [key]: { ...prev[key], [type]: !prev[key]?.[type] } };
      localStorage.setItem("swiipt_notification_prefs", JSON.stringify(next));

      // Persist to API (fire-and-forget)
      fetch("/api/settings/update-notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, inApp: next[key].inApp, email: next[key].email }),
      }).catch(() => {
        // Silently fail — localStorage will be source of truth until next API sync
      });

      return next;
    });
  }

  return (
    <div style={{ background: "white", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", padding: "1.5rem" }}>
      <h2 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1rem", fontWeight: 700, color: "var(--midnight)", marginBottom: "0.25rem" }}>
        Notification Preferences
      </h2>
      <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
        Choose how you receive updates.
      </p>

      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600, display: "flex", padding: "0 0 0.5rem 0", borderBottom: "1px solid var(--gray-100)", marginBottom: "0.5rem" }}>
        <span style={{ flex: 1 }}>Notification</span>
        <span style={{ width: 44, textAlign: "center" }}>App</span>
        <span style={{ width: 44, textAlign: "center" }}>Email</span>
      </div>

      {DEFAULTS.map(d => {
        const p = prefs[d.key] || { inApp: d.inApp, email: d.email };
        return (
          <div key={d.key} style={{ display: "flex", alignItems: "center", padding: "0.625rem 0", borderBottom: "1px solid var(--gray-100)" }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--midnight)" }}>{d.label}</p>
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{d.desc}</p>
            </div>
            <div style={{ width: 44, display: "flex", justifyContent: "center" }}>
              <Toggle checked={p.inApp} onChange={() => toggle(d.key, "inApp")} />
            </div>
            <div style={{ width: 44, display: "flex", justifyContent: "center" }}>
              <Toggle checked={p.email} onChange={() => toggle(d.key, "email")} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
