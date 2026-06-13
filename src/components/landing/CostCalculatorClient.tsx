"use client"

import { useState } from "react"

interface CalculatorConfig {
  id: string
  destination: string
  service_type: string
  family_size: string
  service_fee_ngn: number
  government_fee_ngn: number
  document_prep_ngn: number
  travel_estimate_ngn: number
  first_month_setup_ngn: number
  processing_weeks_min: number
  processing_weeks_max: number
  success_rate: number
  is_active: boolean
}

function findConfig(configs: CalculatorConfig[], destination: string, serviceType: string, familySize: string) {
  return configs.find(
    c => c.destination === destination &&
         c.service_type === serviceType &&
         c.family_size === familySize
  ) || null
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

export default function CostCalculatorClient({ configs }: { configs: CalculatorConfig[] }) {
  const [destination, setDestination] = useState("UAE")
  const [serviceType, setServiceType] = useState("residency")
  const [familySize, setFamilySize] = useState("solo")

  const data = findConfig(configs, destination, serviceType, familySize)

  const total = data
    ? data.service_fee_ngn + data.government_fee_ngn + data.document_prep_ngn + data.travel_estimate_ngn + data.first_month_setup_ngn
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
                  { label: "Our service fee", value: data.service_fee_ngn },
                  { label: "Government / visa fee", value: data.government_fee_ngn },
                  { label: "Document preparation", value: data.document_prep_ngn },
                  { label: "Estimated travel cost", value: data.travel_estimate_ngn },
                  { label: "First month setup estimate", value: data.first_month_setup_ngn },
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
                    ⏱ {data.processing_weeks_min}–{data.processing_weeks_max} weeks processing
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
                    ✓ {data.success_rate}% success rate
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
