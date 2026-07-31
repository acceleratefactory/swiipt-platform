"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface ServicePackage {
  id: string;
  name: string;
  category: string;
  destination: string;
  price_ngn: number | null;
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
  badge_text: string | null;
}

export default function ServicePackagesTable({ packages: initial }: { packages: ServicePackage[] }) {
  const [packages, setPackages] = useState(initial);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const router = useRouter();

  async function toggleActive(id: string, current: boolean) {
    const res = await fetch("/api/admin/services/toggle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, is_active: !current }),
    });
    if (res.ok) {
      setPackages((prev) => prev.map((p) => (p.id === id ? { ...p, is_active: !current } : p)));
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!window.confirm(`Delete service package "${name}"? This cannot be undone.`)) return;
    setDeletingId(id);
    setDeleteError("");
    const res = await fetch("/api/admin/services/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setDeletingId(null);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      setDeleteError(err.error || "Failed to delete package");
      return;
    }
    setPackages((prev) => prev.filter((p) => p.id !== id));
    router.refresh();
  }

  return (
    <div style={{ overflowX: "auto" }}>
      {deleteError && (
        <div style={{ padding: "0.625rem 0.875rem", background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: "var(--radius-sm)", color: "#B91C1C", fontSize: "0.8125rem", marginBottom: "0.75rem" }}>
          {deleteError}
        </div>
      )}
      <table style={{ width: "100%", minWidth: 400, borderCollapse: "collapse", background: "white", borderRadius: "var(--radius-lg)", overflow: "hidden", border: "1px solid var(--border)" }}>
        <thead>
          <tr style={{ background: "var(--off-white)", textAlign: "left" }}>
            <th style={{ padding: "0.75rem 1rem", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Name</th>
            <th className="hide-mobile" style={{ padding: "0.75rem 1rem", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Category</th>
            <th className="hide-mobile" style={{ padding: "0.75rem 1rem", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Destination</th>
            <th style={{ padding: "0.75rem 1rem", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Price (NGN)</th>
            <th style={{ padding: "0.75rem 1rem", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Active</th>
            <th className="hide-mobile" style={{ padding: "0.75rem 1rem", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Sort</th>
            <th className="hide-mobile" style={{ padding: "0.75rem 1rem", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Badge</th>
            <th style={{ padding: "0.75rem 1rem", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}></th>
          </tr>
        </thead>
        <tbody>
          {packages.map((pkg) => (
            <tr key={pkg.id} style={{ borderTop: "1px solid var(--border)" }}>
              <td style={{ padding: "0.75rem 1rem", fontSize: "0.875rem", fontWeight: 600, color: "var(--midnight)" }}>{pkg.name}</td>
              <td className="hide-mobile" style={{ padding: "0.75rem 1rem", fontSize: "0.8125rem", color: "var(--text-secondary)" }}>{pkg.category?.replace(/_/g, " ")}</td>
              <td className="hide-mobile" style={{ padding: "0.75rem 1rem", fontSize: "0.8125rem", color: "var(--text-secondary)" }}>{pkg.destination}</td>
              <td style={{ padding: "0.75rem 1rem", fontSize: "0.875rem", fontWeight: 600, color: "var(--midnight)" }}>₦{pkg.price_ngn?.toLocaleString() || "—"}</td>
              <td style={{ padding: "0.75rem 1rem" }}>
                <button
                  onClick={() => toggleActive(pkg.id, pkg.is_active)}
                  title={pkg.is_active ? "Click to deactivate" : "Click to activate"}
                  className="table-toggle-btn"
                  style={{ background: "none", border: "none", cursor: "pointer" }}
                >
                  <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: pkg.is_active ? "var(--teal)" : "var(--gray-300)", transition: "background 0.15s" }} />
                </button>
              </td>
              <td className="hide-mobile" style={{ padding: "0.75rem 1rem", fontSize: "0.8125rem", color: "var(--text-muted)" }}>{pkg.sort_order}</td>
              <td className="hide-mobile" style={{ padding: "0.75rem 1rem" }}>
                {pkg.badge_text && (
                  <span style={{ fontSize: "0.6875rem", background: "var(--teal-pale)", color: "var(--teal)", padding: "2px 8px", borderRadius: "20px", fontWeight: 600 }}>
                    {pkg.badge_text}
                  </span>
                )}
              </td>
              <td style={{ padding: "0.75rem 1rem", whiteSpace: "nowrap" }}>
                <Link href={`/admin/services/${pkg.id}`} style={{ fontSize: "0.8125rem", color: "var(--teal)", fontWeight: 600, textDecoration: "none" }}>
                  Edit
                </Link>
                <button
                  onClick={() => handleDelete(pkg.id, pkg.name)}
                  disabled={deletingId === pkg.id}
                  style={{ marginLeft: "0.75rem", background: "none", border: "none", color: "var(--danger)", fontSize: "0.8125rem", fontWeight: 600, cursor: deletingId === pkg.id ? "not-allowed" : "pointer", textDecoration: "underline" }}
                >
                  {deletingId === pkg.id ? "Deleting..." : "Delete"}
                </button>
              </td>
            </tr>
          ))}
          {packages.length === 0 && (
            <tr>
              <td colSpan={8} style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.875rem" }}>
                No service packages yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
