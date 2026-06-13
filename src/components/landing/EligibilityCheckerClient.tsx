"use client"

import { useState } from "react"

interface Pathway {
  id: string
  pathway_name: string
  destination: string
  match_type: "HIGH" | "GOOD" | "POSSIBLE"
  processing_weeks: string
  starting_price_ngn: number
  description: string
  requires_destination: string[]
  requires_employment: string[]
  requires_passport: string[]
  requires_income: string[]
  excludes_timeline: string[]
  priority_order: number
  is_active: boolean
}

const questions = [
  {
    id: "destination",
    question: "Where do you want to go?",
    options: [
      { value: "UAE", label: "🇦🇪 UAE / Dubai" },
      { value: "Canada", label: "🇨🇦 Canada" },
      { value: "UK", label: "🇬🇧 United Kingdom" },
      { value: "Qatar", label: "🇶🇦 Qatar" },
      { value: "Portugal", label: "🇵🇹 Portugal" },
      { value: "unsure", label: "🤔 Not sure yet" },
    ],
  },
  {
    id: "employment",
    question: "What is your employment status?",
    options: [
      { value: "employed", label: "Employed full-time" },
      { value: "selfemployed", label: "Self-employed / freelancer" },
      { value: "business", label: "Business owner" },
      { value: "student", label: "Student" },
      { value: "between", label: "Between jobs" },
    ],
  },
  {
    id: "passport",
    question: "Do you have a valid international passport?",
    options: [
      { value: "valid2plus", label: "Yes — valid 2+ years" },
      { value: "validunder2", label: "Yes — expires within 2 years" },
      { value: "none", label: "No passport yet" },
    ],
  },
  {
    id: "income",
    question: "What is your approximate monthly income?",
    options: [
      { value: "under200k", label: "Under ₦200,000" },
      { value: "200to500k", label: "₦200,000 – ₦500,000" },
      { value: "500kto1m", label: "₦500,000 – ₦1,000,000" },
      { value: "over1m", label: "Over ₦1,000,000" },
    ],
  },
  {
    id: "timeline",
    question: "What is your target timeline?",
    options: [
      { value: "3to6", label: "3–6 months" },
      { value: "6to12", label: "6–12 months" },
      { value: "1to2years", label: "1–2 years" },
      { value: "exploring", label: "Just exploring" },
    ],
  },
]

interface PathwayResult {
  name: string
  match: "HIGH" | "GOOD" | "POSSIBLE"
  processingWeeks: string
  startingPrice: string
  reason: string
}

function getResults(pathways: Pathway[], answers: Record<string, string>): PathwayResult[] {
  const { destination, employment, passport, income, timeline } = answers

  const matched = pathways.filter((pathway) => {
    if (pathway.requires_destination?.length > 0) {
      if (!pathway.requires_destination.includes(destination)) return false
    }
    if (pathway.requires_employment?.length > 0) {
      if (!pathway.requires_employment.includes(employment)) return false
    }
    if (pathway.requires_passport?.length > 0) {
      if (!pathway.requires_passport.includes(passport)) return false
    }
    if (pathway.requires_income?.length > 0) {
      if (!pathway.requires_income.includes(income)) return false
    }
    if (pathway.excludes_timeline?.length > 0) {
      if (pathway.excludes_timeline.includes(timeline)) return false
    }
    return true
  })

  return matched.slice(0, 3).map((p) => ({
    name: p.pathway_name,
    match: p.match_type,
    processingWeeks: p.processing_weeks,
    startingPrice: `₦${Number(p.starting_price_ngn).toLocaleString()}`,
    reason: p.description,
  }))
}

