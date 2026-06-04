"use client";
import { useState } from "react";

export default function FloatLedgerEntry({ currentAUM }: { currentAUM: number }) {
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split("T")[0]);
  const [lockedNGN, setLockedNGN] = useState(currentAUM.toString());
  const [tbillAllocation, setTbillAllocation] = useState("");
  const [tbillRate, setTbillRate] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);

  const projectedIncome = tbillAllocation && tbillRate
    ? (Number(tbillAllocation) * Number(tbillRate)) / 100
    : 0;

  async function handleSubmit() {
    setSubmitting(true);
    const res = await fetch("/api/admin/float/entry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entry_date: entryDate,
        total_locked_ngn: Number(lockedNGN),
        tbill_allocation: tbillAllocation ? Number(tbillAllocation) : null,
        tbill_rate_pa: tbillRate ? Number(tbillRate) : null,
        projected_annual_income: projectedIncome || null,
        notes,
      }),
    });
    if (res.ok) {
      setSaved(true);
      setTbillAllocation("");
      setTbillRate("");
      setNotes("");
      setTimeout(() => setSaved(false), 2500);
    }
    setSubmitting(false);
  }

  return (
    <div style={{ background: "white", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", padding: "1.5rem" }}>
      <h2 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1rem", fontWeight: 700, color: "var(--midnight)", marginBottom: "1rem" }}>
        Record Entry
      </h2>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <div>
          <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.25rem" }}>Entry date</label>
          <input type="date" value={entryDate} onChange={e => setEntryDate(e.target.value)} style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", fontSize: "0.8125rem" }} />
        </div>
        <div>
          <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.25rem" }}>Total locked AUM (₦)</label>
          <input type="number" value={lockedNGN} onChange={e => setLockedNGN(e.target.value)} style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", fontSize: "0.8125rem", fontFamily: "monospace" }} />
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.25rem" }}>T-bill allocation (₦)</label>
            <input type="number" value={tbillAllocation} onChange={e => setTbillAllocation(e.target.value)} style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", fontSize: "0.8125rem", fontFamily: "monospace" }} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.25rem" }}>T-bill rate p.a. (%)</label>
            <input type="number" step="0.01" value={tbillRate} onChange={e => setTbillRate(e.target.value)} style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", fontSize: "0.8125rem" }} />
          </div>
        </div>
        {projectedIncome > 0 && (
          <div style={{ padding: "0.5rem 0.75rem", borderRadius: "var(--radius-md)", background: "#F5F3FF", fontSize: "0.8125rem", color: "#6D28D9" }}>
            Projected annual income: <strong>₦{projectedIncome.toLocaleString()}</strong>
          </div>
        )}
        <div>
          <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.25rem" }}>Notes</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", fontSize: "0.8125rem", resize: "vertical" }} />
        </div>
        <button
          onClick={handleSubmit}
          disabled={submitting || !lockedNGN}
          style={{
            alignSelf: "flex-start",
            padding: "0.5rem 1.5rem",
            borderRadius: "var(--radius-md)",
            border: "none",
            background: saved ? "var(--teal)" : "var(--midnight)",
            color: "white",
            fontWeight: 600,
            fontSize: "0.8125rem",
            cursor: submitting || !lockedNGN ? "not-allowed" : "pointer",
            opacity: submitting || !lockedNGN ? 0.6 : 1,
          }}
        >
          {submitting ? "Saving…" : saved ? "Saved ✓" : "Record entry"}
        </button>
      </div>
    </div>
  );
}
