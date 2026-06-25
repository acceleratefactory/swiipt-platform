"use client";

import { useState, useEffect } from "react";

export default function CountdownTimer({ expiresAt }: { expiresAt: string }) {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    function calculate() {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) return { hours: 0, minutes: 0, seconds: 0 };
      return {
        hours: Math.floor(diff / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      };
    }
    setTimeLeft(calculate());
    const interval = setInterval(() => setTimeLeft(calculate()), 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const isUrgent = timeLeft.hours < 6;

  return (
    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
      {[
        { value: timeLeft.hours, label: "h" },
        { value: timeLeft.minutes, label: "m" },
        { value: timeLeft.seconds, label: "s" },
      ].map(({ value, label }) => (
        <div key={label} style={{ textAlign: "center" }}>
          <div style={{
            fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif",
            fontSize: "1.25rem",
            fontWeight: 800,
            color: isUrgent ? "#EF4444" : "var(--midnight)",
            minWidth: "2ch",
          }}>
            {String(value).padStart(2, "0")}
          </div>
          <div style={{ fontSize: "0.625rem", color: "var(--text-muted)", textTransform: "uppercase" }}>{label}</div>
        </div>
      ))}
    </div>
  );
}
