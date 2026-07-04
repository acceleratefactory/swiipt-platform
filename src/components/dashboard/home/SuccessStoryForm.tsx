"use client";
import { useState } from "react";
import { X } from "lucide-react";

interface SuccessStoryFormProps {
  firstName: string;
  serviceName: string;
  destinationPrefill?: string;
  onClose: () => void;
  onSubmit: () => void;
}

const journeyOptions = ["Under 3 months", "3–6 months", "6–12 months", "Over 12 months"];
const costOptions = ["₦500k–₦1M", "₦1M–₦3M", "₦3M–₦5M", "₦5M–₦10M", "₦10M+"];

export default function SuccessStoryForm({ firstName, serviceName, destinationPrefill, onClose, onSubmit }: SuccessStoryFormProps) {
  const [country, setCountry] = useState(destinationPrefill || "");
  const [journeyDuration, setJourneyDuration] = useState("");
  const [totalCostRange, setTotalCostRange] = useState("");
  const [hardestPart, setHardestPart] = useState("");
  const [advice, setAdvice] = useState("");
  const [isContactable, setIsContactable] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (!country || !journeyDuration || !totalCostRange || !advice) {
      setError("Please fill in all required fields.");
      return;
    }
    setSubmitting(true);
    setError("");

    const res = await fetch("/api/success-stories/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName,
        destinationCountry: country,
        serviceCompleted: serviceName,
        journeyDuration,
        approximateCostRange: totalCostRange,
        hardestPart: hardestPart || undefined,
        advice,
        openToContact: isContactable,
      }),
    });

    if (!res.ok) {
      const json = await res.json();
      setError(json.error || "Failed to submit");
      setSubmitting(false);
      return;
    }

    onSubmit();
  }

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex",
        alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "1rem",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--midnight)", borderRadius: "var(--radius-lg)", padding: "1.5rem",
          maxWidth: "480px", width: "100%", maxHeight: "90vh", overflowY: "auto", position: "relative",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} style={{ position: "absolute", top: "0.75rem", right: "0.75rem", background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer" }}>
          <X size={18} />
        </button>

        <p style={{ fontSize: "1.125rem", fontWeight: 700, color: "white", marginBottom: "0.25rem" }}>Share your story</p>
        <p style={{ fontSize: "0.8125rem", color: "var(--gray-500)", marginBottom: "1.25rem" }}>
          Inspire others by sharing your relocation journey. Your story may be featured on Swiipt!
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--gray-500)", marginBottom: "0.375rem", display: "block" }}>Country moved to *</label>
            <input
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="e.g. Canada, UK, UAE"
              style={{ width: "100%", padding: "0.625rem 0.75rem", borderRadius: "var(--radius-md)", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "white", fontSize: "0.875rem" }}
            />
          </div>

          <div>
            <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--gray-500)", marginBottom: "0.375rem", display: "block" }}>Journey duration *</label>
            <select
              value={journeyDuration}
              onChange={(e) => setJourneyDuration(e.target.value)}
              style={{ width: "100%", padding: "0.625rem 0.75rem", borderRadius: "var(--radius-md)", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "white", fontSize: "0.875rem" }}
            >
              <option value="">Select duration</option>
              {journeyOptions.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>

          <div>
            <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--gray-500)", marginBottom: "0.375rem", display: "block" }}>Total approximate cost *</label>
            <select
              value={totalCostRange}
              onChange={(e) => setTotalCostRange(e.target.value)}
              style={{ width: "100%", padding: "0.625rem 0.75rem", borderRadius: "var(--radius-md)", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "white", fontSize: "0.875rem" }}
            >
              <option value="">Select cost range</option>
              {costOptions.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>

          <div>
            <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--gray-500)", marginBottom: "0.375rem", display: "block" }}>Hardest part (optional, max 200 chars)</label>
            <textarea
              value={hardestPart}
              onChange={(e) => setHardestPart(e.target.value.slice(0, 200))}
              rows={2}
              placeholder="What was the most challenging part of your move?"
              style={{ width: "100%", padding: "0.625rem 0.75rem", borderRadius: "var(--radius-md)", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "white", fontSize: "0.875rem", resize: "vertical" }}
            />
            <p style={{ fontSize: "0.6875rem", color: "var(--gray-500)", textAlign: "right", marginTop: "0.25rem" }}>{hardestPart.length}/200</p>
          </div>

          <div>
            <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--gray-500)", marginBottom: "0.375rem", display: "block" }}>Advice for someone starting now * (max 300 chars)</label>
            <textarea
              value={advice}
              onChange={(e) => setAdvice(e.target.value.slice(0, 300))}
              rows={3}
              placeholder="What advice would you give to someone just starting their journey?"
              style={{ width: "100%", padding: "0.625rem 0.75rem", borderRadius: "var(--radius-md)", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "white", fontSize: "0.875rem", resize: "vertical" }}
            />
            <p style={{ fontSize: "0.6875rem", color: "var(--gray-500)", textAlign: "right", marginTop: "0.25rem" }}>{advice.length}/300</p>
          </div>

          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8125rem", color: "var(--gray-500)", cursor: "pointer" }}>
            <input type="checkbox" checked={isContactable} onChange={(e) => setIsContactable(e.target.checked)} style={{ accentColor: "var(--teal)" }} />
            Open to being contacted by other Swiipt users
          </label>

          {error && <p style={{ fontSize: "0.8125rem", color: "#EF4444" }}>{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              width: "100%", padding: "0.75rem", background: submitting ? "var(--gray-500)" : "var(--teal)", color: "var(--midnight)",
              border: "none", borderRadius: "var(--radius-md)", fontSize: "0.875rem", fontWeight: 700, cursor: submitting ? "not-allowed" : "pointer",
            }}
          >
            {submitting ? "Submitting..." : "Share my story"}
          </button>
        </div>
      </div>
    </div>
  );
}
