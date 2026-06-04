"use client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function AUMChart({ entries }: { entries: any[] }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chartData = entries
    .slice()
    .reverse()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((e: any) => ({
      date: new Date(e.entry_date).toLocaleDateString("en-NG", { day: "numeric", month: "short" }),
      aum: e.total_locked_ngn / 1000000,
      projected_income: e.projected_annual_income ? e.projected_annual_income / 1000 : 0,
    }));

  if (chartData.length < 2) {
    return (
      <div style={{ background: "white", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", padding: "1.5rem", display: "flex", alignItems: "center", justifyContent: "center", minHeight: 200 }}>
        <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>Need at least 2 entries to show the chart.</p>
      </div>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tooltipFormatter: any = (value: number, name: string) => [
    `₦${Number(value).toFixed(2)}${name === "aum" ? "M" : "K"}`,
    name === "aum" ? "AUM" : "Projected Income",
  ];

  return (
    <div style={{ background: "white", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", padding: "1.5rem" }}>
      <h2 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1rem", fontWeight: 700, color: "var(--midnight)", marginBottom: "1rem" }}>
        AUM & Income Trend
      </h2>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#EEF1F6" />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#7A8599" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: "#7A8599" }} axisLine={false} tickLine={false} tickFormatter={v => `₦${v}M`} />
          <Tooltip
            contentStyle={{ borderRadius: "8px", border: "1px solid var(--border)", fontSize: "0.75rem" }}
            formatter={tooltipFormatter}
          />
          <Line type="monotone" dataKey="aum" stroke="#00C896" strokeWidth={2} dot={{ r: 3, fill: "#00C896" }} name="AUM" />
          <Line type="monotone" dataKey="projected_income" stroke="#F59E0B" strokeWidth={2} dot={{ r: 3, fill: "#F59E0B" }} name="Projected Income" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
