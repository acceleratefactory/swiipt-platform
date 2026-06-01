"use client"

import { useState } from "react"

type CalculatorKey = `${string}__${string}__${string}`

const costData: Record<CalculatorKey, {
  serviceFee: number
  govFee: number
  docPrep: number
  travelEstimate: number
  firstMonthSetup: number
  processingWeeks: string
  successRate: number
}> = {
  "UAE__residency__solo": { serviceFee: 850000, govFee: 280000, docPrep: 45000, travelEstimate: 320000, firstMonthSetup: 650000, processingWeeks: "8–12", successRate: 94 },
  "UAE__residency__couple": { serviceFee: 1200000, govFee: 420000, docPrep: 65000, travelEstimate: 580000, firstMonthSetup: 950000, processingWeeks: "8–12", successRate: 94 },
  "UAE__residency__family": { serviceFee: 1600000, govFee: 680000, docPrep: 85000, travelEstimate: 980000, firstMonthSetup: 1400000, processingWeeks: "10–14", successRate: 91 },
  "UAE__company__solo": { serviceFee: 280000, govFee: 120000, docPrep: 25000, travelEstimate: 0, firstMonthSetup: 0, processingWeeks: "5–10 days", successRate: 99 },
  "UAE__visa__solo": { serviceFee: 420000, govFee: 180000, docPrep: 35000, travelEstimate: 280000, firstMonthSetup: 420000, processingWeeks: "6–10", successRate: 92 },
  "UAE__visa__couple": { serviceFee: 680000, govFee: 280000, docPrep: 55000, travelEstimate: 520000, firstMonthSetup: 750000, processingWeeks: "6–10", successRate: 92 },
  "UAE__visa__family": { serviceFee: 980000, govFee: 420000, docPrep: 75000, travelEstimate: 880000, firstMonthSetup: 1200000, processingWeeks: "8–12", successRate: 89 },
  "Canada__residency__solo": { serviceFee: 1200000, govFee: 450000, docPrep: 65000, travelEstimate: 480000, firstMonthSetup: 980000, processingWeeks: "16–24", successRate: 88 },
  "Canada__residency__couple": { serviceFee: 1750000, govFee: 680000, docPrep: 95000, travelEstimate: 880000, firstMonthSetup: 1500000, processingWeeks: "16–24", successRate: 88 },
  "Canada__residency__family": { serviceFee: 2200000, govFee: 980000, docPrep: 120000, travelEstimate: 1400000, firstMonthSetup: 2100000, processingWeeks: "20–28", successRate: 85 },
  "Canada__visa__solo": { serviceFee: 980000, govFee: 320000, docPrep: 55000, travelEstimate: 450000, firstMonthSetup: 850000, processingWeeks: "12–20", successRate: 86 },
  "UK__visa__solo": { serviceFee: 1100000, govFee: 520000, docPrep: 65000, travelEstimate: 520000, firstMonthSetup: 1200000, processingWeeks: "8–16", successRate: 87 },
  "UK__visa__couple": { serviceFee: 1650000, govFee: 820000, docPrep: 95000, travelEstimate: 950000, firstMonthSetup: 1850000, processingWeeks: "8–16", successRate: 87 },
  "UK__company__solo": { serviceFee: 180000, govFee: 45000, docPrep: 20000, travelEstimate: 0, firstMonthSetup: 0, processingWeeks: "3–7 days", successRate: 99 },
  "Qatar__residency__solo": { serviceFee: 750000, govFee: 240000, docPrep: 40000, travelEstimate: 290000, firstMonthSetup: 580000, processingWeeks: "8–12", successRate: 93 },
  "Qatar__visa__solo": { serviceFee: 380000, govFee: 150000, docPrep: 30000, travelEstimate: 260000, firstMonthSetup: 380000, processingWeeks: "6–10", successRate: 93 },
  "Portugal__visa__solo": { serviceFee: 950000, govFee: 280000, docPrep: 55000, travelEstimate: 650000, firstMonthSetup: 850000, processingWeeks: "12–18", successRate: 85 },
  "Georgia__visa__solo": { serviceFee: 480000, govFee: 85000, docPrep: 35000, travelEstimate: 420000, firstMonthSetup: 380000, processingWeeks: "4–8", successRate: 96 },
  "StKitts__citizenship__solo": { serviceFee: 2500000, govFee: 8200000, docPrep: 180000, travelEstimate: 480000, firstMonthSetup: 0, processingWeeks: "12–20", successRate: 91 },
}

