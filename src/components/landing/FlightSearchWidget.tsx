"use client";

import { useState } from "react";

type Tab = "flights" | "holidays" | "services";

export default function FlightSearchWidget() {
  const [activeTab, setActiveTab] = useState<Tab>("flights");
  const [tripType, setTripType] = useState<"roundtrip" | "oneway" | "multicity">("roundtrip");

  const tabStyle = (tab: Tab): React.CSSProperties => ({
    flex: 1,
    padding: "0.75rem 0.5rem",
    border: "none",
    background: "none",
    cursor: "pointer",
    fontSize: "clamp(13px, 2.5vw, 14px)",
    fontWeight: activeTab === tab ? 600 : 400,
    color: activeTab === tab ? "var(--teal)" : "var(--text-muted)",
    borderBottom: activeTab === tab ? "2px solid var(--teal)" : "2px solid transparent",
    transition: "color 0.15s ease, border-color 0.15s ease",
  });

  return (
    <div
      className="flight-widget"
      style={{
        background: "white",
        borderRadius: "var(--radius-xl)",
        boxShadow: "var(--shadow-lg)",
        padding: "clamp(1.25rem, 3vw, 1.5rem)",
        marginBottom: "-40px",
        position: "relative",
        zIndex: 10,
      }}
    >
      {/* Tab row */}
      <div style={{ display: "flex", marginBottom: "1.25rem" }}>
        <button style={tabStyle("flights")} onClick={() => setActiveTab("flights")}>
          ✈ Flights
        </button>
        <button style={tabStyle("holidays")} onClick={() => setActiveTab("holidays")}>
          🏖 Holidays
        </button>
        <button style={tabStyle("services")} onClick={() => setActiveTab("services")}>
          🌍 Services
        </button>
      </div>

      {/* FLIGHTS TAB */}
      {activeTab === "flights" && (
        <div>
          {/* Sub-tabs: Round Trip / One Way / Multi-City */}
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
            {(["roundtrip", "oneway", "multicity"] as const).map((type) => (
              <button
                key={type}
                onClick={() => setTripType(type)}
                style={{
                  padding: "6px 16px",
                  borderRadius: "20px",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: 500,
                  background:
                    tripType === type ? "var(--midnight)" : "var(--gray-100)",
                  color: tripType === type ? "white" : "var(--text-secondary)",
                  transition: "background 0.15s ease",
                }}
              >
                {type === "roundtrip"
                  ? "Round Trip"
                  : type === "oneway"
                  ? "One Way"
                  : "Multi-City"}
              </button>
            ))}
          </div>

          {/* FROM */}
          <div
            style={{
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-md)",
              padding: "0.875rem 1rem",
              marginBottom: "0.5rem",
            }}
          >
            <div
              style={{
                fontSize: "10px",
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              From
            </div>
            <input
              type="text"
              placeholder="City or airport"
              defaultValue="Lagos, Nigeria (LOS)"
              style={{
                border: "none",
                outline: "none",
                fontSize: "14px",
                fontWeight: 500,
                width: "100%",
                color: "var(--text-primary)",
              }}
            />
          </div>

          {/* Swap button */}
          <div style={{ display: "flex", justifyContent: "center", margin: "0.25rem 0" }}>
            <button
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                border: "1px solid var(--border)",
                background: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              ⇄
            </button>
          </div>

          {/* TO */}
          <div
            style={{
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-md)",
              padding: "0.875rem 1rem",
              marginBottom: "0.5rem",
            }}
          >
            <div
              style={{
                fontSize: "10px",
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              To
            </div>
            <input
              type="text"
              placeholder="City or airport"
              style={{
                border: "none",
                outline: "none",
                fontSize: "14px",
                fontWeight: 500,
                width: "100%",
                color: "var(--text-primary)",
              }}
            />
          </div>

          {/* Depart */}
          <div
            style={{
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-md)",
              padding: "0.875rem 1rem",
              marginBottom: "0.5rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: "10px",
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Depart
              </div>
              <div
                style={{
                  fontSize: "14px",
                  fontWeight: 500,
                  color: "var(--text-secondary)",
                }}
              >
                mm/dd/yyyy
              </div>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>

          {/* Return (hidden when One Way) */}
          {tripType !== "oneway" && (
            <div
              style={{
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-md)",
                padding: "0.875rem 1rem",
                marginBottom: "0.5rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: "10px",
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Return
                </div>
                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: 500,
                    color: "var(--text-secondary)",
                  }}
                >
                  mm/dd/yyyy
                </div>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
          )}

          {/* Travellers & class */}
          <div
            style={{
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-md)",
              padding: "0.875rem 1rem",
              marginBottom: "1rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              cursor: "pointer",
            }}
          >
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: "10px",
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Travellers
              </div>
              <div
                style={{
                  fontSize: "14px",
                  fontWeight: 500,
                  color: "var(--text-primary)",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-primary)" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                1 Adult · Economy
              </div>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>

          {/* Search button */}
          <button
            onClick={() => {
              window.location.href = "/signup?return=/dashboard/flights";
            }}
            style={{
              width: "100%",
              padding: "1rem",
              minHeight: "52px",
              background: "var(--teal)",
              color: "var(--midnight)",
              fontWeight: 700,
              fontSize: "16px",
              borderRadius: "var(--radius-md)",
              border: "none",
              cursor: "pointer",
              transition: "background 0.15s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "var(--teal-light)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "var(--teal)")
            }
          >
            Search Flights →
          </button>
        </div>
      )}

      {/* HOLIDAYS TAB */}
      {activeTab === "holidays" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <div
            style={{
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-md)",
              padding: "0.875rem 1rem",
            }}
          >
            <div
              style={{
                fontSize: "10px",
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Destination
            </div>
            <input
              type="text"
              placeholder="Where do you want to go?"
              style={{
                border: "none",
                outline: "none",
                fontSize: "14px",
                fontWeight: 500,
                width: "100%",
              }}
            />
          </div>
          <div
            style={{
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-md)",
              padding: "0.875rem 1rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: "10px",
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Travel dates
              </div>
              <div
                style={{
                  fontSize: "14px",
                  fontWeight: 500,
                  color: "var(--text-secondary)",
                }}
              >
                mm/dd/yyyy
              </div>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
          <div
            style={{
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-md)",
              padding: "0.875rem 1rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: "10px",
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Travellers
              </div>
              <div
                style={{
                  fontSize: "14px",
                  fontWeight: 500,
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-primary)" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                2 Adults
              </div>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
          <button
            onClick={() => {
              window.location.href = "/signup";
            }}
            style={{
              width: "100%",
              padding: "1rem",
              minHeight: "52px",
              background: "var(--teal)",
              color: "var(--midnight)",
              fontWeight: 700,
              fontSize: "16px",
              borderRadius: "var(--radius-md)",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
            }}
          >
            Browse Holiday Packages →
          </button>
        </div>
      )}

      {/* SERVICES TAB */}
      {activeTab === "services" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <div
            style={{
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-md)",
              padding: "0.875rem 1rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: "10px",
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                What do you need?
              </div>
              <div
                style={{
                  fontSize: "14px",
                  fontWeight: 500,
                  color: "var(--text-secondary)",
                }}
              >
                Select a service
              </div>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
          <div
            style={{
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-md)",
              padding: "0.875rem 1rem",
            }}
          >
            <div
              style={{
                fontSize: "10px",
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Destination
            </div>
            <input
              type="text"
              placeholder="Country or city"
              style={{
                border: "none",
                outline: "none",
                fontSize: "14px",
                fontWeight: 500,
                width: "100%",
              }}
            />
          </div>
          <button
            onClick={() => {
              window.location.href = "/signup";
            }}
            style={{
              width: "100%",
              padding: "1rem",
              minHeight: "52px",
              background: "var(--teal)",
              color: "var(--midnight)",
              fontWeight: 700,
              fontSize: "16px",
              borderRadius: "var(--radius-md)",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
            }}
          >
            Check My Eligibility →
          </button>
        </div>
      )}
    </div>
  );
}
