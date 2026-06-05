"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const sampleData = [
  { month: "Jan", aum: 12000000 },
  { month: "Feb", aum: 18500000 },
  { month: "Mar", aum: 22300000 },
  { month: "Apr", aum: 28100000 },
  { month: "May", aum: 34500000 },
  { month: "Jun", aum: 41200000 },
];

const formatNGN = (value: number) => `₦${(value / 1000000).toFixed(1)}M`;

export default function AUMGrowthChart() {
  return (
    <div style={{ background: "white", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", padding: "1.25rem" }}>
      <h3 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "0.9375rem", fontWeight: 700, color: "var(--midnight)", marginBottom: "1rem" }}>
        AUM growth
      </h3>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={sampleData}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-100)" />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
          <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)" }} tickFormatter={formatNGN} />
          <Tooltip formatter={(value) => [`₦${Number(value).toLocaleString()}`, "AUM"]} />
          <Line type="monotone" dataKey="aum" stroke="var(--teal)" strokeWidth={2} dot={{ fill: "var(--teal)", r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