function getKey(dest: string, service: string, family: string): CalculatorKey {
  return `${dest}__${service}__${family}` as CalculatorKey
}

const destinations = ["UAE", "Canada", "UK", "Qatar", "Portugal", "Georgia", "StKitts"]

const destLabels: Record<string, string> = {
  UAE: "🇦🇪 UAE", Canada: "🇨🇦 Canada", UK: "🇬🇧 UK",
  Qatar: "🇶🇦 Qatar", Portugal: "🇵🇹 Portugal", Georgia: "🇬🇪 Georgia", StKitts: "🇰🇳 2nd Citizenship",
}

const services = [
  { value: "residency", label: "Residency Permit" },
  { value: "visa", label: "Work / Remote Visa" },
  { value: "company", label: "Company Setup" },
  { value: "citizenship", label: "2nd Citizenship" },
]

const familySizes = [
  { value: "solo", label: "Just me" },
  { value: "couple", label: "Me + partner" },
  { value: "family", label: "With children" },
]

export default function CostCalculator() {
  const [destination, setDestination] = useState("UAE")
  const [serviceType, setServiceType] = useState("residency")
  const [familySize, setFamilySize] = useState("solo")

  const key = getKey(destination, serviceType, familySize)
  const data = costData[key] || null

  const total = data
    ? data.serviceFee + data.govFee + data.docPrep + data.travelEstimate + data.firstMonthSetup
    : null

  return (
    <section style={{ background: "var(--off-white)", padding: "5rem 0" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 2rem" }}>
        {/* Section header */}
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <h2
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "clamp(1.75rem, 3vw, 2.5rem)",
              fontWeight: 800,
              color: "var(--midnight)",
              marginBottom: "0.75rem",
            }}
          >
            How much does it actually cost?
          </h2>
          <p
            style={{
              fontSize: "1.125rem",
              color: "var(--text-muted)",
              maxWidth: "560px",
              margin: "0 auto",
              lineHeight: 1.6,
            }}
          >
            Full breakdown. No vague estimates. No sales call required.
          </p>
        </div>

        {/* Two columns */}
        <div className="lg:flex" style={{ gap: "2rem", alignItems: "flex-start" }}>
          {/* Left column — selectors */}
          <div style={{ flex: "1 1 40%", marginBottom: "2rem" }}>
            {/* Destination */}
            <div style={{ marginBottom: "2rem" }}>
              <p
                style={{
                  fontSize: "0.8125rem",
                  fontWeight: 700,
                  color: "var(--text-secondary)",
                  marginBottom: "0.75rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Destination
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                {destinations.map((dest) => (
                  <button
                    key={dest}
                    onClick={() => setDestination(dest)}
                    style={{
                      padding: "0.625rem 1.125rem",
                      borderRadius: "var(--radius-md)",
                      border: destination === dest ? "none" : "1px solid var(--border)",
                      background: destination === dest ? "var(--midnight)" : "white",
                      color: destination === dest ? "white" : "var(--text-secondary)",
                      fontWeight: 600,
                      fontSize: "0.875rem",
                      cursor: "pointer",
                      transition: "background 0.15s, color 0.15s",
                    }}
                  >
                    {destLabels[dest]}
                  </button>
                ))}
              </div>
            </div>

            {/* Service type */}
            <div style={{ marginBottom: "2rem" }}>
              <p
                style={{
                  fontSize: "0.8125rem",
                  fontWeight: 700,
                  color: "var(--text-secondary)",
                  marginBottom: "0.75rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Service type
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                {services.map((svc) => (
                  <button
                    key={svc.value}
                    onClick={() => setServiceType(svc.value)}
                    style={{
                      padding: "0.625rem 1.125rem",
                      borderRadius: "var(--radius-md)",
                      border: serviceType === svc.value ? "none" : "1px solid var(--border)",
                      background: serviceType === svc.value ? "var(--midnight)" : "white",
                      color: serviceType === svc.value ? "white" : "var(--text-secondary)",
                      fontWeight: 600,
                      fontSize: "0.875rem",
                      cursor: "pointer",
                      transition: "background 0.15s, color 0.15s",
                    }}
                  >
                    {svc.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Family size */}
            <div style={{ marginBottom: "2rem" }}>
              <p
                style={{
                  fontSize: "0.8125rem",
                  fontWeight: 700,
                  color: "var(--text-secondary)",
                  marginBottom: "0.75rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Family size
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                {familySizes.map((fam) => (
                  <button
                    key={fam.value}
                    onClick={() => setFamilySize(fam.value)}
                    style={{
                      padding: "0.625rem 1.125rem",
                      borderRadius: "var(--radius-md)",
                      border: familySize === fam.value ? "none" : "1px solid var(--border)",
                      background: familySize === fam.value ? "var(--midnight)" : "white",
                      color: familySize === fam.value ? "white" : "var(--text-secondary)",
                      fontWeight: 600,
                      fontSize: "0.875rem",
                      cursor: "pointer",
                      transition: "background 0.15s, color 0.15s",
                    }}
                  >
                    {fam.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right column — result breakdown */}
          <div style={{ flex: "1 1 60%" }}>
            {data ? (
              <div
                style={{
                  background: "white",
                  borderRadius: "var(--radius-lg)",
                  padding: "2rem",
                  border: "1px solid var(--border)",
                }}
              >
                {/* Line items */}
                {[
                  { label: "Our service fee", value: data.serviceFee },
                  { label: "Government / visa fee", value: data.govFee },
                  { label: "Document preparation", value: data.docPrep },
                  { label: "Estimated travel cost", value: data.travelEstimate },
                  { label: "First month setup estimate", value: data.firstMonthSetup },
                ].map((item) => (
                  <div
                    key={item.label}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "0.75rem 0",
                      borderBottom: "1px solid var(--gray-100)",
                    }}
                  >
                    <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                      {item.label}
                    </span>
                    <span
                      style={{
                        fontSize: "0.875rem",
                        fontWeight: 600,
                        color: "var(--midnight)",
                      }}
                    >
                      {item.value === 0 ? "—" : `₦${item.value.toLocaleString()}`}
                    </span>
                  </div>
                ))}

                {/* Total */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "1rem 0",
                    marginTop: "0.5rem",
                  }}
                >
                  <span style={{ fontWeight: 700, color: "var(--midnight)" }}>Total estimate</span>
                  <span
                    style={{
                      fontSize: "1.25rem",
                      fontWeight: 800,
                      color: "var(--midnight)",
                    }}
                  >
                    ₦{total!.toLocaleString()}
                  </span>
                </div>

                {/* Badges */}
                <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem" }}>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      background: "var(--teal-pale)",
                      color: "var(--teal)",
                      padding: "4px 10px",
                      borderRadius: "20px",
                    }}
                  >
                    ⏱ {data.processingWeeks} weeks processing
                  </span>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      background: "var(--teal-pale)",
                      color: "var(--teal)",
                      padding: "4px 10px",
                      borderRadius: "20px",
                    }}
                  >
                    ✓ {data.successRate}% success rate
                  </span>
                </div>

                {/* CTA */}
                <button
                  onClick={() => { window.location.href = "/signup" }}
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
                  We handle everything — start now →
                </button>
                <p
                  style={{
                    textAlign: "center",
                    fontSize: "0.75rem",
                    color: "var(--text-muted)",
                    marginTop: "0.75rem",
                  }}
                >
                  Or <a href="/signup" style={{ color: "var(--teal)" }}>check your eligibility first →</a>
                </p>
              </div>
            ) : (
              <div
                style={{
                  background: "white",
                  borderRadius: "var(--radius-lg)",
                  padding: "2rem",
                  border: "1px solid var(--border)",
                  textAlign: "center",
                }}
              >
                <p style={{ color: "var(--text-muted)", fontSize: "0.9375rem", lineHeight: 1.6 }}>
                  We&apos;re adding pricing for this combination. Contact us for a quote.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
