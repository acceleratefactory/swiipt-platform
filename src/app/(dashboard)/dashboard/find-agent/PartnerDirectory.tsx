"use client";
import { useState, useMemo } from "react";
import PartnerCard from "@/components/dashboard/agents/PartnerCard";

interface PartnerData {
  id: string; name: string; business_name: string | null;
  partner_type: string; typeLabel: string;
  specialisations: string[]; destinations_served: string[];
  average_rating: number; total_reviews: number;
  total_escrow_transactions: number; years_in_operation: number | null;
}

const PARTNER_TYPES = [
  { value: "immigration_lawyer", label: "Immigration Lawyer" },
  { value: "visa_agent", label: "Visa Agent" },
  { value: "relocation_consultant", label: "Relocation Consultant" },
  { value: "trade_agent", label: "Trade Agent" },
  { value: "recruitment_agency", label: "Recruitment Agency" },
  { value: "education_consultant", label: "Education Consultant" },
];

export default function PartnerDirectory({ partners }: { partners: PartnerData[] }) {
  const [typeFilter, setTypeFilter] = useState("all");
  const [destFilter, setDestFilter] = useState("all");
  const [sortBy, setSortBy] = useState("rating");

  const allDestinations = useMemo(() => {
    const dests = new Set<string>();
    partners.forEach((p) => (p.destinations_served || []).forEach((d) => dests.add(d)));
    return Array.from(dests).sort();
  }, [partners]);

  const filtered = useMemo(() => {
    let result = [...partners];
    if (typeFilter !== "all") result = result.filter((p) => p.partner_type === typeFilter);
    if (destFilter !== "all") result = result.filter((p) => (p.destinations_served || []).includes(destFilter));
    if (sortBy === "rating") result.sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0));
    else if (sortBy === "deals") result.sort((a, b) => (b.total_escrow_transactions || 0) - (a.total_escrow_transactions || 0));
    else if (sortBy === "name") result.sort((a, b) => (a.business_name || a.name).localeCompare(b.business_name || b.name));
    return result;
  }, [partners, typeFilter, destFilter, sortBy]);

  return (
    <div>
      {/* Filter bar */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} style={{ padding: "0.5rem 0.75rem", fontSize: "0.8125rem", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", background: "white", outline: "none" }}>
          <option value="all">All Types</option>
          {PARTNER_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <select value={destFilter} onChange={(e) => setDestFilter(e.target.value)} style={{ padding: "0.5rem 0.75rem", fontSize: "0.8125rem", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", background: "white", outline: "none" }}>
          <option value="all">All Destinations</option>
          {allDestinations.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ padding: "0.5rem 0.75rem", fontSize: "0.8125rem", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", background: "white", outline: "none" }}>
          <option value="rating">Sort: Highest Rated</option>
          <option value="deals">Sort: Most Deals</option>
          <option value="name">Sort: Name A–Z</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div style={{ padding: "3rem", background: "white", borderRadius: "var(--radius-xl)", border: "1px solid var(--border)", textAlign: "center" }}>
          <p style={{ fontSize: "0.9375rem", color: "#6B7280", margin: "0 0 0.75rem 0" }}>No agents match your filters.</p>
          <button onClick={() => { setTypeFilter("all"); setDestFilter("all"); }} style={{ padding: "0.5rem 1rem", background: "var(--teal)", color: "var(--midnight)", fontWeight: 600, fontSize: "0.8125rem", border: "none", borderRadius: "var(--radius-sm)", cursor: "pointer" }}>
            Clear filters
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1rem" }}>
          {filtered.map((partner) => (
            <PartnerCard
              key={partner.id}
              id={partner.id}
              name={partner.name}
              businessName={partner.business_name}
              type={partner.typeLabel}
              specialisations={partner.specialisations || []}
              destinations={partner.destinations_served || []}
              rating={partner.average_rating || 0}
              reviewCount={partner.total_reviews || 0}
              transactionCount={partner.total_escrow_transactions || 0}
              yearsInOperation={partner.years_in_operation}
            />
          ))}
        </div>
      )}
    </div>
  );
}
