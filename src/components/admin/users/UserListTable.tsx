"use client";
import { useState } from "react";
import Link from "next/link";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function UserListTable({ users, totalCount }: { users: any[]; totalCount: number }) {
  const [search, setSearch] = useState("");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filtered = users.filter((u: any) =>
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    (u.phone || "").includes(search) ||
    (u.referral_code || "").toLowerCase().includes(search.toLowerCase())
  );

  const totalAUM = users.reduce((sum, u) => sum + (u.wallets?.total_locked_ngn || 0), 0);

  return (
    <div style={{ background: "white", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", overflow: "hidden" }}>
      {/* Summary bar */}
      <div style={{ display: "flex", gap: "1.5rem", padding: "1rem 1.25rem", borderBottom: "1px solid var(--border)", background: "var(--off-white)" }}>
        <div>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Total users</span>
          <p style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1.25rem", fontWeight: 800, color: "var(--midnight)" }}>{totalCount}</p>
        </div>
        <div>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Total AUM</span>
          <p style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1.25rem", fontWeight: 800, color: "var(--teal)" }}>
            ₦{totalAUM.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Search */}
      <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--border)" }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, email, phone, or referral code"
          style={{ width: "100%", maxWidth: 400, padding: "0.5rem 0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", fontSize: "0.8125rem" }}
        />
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8125rem" }}>
          <thead>
            <tr style={{ background: "var(--gray-100)" }}>
              {["Name", "Email", "Country", "Mobility Score", "Locked AUM", "Alumni", "Joined", "Actions"].map(h => (
                <th key={h} style={{ padding: "0.625rem 1rem", textAlign: "left", fontWeight: 600, color: "var(--text-secondary)", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {filtered.map((u: any) => (
              <tr key={u.id} style={{ borderBottom: "1px solid var(--gray-100)" }}>
                <td style={{ padding: "0.625rem 1rem", fontWeight: 600, color: "var(--midnight)" }}>{u.full_name}</td>
                <td style={{ padding: "0.625rem 1rem", color: "var(--text-secondary)" }}>{u.email}</td>
                <td style={{ padding: "0.625rem 1rem", color: "var(--text-muted)" }}>{u.country_of_residence || "—"}</td>
                <td style={{ padding: "0.625rem 1rem" }}>
                  <span style={{ fontWeight: 700, color: "var(--midnight)" }}>{u.mobility_score}</span>
                </td>
                <td style={{ padding: "0.625rem 1rem", fontFamily: "monospace", fontSize: "0.75rem", color: "var(--teal)" }}>
                  ₦{(u.wallets?.total_locked_ngn || 0).toLocaleString()}
                </td>
                <td style={{ padding: "0.625rem 1rem" }}>
                  {u.alumni_status ? (
                    <span style={{ fontSize: "0.65rem", fontWeight: 700, padding: "2px 6px", borderRadius: "20px", background: "var(--teal-pale)", color: "var(--teal)" }}>Alumni</span>
                  ) : "—"}
                </td>
                <td style={{ padding: "0.625rem 1rem", color: "var(--text-muted)", whiteSpace: "nowrap", fontSize: "0.75rem" }}>
                  {new Date(u.created_at).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                </td>
                <td style={{ padding: "0.625rem 1rem" }}>
                  <Link
                    href={`/admin/users/${u.id}`}
                    style={{ padding: "0.25rem 0.625rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "white", fontSize: "0.75rem", cursor: "pointer", textDecoration: "none", color: "var(--teal)" }}
                  >
                    View profile
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {filtered.length === 0 && (
        <p style={{ padding: "2rem", fontSize: "0.875rem", color: "var(--text-muted)", textAlign: "center" }}>
          {search ? "No users match your search." : "No users found."}
        </p>
      )}
    </div>
  );
}
