"use client";
import { useState } from "react";

const PRESET_AMOUNTS_NGN = [10000, 25000, 50000];
const CURRENCIES = [
  { code: "NGN", label: "NGN (₦)", symbol: "₦" },
  { code: "GBP", label: "GBP (£)", symbol: "£" },
  { code: "USD", label: "USD ($)", symbol: "$" },
  { code: "EUR", label: "EUR (€)", symbol: "€" },
  { code: "CAD", label: "CAD (C$)", symbol: "C$" },
];

export default function DiasporaGiftForm({ goalId, goalUserId }: { goalId: string; goalUserId: string }) {
  const [amount, setAmount] = useState(25000);
  const [customAmount, setCustomAmount] = useState("");
  const [currency, setCurrency] = useState("GBP");
  const [giverName, setGiverName] = useState("");
  const [giverEmail, setGiverEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const finalAmount = amount === 0 ? parseInt(customAmount) : amount;
    if (!finalAmount || finalAmount < 100) { setError("Minimum gift amount is ₦100"); return; }
    if (!giverName.trim()) { setError("Please enter your name"); return; }
    setError("");
    setSending(true);
    try {
      const res = await fetch("/api/diaspora-gifts/create-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goalId,
          goalUserId,
          amount: finalAmount,
          foreignCurrency: currency,
          giverName: giverName.trim(),
          giverEmail: giverEmail.trim() || undefined,
          message: message.trim().slice(0, 200) || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        setError(data.error || "Failed to create gift session");
      }
    } catch {
      setError("Network error. Please try again.");
    }
    setSending(false);
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div style={{ padding: "0.5rem 0.75rem", background: "#FEE2E2", color: "#DC2626", borderRadius: "var(--radius-sm)", fontSize: "0.75rem", fontWeight: 600, marginBottom: "1rem" }}>
          {error}
        </div>
      )}

      {/* Gift amount */}
      <div style={{ marginBottom: "1rem" }}>
        <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#374151", display: "block", marginBottom: "0.375rem" }}>Gift Amount</label>
        <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap" }}>
          {PRESET_AMOUNTS_NGN.map((val) => (
            <button key={val} type="button" onClick={() => { setAmount(val); setCustomAmount(""); }}
              style={{ flex: 1, padding: "0.5rem 0.25rem", fontSize: "0.8125rem", fontWeight: 600, border: amount === val ? "2px solid var(--teal)" : "1px solid var(--border)", borderRadius: "var(--radius-sm)", background: amount === val ? "#E6FFF5" : "white", color: "var(--midnight)", cursor: "pointer", minWidth: "60px" }}>
              ₦{val >= 1000 ? `${val / 1000}K` : val}
            </button>
          ))}
          <button key="custom" type="button" onClick={() => setAmount(0)}
            style={{ flex: 1, padding: "0.5rem 0.25rem", fontSize: "0.8125rem", fontWeight: 600, border: amount === 0 ? "2px solid var(--teal)" : "1px solid var(--border)", borderRadius: "var(--radius-sm)", background: amount === 0 ? "#E6FFF5" : "white", color: "var(--midnight)", cursor: "pointer", minWidth: "60px" }}>
            Custom
          </button>
        </div>
        {amount === 0 && (
          <input type="number" min={100} value={customAmount} onChange={(e) => setCustomAmount(e.target.value)} placeholder="Enter amount in ₦"
            style={{ width: "100%", marginTop: "0.375rem", padding: "0.5rem 0.625rem", fontSize: "0.8125rem", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", outline: "none", boxSizing: "border-box" }} />
        )}
      </div>

      {/* Currency */}
      <div style={{ marginBottom: "1rem" }}>
        <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#374151", display: "block", marginBottom: "0.375rem" }}>You pay in</label>
        <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap" }}>
          {CURRENCIES.map((c) => (
            <button key={c.code} type="button" onClick={() => setCurrency(c.code)}
              style={{ padding: "0.375rem 0.625rem", fontSize: "0.75rem", fontWeight: 600, border: currency === c.code ? "2px solid var(--teal)" : "1px solid var(--border)", borderRadius: "var(--radius-sm)", background: currency === c.code ? "#E6FFF5" : "white", color: "var(--midnight)", cursor: "pointer" }}>
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Giver name */}
      <div style={{ marginBottom: "0.75rem" }}>
        <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#374151", display: "block", marginBottom: "0.25rem" }}>Your name *</label>
        <input type="text" value={giverName} onChange={(e) => setGiverName(e.target.value)} placeholder="e.g. John Doe" required
          style={{ width: "100%", padding: "0.5rem 0.625rem", fontSize: "0.8125rem", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", outline: "none", boxSizing: "border-box" }} />
      </div>

      {/* Giver email */}
      <div style={{ marginBottom: "0.75rem" }}>
        <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#374151", display: "block", marginBottom: "0.25rem" }}>Email (optional — for receipt)</label>
        <input type="email" value={giverEmail} onChange={(e) => setGiverEmail(e.target.value)} placeholder="e.g. jane@example.com"
          style={{ width: "100%", padding: "0.5rem 0.625rem", fontSize: "0.8125rem", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", outline: "none", boxSizing: "border-box" }} />
      </div>

      {/* Gift message */}
      <div style={{ marginBottom: "1.25rem" }}>
        <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#374151", display: "block", marginBottom: "0.25rem" }}>
          Gift message <span style={{ fontWeight: 400, color: "#9CA3AF" }}>({message.length}/200)</span>
        </label>
        <textarea value={message} onChange={(e) => setMessage(e.target.value.slice(0, 200))} placeholder="Say something nice..." rows={2}
          style={{ width: "100%", padding: "0.5rem 0.625rem", fontSize: "0.8125rem", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", outline: "none", resize: "vertical", fontFamily: "inherit", boxSizing: "border-box" }} />
      </div>

      {/* Submit */}
      <button type="submit" disabled={sending}
        style={{ width: "100%", padding: "0.75rem", background: sending ? "#9CA3AF" : "var(--teal)", color: "var(--midnight)", fontWeight: 700, fontSize: "0.875rem", border: "none", borderRadius: "var(--radius-md)", cursor: sending ? "not-allowed" : "pointer" }}>
        {sending ? "Redirecting to payment..." : `Send gift — ${currency === "NGN" ? "₦" : CURRENCIES.find(c => c.code === currency)?.symbol || "£"}${(amount === 0 ? (parseInt(customAmount) || 0) : amount).toLocaleString()}`}
      </button>
    </form>
  );
}
