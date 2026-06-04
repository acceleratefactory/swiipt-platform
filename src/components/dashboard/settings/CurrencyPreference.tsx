"use client";
import { useState } from "react";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function CurrencyPreference({ currentCurrency, currencies, userId: _userId }: { currentCurrency: string; currencies: any[]; userId: string }) {
  const [selected, setSelected] = useState(currentCurrency);

  async function handleChange(code: string) {
    setSelected(code);
    await fetch("/api/settings/update-currency", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currency: code }),
    });
  }

  return (
    <div style={{ background: "white", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", padding: "1.5rem", marginBottom: "1.25rem" }}>
      <h2 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1rem", fontWeight: 700, color: "var(--midnight)", marginBottom: "0.25rem" }}>
        Display currency
      </h2>
      <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
        Prices and balances are displayed in your preferred currency.
      </p>

      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {currencies.map((c: any) => (
          <button
            key={c.code}
            onClick={() => handleChange(c.code)}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "20px",
              border: selected === c.code ? "2px solid var(--teal)" : "1px solid var(--border)",
              background: selected === c.code ? "var(--teal-pale)" : "white",
              color: selected === c.code ? "var(--teal)" : "var(--text-secondary)",
              fontWeight: selected === c.code ? 600 : 400,
              fontSize: "0.8125rem",
              cursor: "pointer",
            }}
          >
            {c.code} {c.symbol}
          </button>
        ))}
      </div>

      <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "1rem" }}>
        Exchange rates are indicative. All transactions are processed in the currency of your goal.
      </p>
    </div>
  );
}
