"use client";

import { useState, useEffect } from "react";
import FlightResultCard from "./FlightResultCard";

interface FlightSearchFormProps {
  defaultOrigin: string;
  recentSearches: any[];
  goalDestinations: any[];
}

export default function FlightSearchForm({ defaultOrigin, recentSearches: _recentSearches, goalDestinations: _goalDestinations }: FlightSearchFormProps) {
  const [tripType, setTripType] = useState<"round_trip" | "one_way">("round_trip");
  const [origin, setOrigin] = useState(defaultOrigin);
  const [originLabel, setOriginLabel] = useState(defaultOrigin ? "Lagos, Nigeria (LOS)" : "");
  const [destination, setDestination] = useState("");
  const [destinationLabel, setDestinationLabel] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [infants, _setInfants] = useState(0);
  const [cabinClass, setCabinClass] = useState<"economy" | "premium_economy" | "business" | "first">("economy");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState("");

  const [originSuggestions, setOriginSuggestions] = useState<any[]>([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState<any[]>([]);
  const [originFocused, setOriginFocused] = useState(false);
  const [destinationFocused, setDestinationFocused] = useState(false);

  async function fetchSuggestions(query: string, setter: (v: any[]) => void) {
    if (query.length < 2) { setter([]); return; }
    const res = await fetch(`/api/flights/places?q=${encodeURIComponent(query)}`);
    const data = await res.json();
    setter(data.places || []);
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      if (originFocused) fetchSuggestions(originLabel, setOriginSuggestions);
    }, 300);
    return () => clearTimeout(timer);
  }, [originLabel, originFocused]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (destinationFocused) fetchSuggestions(destinationLabel, setDestinationSuggestions);
    }, 300);
    return () => clearTimeout(timer);
  }, [destinationLabel, destinationFocused]);

  async function handleSearch() {
    if (!origin || !destination || !departureDate) {
      setError("Please fill in origin, destination, and departure date.");
      return;
    }
    setSearching(true);
    setError("");
    setResults(null);

    const res = await fetch("/api/flights/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ origin, destination, departureDate, returnDate: tripType === "round_trip" ? returnDate : undefined, adults, children, infants, cabinClass }),
    });

    const data = await res.json();
    if (!res.ok) { setError(data.error || "Search failed. Please try again."); setSearching(false); return; }
    setResults(data);
    setSearching(false);
  }

  return (
    <div>
      <div style={{ background: "var(--off-white)", borderRadius: "var(--radius-lg)", padding: "1.5rem", border: "1px solid var(--border)" }}>
        {/* Trip type toggle */}
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem" }}>
          <button
            onClick={() => setTripType("round_trip")}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "var(--radius-md)",
              border: "none",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "0.875rem",
              background: tripType === "round_trip" ? "var(--midnight)" : "var(--gray-100)",
              color: tripType === "round_trip" ? "white" : "var(--text-secondary)",
            }}
          >
            Round trip
          </button>
          <button
            onClick={() => setTripType("one_way")}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "var(--radius-md)",
              border: "none",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "0.875rem",
              background: tripType === "one_way" ? "var(--midnight)" : "var(--gray-100)",
              color: tripType === "one_way" ? "white" : "var(--text-secondary)",
            }}
          >
            One way
          </button>
        </div>

        {/* Origin / Destination */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
          <div style={{ position: "relative" }}>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.375rem" }}>From</label>
            <input
              value={originLabel}
              onChange={(e) => { setOriginLabel(e.target.value); if (!e.target.value) setOrigin(""); }}
              onFocus={() => setOriginFocused(true)}
              onBlur={() => setTimeout(() => setOriginFocused(false), 200)}
              placeholder="City or airport"
              style={{ width: "100%", padding: "0.75rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", fontSize: "0.875rem", outline: "none" }}
            />
            {originSuggestions.length > 0 && originFocused && (
              <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "white", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", zIndex: 100, boxShadow: "var(--shadow-md)" }}>
                {originSuggestions.map((place: any) => (
                  <div key={place.iata_code || place.id} style={{ padding: "0.75rem 1rem", cursor: "pointer", fontSize: "0.875rem" }}
                    onMouseDown={() => {
                      setOrigin(place.iata_code);
                      setOriginLabel(`${place.name} (${place.iata_code})`);
                      setOriginSuggestions([]);
                    }}>
                    <strong>{place.iata_code}</strong> — {place.name}, {place.city_name || place.country_name}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div style={{ position: "relative" }}>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.375rem" }}>To</label>
            <input
              value={destinationLabel}
              onChange={(e) => { setDestinationLabel(e.target.value); if (!e.target.value) setDestination(""); }}
              onFocus={() => setDestinationFocused(true)}
              onBlur={() => setTimeout(() => setDestinationFocused(false), 200)}
              placeholder="City or airport"
              style={{ width: "100%", padding: "0.75rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", fontSize: "0.875rem", outline: "none" }}
            />
            {destinationSuggestions.length > 0 && destinationFocused && (
              <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "white", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", zIndex: 100, boxShadow: "var(--shadow-md)" }}>
                {destinationSuggestions.map((place: any) => (
                  <div key={place.iata_code || place.id} style={{ padding: "0.75rem 1rem", cursor: "pointer", fontSize: "0.875rem" }}
                    onMouseDown={() => {
                      setDestination(place.iata_code);
                      setDestinationLabel(`${place.name} (${place.iata_code})`);
                      setDestinationSuggestions([]);
                    }}>
                    <strong>{place.iata_code}</strong> — {place.name}, {place.city_name || place.country_name}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Dates */}
        <div style={{ display: "grid", gridTemplateColumns: tripType === "round_trip" ? "1fr 1fr" : "1fr", gap: "1rem", marginBottom: "1rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.375rem" }}>Departure</label>
            <input
              type="date"
              value={departureDate}
              onChange={(e) => setDepartureDate(e.target.value)}
              style={{ width: "100%", padding: "0.75rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", fontSize: "0.875rem", outline: "none" }}
            />
          </div>
          {tripType === "round_trip" && (
            <div>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.375rem" }}>Return</label>
              <input
                type="date"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                style={{ width: "100%", padding: "0.75rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", fontSize: "0.875rem", outline: "none" }}
              />
            </div>
          )}
        </div>

        {/* Travellers & Cabin class */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.25rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.375rem" }}>Passengers</label>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                <span style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>Adults</span>
                <button onClick={() => setAdults(Math.max(1, adults - 1))} style={{ width: 28, height: 28, borderRadius: "50%", border: "1px solid var(--border)", background: "white", cursor: "pointer", fontSize: "1rem", lineHeight: 1 }}>−</button>
                <span style={{ fontSize: "0.875rem", fontWeight: 600, minWidth: 16, textAlign: "center" }}>{adults}</span>
                <button onClick={() => setAdults(Math.min(9, adults + 1))} style={{ width: 28, height: 28, borderRadius: "50%", border: "1px solid var(--border)", background: "white", cursor: "pointer", fontSize: "1rem", lineHeight: 1 }}>+</button>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                <span style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>Children</span>
                <button onClick={() => setChildren(Math.max(0, children - 1))} style={{ width: 28, height: 28, borderRadius: "50%", border: "1px solid var(--border)", background: "white", cursor: "pointer", fontSize: "1rem", lineHeight: 1 }}>−</button>
                <span style={{ fontSize: "0.875rem", fontWeight: 600, minWidth: 16, textAlign: "center" }}>{children}</span>
                <button onClick={() => setChildren(Math.min(6, children + 1))} style={{ width: 28, height: 28, borderRadius: "50%", border: "1px solid var(--border)", background: "white", cursor: "pointer", fontSize: "1rem", lineHeight: 1 }}>+</button>
              </div>
            </div>
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.375rem" }}>Cabin class</label>
            <select
              value={cabinClass}
              onChange={(e) => setCabinClass(e.target.value as any)}
              style={{ width: "100%", padding: "0.75rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", fontSize: "0.875rem", outline: "none", background: "white" }}
            >
              <option value="economy">Economy</option>
              <option value="premium_economy">Premium Economy</option>
              <option value="business">Business</option>
              <option value="first">First Class</option>
            </select>
          </div>
        </div>

        {/* Error */}
        {error && (
          <p style={{ color: "var(--danger)", fontSize: "0.875rem", marginBottom: "1rem" }}>{error}</p>
        )}

        {/* Search button */}
        <button
          onClick={handleSearch}
          disabled={searching}
          style={{
            width: "100%",
            padding: "0.875rem",
            background: "var(--midnight)",
            color: "white",
            fontWeight: 700,
            fontSize: "0.9375rem",
            borderRadius: "var(--radius-md)",
            border: "none",
            cursor: searching ? "not-allowed" : "pointer",
            opacity: searching ? 0.6 : 1,
          }}
        >
          {searching ? "Searching..." : "Search flights"}
        </button>
      </div>

      {/* Results */}
      {results && (
        <div style={{ marginTop: "1.5rem" }}>
          <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
            {results.offers.length} flights found
          </p>
          {results.offers.map((offer: any) => (
            <FlightResultCard
              key={offer.id}
              offer={offer}
              onSelect={() => window.location.href = `/dashboard/flights/booking/${offer.id}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