export default function EligibilityCheckerClient({ pathways }: { pathways: Pathway[] }) {
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [showResult, setShowResult] = useState(false)

  const progress = ((currentStep + 1) / questions.length) * 100

  return (
    <section style={{ background: "var(--midnight)", padding: "5rem 0" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 2rem" }}>
        {/* Section header */}
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <h2
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "clamp(1.75rem, 3vw, 2.5rem)",
              fontWeight: 800,
              color: "white",
              marginBottom: "0.75rem",
            }}
          >
            Are you eligible?
          </h2>
          <p
            style={{
              fontSize: "1.125rem",
              color: "var(--gray-300)",
              maxWidth: "560px",
              margin: "0 auto",
              lineHeight: 1.6,
            }}
          >
            Answer 5 questions. Get an instant assessment of your best pathways.
          </p>
        </div>

        {/* Centered card */}
        <div
          className="eligibility-card"
          style={{
            maxWidth: "600px",
            margin: "0 auto",
            background: "white",
            borderRadius: "var(--radius-xl)",
            boxShadow: "var(--shadow-lg)",
            padding: "2.5rem",
          }}
        >
          {/* Progress bar */}
          <div
            style={{
              height: "4px",
              background: "var(--gray-100)",
              borderRadius: "2px",
              marginBottom: "2rem",
            }}
          >
            <div
              style={{
                height: "100%",
                background: "var(--teal)",
                borderRadius: "2px",
                width: `${progress}%`,
                transition: "width 0.3s ease",
              }}
            />
          </div>

          {!showResult ? (
            <div>
              {/* Question */}
              <h3
                style={{
                  fontSize: "1.25rem",
                  fontWeight: 700,
                  color: "var(--midnight)",
                  marginBottom: "1.5rem",
                }}
              >
                {questions[currentStep].question}
              </h3>

              {/* Options */}
              {questions[currentStep].options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    const newAnswers = { ...answers, [questions[currentStep].id]: option.value }
                    setAnswers(newAnswers)
                    if (currentStep < questions.length - 1) {
                      setCurrentStep(currentStep + 1)
                    } else {
                      setShowResult(true)
                    }
                  }}
                  style={{
                    width: "100%",
                    padding: "1rem 1.25rem",
                    marginBottom: "0.5rem",
                    background: "white",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-md)",
                    textAlign: "left",
                    fontSize: "0.9375rem",
                    color: "var(--text-primary)",
                    cursor: "pointer",
                    transition: "border-color 0.15s, background 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    (e.target as HTMLElement).style.borderColor = "var(--teal)"
                    ;(e.target as HTMLElement).style.background = "var(--teal-pale)"
                  }}
                  onMouseLeave={(e) => {
                    (e.target as HTMLElement).style.borderColor = "var(--border)"
                    ;(e.target as HTMLElement).style.background = "white"
                  }}
                >
                  {option.label}
                </button>
              ))}

              {/* Back button */}
              {currentStep > 0 && !showResult && (
                <button
                  onClick={() => setCurrentStep(currentStep - 1)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--text-muted)",
                    fontSize: "0.875rem",
                    cursor: "pointer",
                    marginTop: "0.5rem",
                  }}
                >
                  ← Back
                </button>
              )}
            </div>
          ) : (
            /* Result screen */
            <div>
              <h3
                style={{
                  fontSize: "1.25rem",
                  fontWeight: 700,
                  color: "var(--midnight)",
                  marginBottom: "0.5rem",
                }}
              >
                Your best pathways
              </h3>
              <p
                style={{
                  fontSize: "0.875rem",
                  color: "var(--text-muted)",
                  marginBottom: "1.5rem",
                }}
              >
                Based on your answers:
              </p>

              {getResults(pathways, answers).map((result, index) => (
                <div
                  key={index}
                  style={{
                    border: index === 0 ? "2px solid var(--teal)" : "1px solid var(--border)",
                    borderRadius: "var(--radius-md)",
                    padding: "1.25rem",
                    marginBottom: "0.75rem",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: "0.5rem",
                    }}
                  >
                    <span style={{ fontWeight: 700, color: "var(--midnight)", fontSize: "0.9375rem" }}>
                      {result.name}
                    </span>
                    <span
                      style={{
                        fontSize: "0.7rem",
                        fontWeight: 700,
                        padding: "3px 8px",
                        borderRadius: "20px",
                        background:
                          result.match === "HIGH"
                            ? "var(--teal-pale)"
                            : result.match === "GOOD"
                              ? "#FFF3CD"
                              : "var(--gray-100)",
                        color:
                          result.match === "HIGH"
                            ? "var(--teal)"
                            : result.match === "GOOD"
                              ? "#856404"
                              : "var(--text-muted)",
                      }}
                    >
                      {result.match} MATCH
                    </span>
                  </div>
                  <p
                    style={{
                      fontSize: "0.8125rem",
                      color: "var(--text-secondary)",
                      marginBottom: "0.75rem",
                      lineHeight: 1.5,
                    }}
                  >
                    {result.reason}
                  </p>
                  <div style={{ display: "flex", gap: "1rem" }}>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      ⏱ {result.processingWeeks}
                    </span>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      From {result.startingPrice}
                    </span>
                  </div>
                </div>
              ))}

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
                  marginTop: "1rem",
                }}
              >
                Get started with your top pathway →
              </button>

              <button
                onClick={() => {
                  setCurrentStep(0)
                  setAnswers({})
                  setShowResult(false)
                }}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  background: "none",
                  border: "none",
                  color: "var(--text-muted)",
                  fontSize: "0.875rem",
                  cursor: "pointer",
                  marginTop: "0.5rem",
                }}
              >
                Start over
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
