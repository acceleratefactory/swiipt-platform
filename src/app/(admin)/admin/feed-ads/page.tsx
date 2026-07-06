"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface FeedAd {
  id: string;
  headline: string;
  ad_type: string;
  status: string;
  cta_label: string;
  cta_url: string;
  impression_count: number;
  click_count: number;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  active: "#0d9488",
  paused: "#d97706",
  draft: "#6b7280",
  ended: "#ef4444",
};

export default function FeedAdsPage() {
  const [ads, setAds] = useState<FeedAd[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAds = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/feed-ads");
      if (res.ok) setAds(await res.json());
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAds(); }, [fetchAds]);

  const handleToggle = useCallback(async (id: string) => {
    const res = await fetch(`/api/admin/feed-ads/${id}/toggle`, { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      setAds((prev) => prev.map((a) => a.id === id ? { ...a, status: data.status } : a));
    }
  }, []);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h1 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1.25rem", fontWeight: 800, margin: 0 }}>Feed Ads</h1>
        <Link href="/admin/feed-ads/new" style={{ padding: "0.5rem 1rem", background: "var(--midnight)", color: "white", borderRadius: "var(--radius-md)", textDecoration: "none", fontSize: "0.875rem", fontWeight: 600 }}>
          + New ad
        </Link>
      </div>

      {loading ? (
        <p style={{ color: "var(--text-muted)" }}>Loading...</p>
      ) : ads.length === 0 ? (
        <p style={{ color: "var(--text-muted)" }}>No ads created yet.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #e2e8f0", textAlign: "left" }}>
              <th style={{ padding: "0.75rem 0.5rem", fontWeight: 700 }}>Headline</th>
              <th style={{ padding: "0.75rem 0.5rem", fontWeight: 700 }}>Type</th>
              <th style={{ padding: "0.75rem 0.5rem", fontWeight: 700 }}>Status</th>
              <th style={{ padding: "0.75rem 0.5rem", fontWeight: 700 }}>Impressions</th>
              <th style={{ padding: "0.75rem 0.5rem", fontWeight: 700 }}>Clicks</th>
              <th style={{ padding: "0.75rem 0.5rem", fontWeight: 700 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {ads.map((ad) => (
              <tr key={ad.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                <td style={{ padding: "0.75rem 0.5rem", fontWeight: 600 }}>{ad.headline}</td>
                <td style={{ padding: "0.75rem 0.5rem", textTransform: "capitalize" }}>{ad.ad_type}</td>
                <td style={{ padding: "0.75rem 0.5rem" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", padding: "0.125rem 0.5rem", borderRadius: 9999, fontSize: "0.75rem", fontWeight: 600, background: STATUS_COLORS[ad.status] ? `${STATUS_COLORS[ad.status]}15` : "#f1f5f9", color: STATUS_COLORS[ad.status] || "#64748b" }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: STATUS_COLORS[ad.status] || "#64748b", display: "inline-block" }} />
                    {ad.status}
                  </span>
                </td>
                <td style={{ padding: "0.75rem 0.5rem" }}>{ad.impression_count}</td>
                <td style={{ padding: "0.75rem 0.5rem" }}>{ad.click_count}</td>
                <td style={{ padding: "0.75rem 0.5rem" }}>
                  <button
                    onClick={() => handleToggle(ad.id)}
                    style={{ padding: "0.25rem 0.75rem", borderRadius: "var(--radius-sm)", border: "1px solid #e2e8f0", background: "white", cursor: "pointer", fontSize: "0.75rem", fontWeight: 600, color: ad.status === "active" ? "#d97706" : "#0d9488" }}
                  >
                    {ad.status === "active" ? "Pause" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
