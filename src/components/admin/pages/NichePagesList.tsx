"use client";

import { useState } from "react";
import Link from "next/link";

const URL_PREFIX_LABELS: Record<string, string> = {
  move: "Move / Relocate",
  work: "Work Abroad",
  study: "Study Abroad",
  holiday: "Holiday / Travel",
  business: "Business",
  citizenship: "Citizenship",
  remote: "Remote Work",
  corporate: "Corporate",
  student: "Student",
  parents: "Parents / Family",
};

interface NichePage {
  id: string;
  url_prefix: string;
  slug: string;
  title: string;
  destination: string | null;
  published: boolean;
  view_count: number;
  updated_at: string;
}

export default function NichePagesList({ pages: initial }: { pages: NichePage[] }) {
  const [pages, setPages] = useState(initial);

  async function togglePublished(id: string, current: boolean) {
    const res = await fetch("/api/admin/pages/toggle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, published: !current }),
    });
    if (res.ok) {
      setPages((prev) => prev.map((p) => (p.id === id ? { ...p, published: !current } : p)));
    }
  }

  const grouped: Record<string, NichePage[]> = {};
  for (const page of pages) {
    if (!grouped[page.url_prefix]) grouped[page.url_prefix] = [];
    grouped[page.url_prefix].push(page);
  }

  const groupOrder = Object.keys(URL_PREFIX_LABELS).filter((k) => grouped[k]);
  const otherKeys = Object.keys(grouped).filter((k) => !URL_PREFIX_LABELS[k]);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h1 style={{ fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', fontSize: '1.375rem', fontWeight: 800, color: 'var(--midnight)' }}>
          Landing Pages
        </h1>
        <Link
          href="/admin/pages/new"
          style={{
            padding: "0.625rem 1.25rem",
            background: "var(--midnight)",
            color: "white",
            fontWeight: 700,
            fontSize: "0.875rem",
            borderRadius: "var(--radius-md)",
            textDecoration: "none",
          }}
        >
          + New page
        </Link>
      </div>

      {groupOrder.concat(otherKeys).map((prefix) => (
        <div key={prefix} style={{ marginBottom: "1.5rem" }}>
          <h2
            style={{
              fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif',
              fontSize: "0.9375rem",
              fontWeight: 700,
              color: "var(--midnight)",
              marginBottom: "0.5rem",
              padding: "0.5rem 0",
              borderBottom: "2px solid var(--teal)",
              textTransform: "capitalize",
            }}
          >
            {URL_PREFIX_LABELS[prefix] || prefix}
          </h2>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", minWidth: 500, borderCollapse: "collapse", background: "white", borderRadius: "var(--radius-lg)", overflow: "hidden", border: "1px solid var(--border)" }}>
              <thead>
                <tr style={{ background: "var(--off-white)", textAlign: "left" }}>
                  <th style={{ padding: "0.75rem 1rem", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>URL</th>
                  <th style={{ padding: "0.75rem 1rem", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Title</th>
                  <th className="hide-mobile" style={{ padding: "0.75rem 1rem", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Destination</th>
                  <th style={{ padding: "0.75rem 1rem", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Published</th>
                  <th className="hide-mobile" style={{ padding: "0.75rem 1rem", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Views</th>
                  <th className="hide-mobile" style={{ padding: "0.75rem 1rem", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Updated</th>
                  <th style={{ padding: "0.75rem 1rem", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}></th>
                </tr>
              </thead>
              <tbody>
                {grouped[prefix].map((page) => (
                  <tr key={page.id} style={{ borderTop: "1px solid var(--border)" }}>
                    <td style={{ padding: "0.75rem 1rem", fontSize: "0.8125rem", color: "var(--text-secondary)", fontFamily: "monospace" }}>
                      /{page.url_prefix}/{page.slug}
                    </td>
                    <td style={{ padding: "0.75rem 1rem", fontSize: "0.875rem", fontWeight: 600, color: "var(--midnight)", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {page.title}
                    </td>
                    <td className="hide-mobile" style={{ padding: "0.75rem 1rem", fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                      {page.destination || "—"}
                    </td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <button
                        onClick={() => togglePublished(page.id, page.published)}
                        title={page.published ? "Click to unpublish" : "Click to publish"}
                        style={{ background: "none", border: "none", cursor: "pointer" }}
                      >
                        <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: page.published ? "var(--teal)" : "var(--gray-300)", transition: "background 0.15s" }} />
                      </button>
                    </td>
                    <td className="hide-mobile" style={{ padding: "0.75rem 1rem", fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                      {page.view_count ?? 0}
                    </td>
                    <td className="hide-mobile" style={{ padding: "0.75rem 1rem", fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                      {page.updated_at ? new Date(page.updated_at).toLocaleDateString() : "—"}
                    </td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <Link href={`/admin/pages/${page.id}`} style={{ fontSize: "0.8125rem", color: "var(--teal)", fontWeight: 600, textDecoration: "none" }}>
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
                {grouped[prefix].length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ padding: "1.5rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.875rem" }}>
                      No pages in this group.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {Object.keys(grouped).length === 0 && (
        <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.875rem" }}>
          No landing pages yet. Create your first page.
        </div>
      )}
    </div>
  );
}
