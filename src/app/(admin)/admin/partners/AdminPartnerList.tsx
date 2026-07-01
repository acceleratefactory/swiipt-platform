"use client";
import { useState } from "react";

interface PartnerRow {
  id: string; name: string; business_name: string | null;
  email: string; phone: string | null;
  partner_type: string; status: string;
  typeLabel: string; statusColor: string;
  specialisations: string[]; destinations_served: string[];
  average_rating: number; total_escrow_transactions: number;
  years_in_operation: number | null;
  created_at: string;
}

export default function AdminPartnerList({ partners }: { partners: PartnerRow[] }) {
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const filtered = partners.filter((p) => {
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    if (typeFilter !== "all" && p.partner_type !== typeFilter) return false;
    return true;
  });

  return (
    <div>
      {/* Filters */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ padding: "0.375rem 0.625rem", fontSize: "0.8125rem", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", background: "white", outline: "none" }}>
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="rejected">Rejected</option>
        </select>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} style={{ padding: "0.375rem 0.625rem", fontSize: "0.8125rem", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", background: "white", outline: "none" }}>
          <option value="all">All Types</option>
          <option value="immigration_lawyer">Immigration Lawyer</option>
          <option value="visa_agent">Visa Agent</option>
          <option value="relocation_consultant">Relocation Consultant</option>
          <option value="trade_agent">Trade Agent</option>
          <option value="recruitment_agency">Recruitment Agency</option>
          <option value="education_consultant">Education Consultant</option>
        </select>
      </div>

      {/* Table */}
      <div style={{ background: "white", borderRadius: "var(--radius-xl)", border: "1px solid var(--border)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "var(--off-white)", fontSize: "0.75rem", color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              <th style={{ padding: "0.625rem 0.75rem", textAlign: "left", fontWeight: 600 }}>Name</th>
              <th style={{ padding: "0.625rem 0.75rem", textAlign: "left", fontWeight: 600 }}>Type</th>
              <th style={{ padding: "0.625rem 0.75rem", textAlign: "left", fontWeight: 600 }}>Status</th>
              <th style={{ padding: "0.625rem 0.75rem", textAlign: "left", fontWeight: 600 }}>Rating</th>
              <th style={{ padding: "0.625rem 0.75rem", textAlign: "left", fontWeight: 600 }}>Deals</th>
              <th style={{ padding: "0.625rem 0.75rem", textAlign: "left", fontWeight: 600 }}>Applied</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: "2rem", textAlign: "center", fontSize: "0.8125rem", color: "#6B7280" }}>No partners found</td></tr>
            ) : filtered.map((p) => (
              <tr key={p.id} style={{ borderTop: "1px solid var(--border)", cursor: "pointer" }} onClick={() => window.location.href = `/admin/partners/${p.id}`}>
                <td style={{ padding: "0.625rem 0.75rem", fontSize: "0.8125rem" }}>
                  <div style={{ fontWeight: 600, color: "var(--midnight)" }}>{p.business_name || p.name}</div>
                  <div style={{ fontSize: "0.6875rem", color: "#9CA3AF" }}>{p.email}</div>
                </td>
                <td style={{ padding: "0.625rem 0.75rem", fontSize: "0.75rem", color: "#374151" }}>{p.typeLabel}</td>
                <td style={{ padding: "0.625rem 0.75rem" }}>
                  <span style={{ padding: "0.125rem 0.5rem", borderRadius: "4px", fontSize: "0.6875rem", fontWeight: 600, background: `${p.statusColor}20`, color: p.statusColor }}>
                    {p.status}
                  </span>
                </td>
                <td style={{ padding: "0.625rem 0.75rem", fontSize: "0.75rem", color: "#374151" }}>★ {p.average_rating.toFixed(1)}</td>
                <td style={{ padding: "0.625rem 0.75rem", fontSize: "0.75rem", color: "#374151" }}>{p.total_escrow_transactions}</td>
                <td style={{ padding: "0.625rem 0.75rem", fontSize: "0.75rem", color: "#6B7280" }}>{new Date(p.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
