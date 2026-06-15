"use client";

import { useState, useCallback, useRef } from "react";

interface SEOItem {
  id: string;
  url_prefix?: string;
  slug: string;
  title: string;
  meta_title: string | null;
  meta_description: string | null;
  og_image_url: string | null;
}

function statusColor(value: string | null, greenMin: number, greenMax: number): string {
  if (!value) return "var(--danger)";
  const len = value.length;
  if (len >= greenMin && len <= greenMax) return "var(--teal)";
  return "#F59E0B";
}

function statusLabel(value: string | null, greenMin: number, greenMax: number): string {
  if (!value) return "Missing";
  const len = value.length;
  if (len >= greenMin && len <= greenMax) return `${len} chars`;
  return `${len} chars`;
}

export default function SEOManager({
  nichePages,
  guides,
}: {
  nichePages: SEOItem[];
  guides: SEOItem[];
}) {
  const [activeTab, setActiveTab] = useState<"niche" | "guides">("niche");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [items, setItems] = useState({ niche: nichePages, guides });
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const itemsList = activeTab === "niche" ? items.niche : items.guides;
  const type = activeTab === "niche" ? "niche_pages" : "resource_guides";

  function getUrl(item: SEOItem): string {
    if (item.url_prefix) return `/${item.url_prefix}/${item.slug}`;
    return `/resources/${item.slug}`;
  }

  function startEdit(item: SEOItem) {
    setEditingId(item.id);
    setEditValues({
      meta_title: item.meta_title || "",
      meta_description: item.meta_description || "",
      og_image_url: item.og_image_url || "",
    });
  }

  function handleFieldChange(field: string, value: string) {
    setEditValues((prev) => ({ ...prev, [field]: value }));
  }

  const save = useCallback(async (id: string) => {
    const res = await fetch("/api/admin/seo/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type,
        id,
        meta_title: editValues.meta_title || null,
        meta_description: editValues.meta_description || null,
        og_image_url: editValues.og_image_url || null,
      }),
    });

    if (res.ok) {
      const key = activeTab === "niche" ? "niche" : "guides";
      setItems((prev) => ({
        ...prev,
        [key]: prev[key].map((item) =>
          item.id === id
            ? {
                ...item,
                meta_title: editValues.meta_title || null,
                meta_description: editValues.meta_description || null,
                og_image_url: editValues.og_image_url || null,
              }
            : item
        ),
      }));
    }
  }, [type, editValues, activeTab]);

  function handleBlur(id: string) {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => save(id), 400);
    setEditingId(null);
  }

  const tabStyle = (isActive: boolean): React.CSSProperties => ({
    padding: "0.625rem 1.25rem",
    background: isActive ? "var(--midnight)" : "var(--gray-100)",
    color: isActive ? "white" : "var(--text-secondary)",
    fontWeight: 700,
    fontSize: "0.8125rem",
    borderRadius: "var(--radius-md)",
    border: "none",
    cursor: "pointer",
  });

  return (
    <div>
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
        <button style={tabStyle(activeTab === "niche")} onClick={() => { setActiveTab("niche"); setEditingId(null); }}>
          Niche Pages ({items.niche.length})
        </button>
        <button style={tabStyle(activeTab === "guides")} onClick={() => { setActiveTab("guides"); setEditingId(null); }}>
          Resource Guides ({items.guides.length})
        </button>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", minWidth: 600, borderCollapse: "collapse", background: "white", borderRadius: "var(--radius-lg)", overflow: "hidden", border: "1px solid var(--border)" }}>
          <thead>
            <tr style={{ background: "var(--off-white)", textAlign: "left" }}>
              <th style={{ padding: "0.75rem 1rem", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>URL</th>
              <th style={{ padding: "0.75rem 1rem", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Title</th>
              <th style={{ padding: "0.75rem 1rem", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Meta title</th>
              <th style={{ padding: "0.75rem 1rem", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Meta description</th>
              <th style={{ padding: "0.75rem 1rem", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>OG image</th>
            </tr>
          </thead>
          <tbody>
            {itemsList.map((item) => {
              const isEditing = editingId === item.id;
              return (
                <tr
                  key={item.id}
                  style={{ borderTop: "1px solid var(--border)", cursor: isEditing ? "default" : "pointer" }}
                  onClick={() => !isEditing && startEdit(item)}
                >
                  <td style={{ padding: "0.75rem 1rem", fontSize: "0.8125rem", color: "var(--text-secondary)", fontFamily: "monospace" }}>
                    {getUrl(item)}
                  </td>
                  <td style={{ padding: "0.75rem 1rem", fontSize: "0.875rem", fontWeight: 600, color: "var(--midnight)", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {item.title}
                  </td>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    {isEditing ? (
                      <input
                        autoFocus
                        value={editValues.meta_title}
                        onChange={(e) => handleFieldChange("meta_title", e.target.value)}
                        onBlur={() => handleBlur(item.id)}
                        maxLength={60}
                        style={{
                          width: "100%", padding: "0.375rem 0.5rem", fontSize: "0.8125rem",
                          borderRadius: "var(--radius-sm)", border: "1px solid var(--border)",
                        }}
                      />
                    ) : (
                      <span
                        style={{
                          fontSize: "0.8125rem",
                          color: statusColor(item.meta_title, 30, 60),
                          fontWeight: 500,
                        }}
                      >
                        {statusLabel(item.meta_title, 30, 60)}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    {isEditing ? (
                      <textarea
                        value={editValues.meta_description}
                        onChange={(e) => handleFieldChange("meta_description", e.target.value)}
                        onBlur={() => handleBlur(item.id)}
                        maxLength={155}
                        rows={2}
                        style={{
                          width: "100%", padding: "0.375rem 0.5rem", fontSize: "0.8125rem",
                          borderRadius: "var(--radius-sm)", border: "1px solid var(--border)",
                          resize: "vertical",
                        }}
                      />
                    ) : (
                      <span
                        style={{
                          fontSize: "0.8125rem",
                          color: statusColor(item.meta_description, 120, 155),
                          fontWeight: 500,
                        }}
                      >
                        {statusLabel(item.meta_description, 120, 155)}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    {isEditing ? (
                      <input
                        value={editValues.og_image_url}
                        onChange={(e) => handleFieldChange("og_image_url", e.target.value)}
                        onBlur={() => handleBlur(item.id)}
                        style={{
                          width: "100%", padding: "0.375rem 0.5rem", fontSize: "0.8125rem",
                          borderRadius: "var(--radius-sm)", border: "1px solid var(--border)",
                        }}
                      />
                    ) : (
                      <span style={{ fontSize: "0.8125rem", color: item.og_image_url ? "var(--teal)" : "var(--danger)", fontWeight: 500 }}>
                        {item.og_image_url ? "Yes" : "No"}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
            {itemsList.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.875rem" }}>
                  No {activeTab === "niche" ? "niche pages" : "resource guides"} found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
