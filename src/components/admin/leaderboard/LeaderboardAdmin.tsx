"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import AdminLeaderboardView from "@/app/(admin)/admin/leaderboard/AdminLeaderboardView";
import PrizeConfigForm from "./PrizeConfigForm";

export default function LeaderboardAdmin({ entries, prizes, allTimePrizes, periodKey }: { entries: any[]; prizes: any[]; allTimePrizes: any[]; periodKey: string }) {
  const supabase = createClient();
  const [prizeMessage, setPrizeMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [monthlyPrizes, setMonthlyPrizes] = useState(prizes);
  const [allTimePrizesState, setAllTimePrizesState] = useState(allTimePrizes);

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

  return (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', fontSize: '1rem', fontWeight: 700, color: 'var(--midnight)' }}>
            Current Standings
          </h2>
        </div>
        <AdminLeaderboardView entries={entries} prizes={monthlyPrizes} periodKey={periodKey} />
      </div>

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
