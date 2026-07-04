"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import AdminLeaderboardView from "@/app/(admin)/admin/leaderboard/AdminLeaderboardView";
import PrizeConfigForm from "./PrizeConfigForm";

export default function LeaderboardAdmin({ entries, allTimeEntries, prizes, allTimePrizes, periodKey }: { entries: any[]; allTimeEntries: any[]; prizes: any[]; allTimePrizes: any[]; periodKey: string }) {
  const supabase = createClient();
  const [prizeMessage, setPrizeMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [monthlyPrizes, setMonthlyPrizes] = useState(prizes);
  const [allTimePrizesState, setAllTimePrizesState] = useState(allTimePrizes);
  const [resetting, setResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleSavePrize(prizeId: string, updates: { label: string; description: string; value_ngn: string }) {
    setPrizeMessage(null);
    try {
      const { error } = await (supabase as any)
        .from("leaderboard_prizes")
        .update({
          prize_label: updates.label,
          prize_description: updates.description,
          prize_value_ngn: updates.value_ngn ? Number(updates.value_ngn) : null,
        })
        .eq("id", prizeId);
      if (error) throw error;
      setPrizeMessage({ type: "success", text: "Prize updated!" });
      const updated = { prize_label: updates.label, prize_description: updates.description, prize_value_ngn: updates.value_ngn ? Number(updates.value_ngn) : null };
      setMonthlyPrizes(prev => prev.map(p => p.id === prizeId ? { ...p, ...updated } : p));
      setAllTimePrizesState(prev => prev.map(p => p.id === prizeId ? { ...p, ...updated } : p));
    } catch {
      setPrizeMessage({ type: "error", text: "Failed to update prize" });
    }
  }

  async function handleReset() {
    if (!confirm("Reset the monthly leaderboard? This will clear all entries for the current period.")) return;
    setResetting(true);
    setResetMessage(null);
    try {
      const res = await fetch("/api/admin/leaderboard/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ periodKey }),
      });
      if (res.ok) {
        setResetMessage({ type: "success", text: "Monthly leaderboard reset successfully" });
      } else {
        const data = await res.json();
        setResetMessage({ type: "error", text: data.error || "Reset failed" });
      }
    } catch {
      setResetMessage({ type: "error", text: "Network error" });
    }
    setResetting(false);
  }

  return (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', fontSize: '1rem', fontWeight: 700, color: 'var(--midnight)' }}>
            Current Standings
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {resetMessage && (
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: resetMessage.type === "success" ? 'var(--teal)' : 'var(--danger)' }}>
                {resetMessage.text}
              </span>
            )}
            <button
              onClick={handleReset}
              disabled={resetting}
              style={{ padding: '0.375rem 0.75rem', background: resetting ? 'var(--gray-200)' : '#FEF2F2', color: resetting ? 'var(--text-muted)' : 'var(--danger)', fontWeight: 600, fontSize: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid', borderColor: resetting ? 'var(--border)' : '#FECACA', cursor: resetting ? 'not-allowed' : 'pointer' }}
            >
              {resetting ? "Resetting..." : "Reset monthly"}
            </button>
          </div>
        </div>
        <AdminLeaderboardView entries={entries} prizes={monthlyPrizes} periodKey={periodKey} />
      </div>

      {allTimeEntries.length > 0 && (
        <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', overflow: 'hidden' }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
            <h2 style={{ fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', fontSize: '1rem', fontWeight: 700, color: 'var(--midnight)' }}>
              All-Time Standings
            </h2>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--off-white)' }}>
                <th style={{ textAlign: 'left', padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--midnight)' }}>#</th>
                <th style={{ textAlign: 'left', padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--midnight)' }}>User</th>
                <th style={{ textAlign: 'left', padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--midnight)' }}>Total Referrals</th>
                <th style={{ textAlign: 'left', padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--midnight)' }}>Total Earned</th>
              </tr>
            </thead>
            <tbody>
              {allTimeEntries.map((entry: any, i: number) => {
                const rankEmoji = i === 0 ? "🏆" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`;
                return (
                  <tr key={entry.user_id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--midnight)' }}>{rankEmoji}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <p style={{ fontWeight: 600, color: 'var(--midnight)' }}>{entry.users?.full_name || "N/A"}</p>
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{entry.users?.email}</p>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--midnight)', fontWeight: 600 }}>{entry.total_referrals || 0}</td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--teal)', fontWeight: 700 }}>₦{(entry.total_earned_ngn || 0).toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', fontSize: '1rem', fontWeight: 700, color: 'var(--midnight)' }}>
            Prize Configuration
          </h2>
          {prizeMessage && (
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: prizeMessage.type === "success" ? 'var(--teal)' : 'var(--danger)' }}>
              {prizeMessage.text}
            </span>
          )}
        </div>
        <div style={{ padding: '0 1.25rem' }}>
          <div style={{ padding: '1rem 0', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', fontSize: '0.875rem', fontWeight: 700, color: 'var(--midnight)', marginBottom: '0.5rem' }}>
              Monthly prizes
            </h3>
            <PrizeConfigForm prizes={monthlyPrizes} onSave={handleSavePrize} />
          </div>
          <div style={{ padding: '0.5rem 0' }}>
            <h3 style={{ fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', fontSize: '0.875rem', fontWeight: 700, color: 'var(--midnight)', marginBottom: '0.5rem' }}>
              All-time prizes
            </h3>
            <PrizeConfigForm prizes={allTimePrizesState} onSave={handleSavePrize} />
          </div>
        </div>
      </div>
    </div>
  );
}
/* eslint-enable @typescript-eslint/no-explicit-any */
