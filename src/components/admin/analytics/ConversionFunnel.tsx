"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function ConversionFunnel({
  totalUsers,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  usersWithGoals: _usersWithGoals,
  usersWithDeposits,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  usersWithOrders: _usersWithOrders,
  completedOrders,
}: {
  totalUsers: number;
  usersWithGoals: number;
  usersWithDeposits: number;
  usersWithOrders: number;
  completedOrders: number;
}) {
  const steps = [
    { name: "Signups", count: totalUsers, pct: 100 },
    { name: "With deposits", count: usersWithDeposits, pct: totalUsers > 0 ? Math.round((usersWithDeposits / totalUsers) * 100) : 0 },
    { name: "Completed orders", count: completedOrders, pct: usersWithDeposits > 0 ? Math.round((completedOrders / usersWithDeposits) * 100) : 0 },
  ];

  return (
    <div style={{ background: "white", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", padding: "1.25rem", marginBottom: "1.5rem" }}>
      <h3 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "0.9375rem", fontWeight: 700, color: "var(--midnight)", marginBottom: "1rem" }}>
        Conversion funnel
      </h3>
      <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
        Where do users drop off? Each step shows count and % of previous step.
      </p>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={steps} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-100)" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: "var(--midnight)", fontWeight: 600 }} width={130} />
          <Tooltip formatter={(value: any, _: any, props: any) => [`${Number(value).toLocaleString()} (${steps[props.payload.payloadIndex]?.pct}%)`, props.payload.name]} />
          <Bar dataKey="count" fill="var(--teal)" radius={[0, 4, 4, 0]} label={{ position: "right", fontSize: 12, fontWeight: 700, fill: "var(--midnight)", formatter: (v: any) => Number(v).toLocaleString() }} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
