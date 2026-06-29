"use client";

import { useState } from "react";

interface MemberUser {
  full_name: string | null;
  email: string | null;
}

interface Member {
  id: string;
  user_id: string;
  status: string;
  amount_saved_ngn: number;
  savings_goals: { target_amount: number } | null;
  user: MemberUser | null;
}

interface Group {
  id: string;
  title: string;
  status: string;
  memberCount: number;
  fundedCount: number;
  fundingPct: number;
  trade_shows: { name: string } | null;
  organizer: MemberUser | null;
  members: Member[];
}

export default function AdminTradeShowGroupsTable({
  groups,
  statusColors,
}: {
  groups: Group[];
  statusColors: Record<string, string>;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggle = (id: string) => setExpandedId(expandedId === id ? null : id);

  if (groups.length === 0) {
    return (
      <div>
        <h2 style={{ fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', fontSize: '1rem', fontWeight: 700, color: 'var(--midnight)', marginBottom: '0.75rem' }}>
          Active Groups
        </h2>
        <div style={{ background: "white", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", padding: "2rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.8125rem" }}>
          No trade show groups yet.
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', fontSize: '1rem', fontWeight: 700, color: 'var(--midnight)', marginBottom: '0.75rem' }}>
        Active Groups
      </h2>
      <div style={{ background: "white", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8125rem" }}>
          <thead>
            <tr style={{ background: "var(--off-white)", textAlign: "left" }}>
              <th style={{ padding: "0.75rem 1rem", fontWeight: 600, color: "var(--text-muted)" }}>Title</th>
              <th style={{ padding: "0.75rem 1rem", fontWeight: 600, color: "var(--text-muted)" }}>Trade Show</th>
              <th style={{ padding: "0.75rem 1rem", fontWeight: 600, color: "var(--text-muted)" }}>Organizer</th>
              <th style={{ padding: "0.75rem 1rem", fontWeight: 600, color: "var(--text-muted)" }}>Members</th>
              <th style={{ padding: "0.75rem 1rem", fontWeight: 600, color: "var(--text-muted)" }}>Funding</th>
              <th style={{ padding: "0.75rem 1rem", fontWeight: 600, color: "var(--text-muted)" }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((g) => (
              <>
                <tr
                  key={g.id}
                  onClick={() => toggle(g.id)}
                  style={{
                    borderTop: "1px solid var(--border)",
                    cursor: "pointer",
                    background: expandedId === g.id ? "var(--off-white)" : undefined,
                  }}
                >
                  <td style={{ padding: "0.75rem 1rem", fontWeight: 600, color: "var(--midnight)" }}>{g.title}</td>
                  <td style={{ padding: "0.75rem 1rem", color: "var(--text-secondary)" }}>
                    {g.trade_shows?.name || "—"}
                  </td>
                  <td style={{ padding: "0.75rem 1rem", color: "var(--text-secondary)" }}>
                    {g.organizer?.full_name || "Unknown"}<br />
                    <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{g.organizer?.email}</span>
                  </td>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    {g.fundedCount}/{g.memberCount}
                  </td>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <div style={{ width: 60, height: 6, background: "var(--gray-200)", borderRadius: 4, overflow: "hidden" }}>
                        <div style={{
                          height: "100%",
                          background: g.fundingPct >= 100 ? "#059669" : "var(--teal)",
                          borderRadius: 4,
                          width: `${g.fundingPct}%`,
                        }} />
                      </div>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{g.fundingPct}%</span>
                    </div>
                  </td>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    <span style={{
                      padding: "2px 8px",
                      borderRadius: "10px",
                      fontSize: "0.65rem",
                      fontWeight: 700,
                      background: `${(statusColors[g.status] || "#6B7280")}15`,
                      color: statusColors[g.status] || "#6B7280",
                    }}>
                      {g.status}
                    </span>
                  </td>
                </tr>
                {expandedId === g.id && (
                  <tr key={`${g.id}-members`}>
                    <td colSpan={6} style={{ padding: "0 1rem 1rem 1rem", background: "var(--off-white)" }}>
                      <div style={{ marginTop: "0.5rem" }}>
                        <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.5rem" }}>
                          Members ({g.memberCount})
                        </p>
                        {g.members.map((m) => (
                          <div
                            key={m.id}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              padding: "0.5rem 0.75rem",
                              background: "white",
                              borderRadius: "var(--radius-sm)",
                              marginBottom: "0.375rem",
                              border: "1px solid var(--border)",
                            }}
                          >
                            <div>
                              <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--midnight)" }}>
                                {m.user?.full_name || "Unknown"}
                              </span>
                              {m.user?.email && (
                                <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginLeft: "0.5rem" }}>
                                  {m.user.email}
                                </span>
                              )}
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                              <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                                ₦{(m.amount_saved_ngn || 0).toLocaleString()} / ₦{(m.savings_goals?.target_amount || 0).toLocaleString()}
                              </span>
                              <span style={{
                                padding: "1px 6px",
                                borderRadius: "8px",
                                fontSize: "0.65rem",
                                fontWeight: 700,
                                background: m.status === "funded" ? "rgba(5,150,105,0.12)" : "rgba(107,114,128,0.12)",
                                color: m.status === "funded" ? "#059669" : "#6B7280",
                              }}>
                                {m.status === "funded" ? "Funded" : "Saving"}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
