"use client";

// Client-side signal tracker (Fix 1 item 6).
// Centralises behavioural-signal firing AND triggers a per-session
// recompute of the interest model after N signals, so the feed shifts
// within the session (not just on the 6h cron).

let sessionSignalCount = 0;
const RECOMPUTE_THRESHOLD = 5;

export async function trackSignal(opportunityId: string, signalType: string) {
  // Fire the raw behaviour signal (fire-and-forget — must not block UI).
  fetch("/api/opportunities/signal", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ opportunityId, signalType }),
  }).catch(() => {});

  sessionSignalCount += 1;
  if (sessionSignalCount >= RECOMPUTE_THRESHOLD) {
    sessionSignalCount = 0;
    // Recompute the interest model for this session. Authenticated endpoint
    // (compute-interest itself requires the internal secret, so it is called
    // server-to-server inside the wrapper).
    fetch("/api/opportunities/recompute-interest", { method: "POST" }).catch(() => {});
  }
}
