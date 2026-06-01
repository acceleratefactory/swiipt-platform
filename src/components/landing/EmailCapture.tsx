"use client"

import { useState } from "react"

export default function EmailCapture() {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setStatus("loading")

    const res = await fetch("/api/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })

    if (res.ok) {
      setStatus("success")
    } else {
      setStatus("error")
      setErrorMessage("Something went wrong. Please try again.")
    }
  }

  return (
    <section style={{ background: "var(--teal)", padding: "4rem 2rem" }}>
      <div style={{ maxWidth: "560px", margin: "0 auto", textAlign: "center" }}>
        <h2
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "clamp(1.5rem, 3vw, 2rem)",
            fontWeight: 800,
            color: "var(--midnight)",
            marginBottom: "0.75rem",
          }}
        >
          Stay ahead of visa changes.
        </h2>
        <p
          style={{
            color: "var(--midnight)",
            opacity: 0.75,
            fontSize: "1rem",
            marginBottom: "2rem",
            lineHeight: 1.6,
          }}
        >
          Weekly updates on policy changes, new visa categories, Express Entry draws,
          and deadline reminders. Used by 3,000+ people planning their move.
        </p>

        {status === "success" ? (
          <div
            style={{
              background: "rgba(6,17,43,0.1)",
              borderRadius: "var(--radius-md)",
              padding: "1.5rem",
            }}
          >
            <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>✓</div>
            <p style={{ fontWeight: 700, color: "var(--midnight)" }}>
              You&apos;re in! Check your inbox.
            </p>
            <p
              style={{
                fontSize: "0.875rem",
                color: "var(--midnight)",
                opacity: 0.7,
                marginTop: "0.25rem",
              }}
            >
              Your first update arrives this week.
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            style={{
              display: "flex",
              gap: "0.5rem",
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email address"
              required
              style={{
                flex: "1 1 260px",
                padding: "0.875rem 1rem",
                borderRadius: "var(--radius-md)",
                border: "none",
                fontSize: "0.9375rem",
                outline: "none",
                color: "var(--text-primary)",
              }}
            />
            <button
              type="submit"
              disabled={status === "loading"}
              style={{
                padding: "0.875rem 1.5rem",
                background: "var(--midnight)",
                color: "white",
                fontWeight: 700,
                fontSize: "0.9375rem",
                borderRadius: "var(--radius-md)",
                border: "none",
                cursor: status === "loading" ? "not-allowed" : "pointer",
                opacity: status === "loading" ? 0.7 : 1,
                whiteSpace: "nowrap",
              }}
            >
              {status === "loading" ? "Subscribing..." : "Subscribe \u2014 it's free"}
            </button>
            {status === "error" && (
              <p
                style={{
                  width: "100%",
                  color: "var(--danger)",
                  fontSize: "0.8125rem",
                  textAlign: "center",
                }}
              >
                {errorMessage}
              </p>
            )}
          </form>
        )}

        <p
          style={{
            fontSize: "0.75rem",
            color: "var(--midnight)",
            opacity: 0.6,
            marginTop: "1rem",
          }}
        >
          No spam. Unsubscribe anytime.
        </p>
      </div>
    </section>
  )
}
