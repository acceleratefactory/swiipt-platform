"use client";
import { useState } from "react";
import RateEditRow from "./RateEditRow";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function CurrencyRatesTable({ currencies, adminId: _adminId }: { currencies: any[]; adminId: string }) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [editing, setEditing] = useState<Record<string, string>>({});
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [saving, setSaving] = useState<string | null>(null);

  return (
    <div style={{ background: "white", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", overflow: "hidden" }}>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8125rem" }}>
          <thead>
            <tr style={{ background: "var(--gray-100)" }}>
              {["Currency", "Code", "Symbol", "NGN Rate", "Last updated", "Active", "Actions"].map(h => (
                <th key={h} style={{ padding: "0.625rem 1rem", textAlign: "left", fontWeight: 600, color: "var(--text-secondary)", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {currencies.map((c: any) => (
              <RateEditRow key={c.id} currency={c} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
