"use client";

import { useState, useCallback } from "react";
import OpportunityCard from "./OpportunityCard";
import type { OpportunityType } from "@/lib/opportunity-types";

interface Oppty {
  id: string;
  title: string;
  organisation: string;
  location_country: string;
  location_city: string | null;
  type: string;
  description: string;
  requirements: string | null;
  salary_range: string | null;
  funding_amount: string | null;
  deadline: string | null;
  application_url: string;
  is_featured: boolean;
  related_service_slug: string | null;
  related_goal_template_id: string | null;
  source_url: string | null;
  source_name: string | null;
  ai_generated: boolean;
  ai_relevance_score: number | null;
  created_at?: string;
  relevanceScore?: number;
  is_saved?: boolean;
  is_applied?: boolean;
}

interface Props {
  opportunityTypes: OpportunityType[];
  countries: string[];
}

export default function SearchExplore({ opportunityTypes, countries }: Props) {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [results, setResults] = useState<Oppty[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = useCallback(async () => {
    setLoading(true);
    setError("");
    setHasSearched(true);
    try {
      const res = await fetch("/api/opportunities/feed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: query || undefined,
          type: typeFilter || undefined,
          country: countryFilter || undefined,
        }),
      });
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      setResults(data.feed || []);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [query, typeFilter, countryFilter]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") handleSearch();
    },
    [handleSearch]
  );

  const handleApply = useCallback((_id: string) => {}, []);
  const handleSave = useCallback((_id: string, _saved: boolean) => {}, []);

  const chipStyle = (isActive: boolean): React.CSSProperties => ({
    display: "inline-flex",
    alignItems: "center",
    padding: "0.35rem 0.75rem",
    borderRadius: 9999,
    fontSize: "0.8rem",
    fontWeight: isActive ? 600 : 400,
    cursor: "pointer",
    border: isActive ? "2px solid var(--teal)" : "2px solid var(--border)",
    background: isActive ? "var(--teal)" : "transparent",
    color: isActive ? "#fff" : "var(--text-primary)",
    transition: "all 0.15s ease",
  });

  return (
    <div>
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
        <input
          type="text"
          placeholder="Search by title, organisation, or description..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          style={{
            flex: 1,
            padding: "0.6rem 0.75rem",
            borderRadius: 8,
            border: "1px solid var(--border)",
            fontSize: "0.9rem",
            outline: "none",
          }}
        />
        <button
          onClick={handleSearch}
          disabled={loading}
          style={{
            padding: "0.6rem 1.25rem",
            borderRadius: 8,
            border: "none",
            background: "var(--teal)",
            color: "#fff",
            fontWeight: 600,
            fontSize: "0.9rem",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? "..." : "Search"}
        </button>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginBottom: "1.25rem" }}>
        <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", alignSelf: "center", marginRight: "0.25rem" }}>
          Type:
        </span>
        {opportunityTypes.map((t) => (
          <button
            key={t.slug}
            onClick={() => setTypeFilter(typeFilter === t.slug ? "" : t.slug)}
            style={chipStyle(typeFilter === t.slug)}
          >
            {t.emoji && <span style={{ marginRight: 4 }}>{t.emoji}</span>}
            {t.name}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginBottom: "1.25rem" }}>
        <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", alignSelf: "center", marginRight: "0.25rem" }}>
          Country:
        </span>
        {countries.slice(0, 20).map((c) => (
          <button
            key={c}
            onClick={() => setCountryFilter(countryFilter === c ? "" : c)}
            style={chipStyle(countryFilter === c)}
          >
            {c}
          </button>
        ))}
        {countries.length > 20 && (
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", alignSelf: "center" }}>
            +{countries.length - 20} more
          </span>
        )}
      </div>

      {error && (
        <p style={{ color: "var(--red)", fontSize: "0.85rem", marginBottom: "1rem" }}>{error}</p>
      )}

      {loading && (
        <p style={{ color: "var(--text-muted)", textAlign: "center", padding: "3rem 0" }}>
          Searching...
        </p>
      )}

      {!loading && hasSearched && results.length === 0 && !error && (
        <p style={{ color: "var(--text-muted)", textAlign: "center", padding: "3rem 0" }}>
          No opportunities found. Try different search terms or filters.
        </p>
      )}

      {!loading && results.length > 0 && (
        <div>
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "0.75rem" }}>
            {results.length} result{results.length !== 1 ? "s" : ""}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {results.map((opp) => (
              <OpportunityCard
                key={opp.id}
                opportunity={opp}
                onApply={handleApply}
                onSave={handleSave}
              />
            ))}
          </div>
        </div>
      )}

      {!hasSearched && !loading && (
        <p style={{ color: "var(--text-muted)", textAlign: "center", padding: "3rem 0" }}>
          Enter a search term or select filters above to find opportunities.
        </p>
      )}
    </div>
  );
}
