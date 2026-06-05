"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const CATEGORY_COLORS: Record<string, string> = {
  residency_permit: "#1a6b9e",
  second_citizenship: "#1abc9c",
  company_registration: "#2c3e50",
  work_visa: "#3498db",
  remote_work_visa: "#e67e22",
  holiday_package: "#e74c3c",
  flight_savings: "#00b4d8",
  general_travel: "#8e44ad",
  custom: "#7a8599",
};

const DEST_COLORS = ["#1a6b9e", "#c0392b", "#2c3e50", "#8B4513", "#e74c3c", "#1abc9c", "#e67e22", "#27ae60", "#2980b9", "#8e44ad", "#f39c12", "#16a085"];

export default function GoalDistributionChart({
  byCategory,
  byDestination,
}: {
  byCategory: Array<{ goal_category: string }>;
  byDestination: Array<{ destination: string }>;
}) {
  const categoryCounts = (byCategory || []).reduce<Record<string, number>>((acc, g) => {
    acc[g.goal_category] = (acc[g.goal_category] || 0) + 1;
    return acc;
  }, {});

  const categoryData = Object.entries(categoryCounts).map(([name, value], idx) => ({
    name: name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    value,
    color: CATEGORY_COLORS[name] || DEST_COLORS[idx % DEST_COLORS.length],
  }));

  const destCounts = (byDestination || []).reduce<Record<string, number>>((acc, g) => {
    acc[g.destination] = (acc[g.destination] || 0) + 1;
    return acc;
  }, {});

  const destData = Object.entries(destCounts).map(([name, value], idx) => ({
    name,
    value,
    color: DEST_COLORS[idx % DEST_COLORS.length],
  }));

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
      <div style={{ background: "white", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", padding: "1.25rem" }}>
        <h3 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "0.9375rem", fontWeight: 700, color: "var(--midnight)", marginBottom: "1rem" }}>
          Goals by category
        </h3>
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
              {categoryData.map((entry, idx) => (
                <Cell key={idx} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div style={{ background: "white", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", padding: "1.25rem" }}>
        <h3 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "0.9375rem", fontWeight: 700, color: "var(--midnight)", marginBottom: "1rem" }}>
          Goals by destination
        </h3>
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie data={destData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
              {destData.map((entry, idx) => (
                <Cell key={idx} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
