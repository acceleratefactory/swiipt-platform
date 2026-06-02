"use client";

import { useState } from "react";

type Tab = "flights" | "holidays" | "services";

export default function FlightSearchWidget() {
  const [activeTab, setActiveTab] = useState<Tab>("flights");
  const [tripType, setTripType] = useState<"roundtrip" | "oneway" | "multicity">("roundtrip");

  const tabStyle = (tab: Tab): React.CSSProperties => ({
    flex: 1,
    padding: "0.75rem 1rem",
    border: "none",
    background: "none",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: activeTab === tab ? 600 : 400,
    color: activeTab === tab ? "var(--teal)" : "var(--text-muted)",
    borderBottom: activeTab === tab ? "2px solid var(--teal)" : "2px solid transparent",
    transition: "color 0.15s ease, border-color 0.15s ease",
  });

  return (
    <div
      className="flight-card"
      style={{
        background: "white",
        borderRadius: "var(--radius-xl)",
        boxShadow: "var(--shadow-lg)",
        padding: "1.5rem",
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

          {/* FROM / TO */}
          <div
            className="flex flex-col gap-2 md:!grid md:!grid-cols-[1fr_auto_1fr] md:items-center md:gap-2"
            style={{ marginBottom: "0.75rem" }}
          >
            {/* FROM */}
            <div
              style={{
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-md)",
                padding: "0.75rem 1rem",
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
                flexShrink: 0,
              }}
            >
              ⇄
            </button>

            {/* TO */}
            <div
              style={{
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-md)",
                padding: "0.75rem 1rem",
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
          </div>

          {/* Depart / Return / Travellers */}
          <div
            className="flex flex-col gap-2 sm:!grid sm:!grid-cols-2 md:!grid-cols-3 md:gap-2"
            style={{ marginBottom: "1rem" }}
          >
            {/* Depart */}
            <div
              className="date-field"
              style={{
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-md)",
                padding: "0.75rem 1rem",
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
                Depart
              </div>
              <input
                type="date"
                className="date-input"
                style={{
                  border: "none",
                  outline: "none",
                  fontSize: "14px",
                  fontWeight: 500,
                  width: "100%",
                  color: "var(--text-primary)",
                }}
              />
              <span className="date-placeholder">mm/dd/yyyy</span>
            </div>

            {/* Return (hidden when One Way) */}
            {tripType !== "oneway" && (
              <div
                className="date-field"
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-md)",
                  padding: "0.75rem 1rem",
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
                  Return
                </div>
                <input
                  type="date"
                  className="date-input"
                  style={{
                    border: "none",
                    outline: "none",
                    fontSize: "14px",
                    fontWeight: 500,
                    width: "100%",
                    color: "var(--text-primary)",
                  }}
                />
                <span className="date-placeholder">mm/dd/yyyy</span>
              </div>
            )}

            {/* Travellers & class */}
            <div
              style={{
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-md)",
                padding: "0.75rem 1rem",
                cursor: "pointer",
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
                Travellers
              </div>
              <div
                style={{
                  fontSize: "14px",
                  fontWeight: 500,
                  color: "var(--text-primary)",
                }}
              >
                1 Adult · Economy
              </div>
            </div>
          </div>

          {/* Search button */}
          <button
            onClick={() => {
              window.location.href = "/signup?return=/dashboard/flights";
            }}
            style={{
              width: "100%",
              padding: "0.875rem",
              background: "var(--teal)",
              color: "var(--midnight)",
              fontWeight: 700,
              fontSize: "15px",
              borderRadius: "var(--radius-md)",
              border: "none",
              cursor: "pointer",
              transition: "background 0.15s ease",
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
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <div
            style={{
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-md)",
              padding: "0.75rem 1rem",
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
            className="flex flex-col gap-2 sm:!grid sm:!grid-cols-2 sm:gap-2"
          >
            <div
              className="date-field"
              style={{
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-md)",
                padding: "0.75rem 1rem",
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
                Travel dates
              </div>
              <input
                type="date"
                className="date-input"
                style={{
                  border: "none",
                  outline: "none",
                  fontSize: "14px",
                  fontWeight: 500,
                  width: "100%",
                }}
              />
              <span className="date-placeholder">mm/dd/yyyy</span>
            </div>
            <div
              style={{
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-md)",
                padding: "0.75rem 1rem",
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
                Travellers
              </div>
              <div
                style={{
                  fontSize: "14px",
                  fontWeight: 500,
                }}
              >
                2 Adults
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              window.location.href = "/signup";
            }}
            style={{
              width: "100%",
              padding: "0.875rem",
              background: "var(--teal)",
              color: "var(--midnight)",
              fontWeight: 700,
              fontSize: "15px",
              borderRadius: "var(--radius-md)",
              border: "none",
              cursor: "pointer",
            }}
          >
            Browse Holiday Packages →
          </button>
        </div>
      )}

      {/* SERVICES TAB */}
      {activeTab === "services" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <div
            style={{
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-md)",
              padding: "0.75rem 1rem",
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
              What do you need?
            </div>
            <select
              style={{
                border: "none",
                outline: "none",
                fontSize: "14px",
                fontWeight: 500,
                width: "100%",
                background: "transparent",
                color: "var(--text-primary)",
              }}
            >
              <option value="">Select a service</option>
              <option value="visa">Visa Processing</option>
              <option value="residency">Residency Permit</option>
              <option value="citizenship">2nd Citizenship</option>
              <option value="company">Company Registration</option>
              <option value="relocation">Relocation Concierge</option>
            </select>
          </div>
          <div
            style={{
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-md)",
              padding: "0.75rem 1rem",
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
              padding: "0.875rem",
              background: "var(--teal)",
              color: "var(--midnight)",
              fontWeight: 700,
              fontSize: "15px",
              borderRadius: "var(--radius-md)",
              border: "none",
              cursor: "pointer",
            }}
          >
            Check My Eligibility →
          </button>
        </div>
      )}
    </div>
  );
}
