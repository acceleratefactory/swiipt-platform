"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function Leaderboard({ entries: initialEntries, prizes, userEntry, userId }: { entries: any[]; prizes: any[]; userEntry: any; userId: string }) {
  const [entries, setEntries] = useState(initialEntries);
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase
      .channel("leaderboard_live")
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "leaderboard_entries",
      }, () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase as any)
          .from("leaderboard_entries")
          .select("*, users(full_name)")
          .eq("period_key", entries[0]?.period_key || "")
          .order("rank")
          .limit(10)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .then(({ data }: any) => { if (data) setEntries(data); });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const rankEmojis: Record<number, string> = { 1: "🏆", 2: "🥈", 3: "🥉" };

  return (
    <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', overflow: 'hidden', marginBottom: '1rem' }}>
      <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', background: 'var(--midnight)' }}>
        <p style={{ fontSize: '0.75rem', color: 'var(--teal)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.25rem' }}>
          Monthly leaderboard
        </p>
        <h3 style={{ fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', fontSize: '1rem', fontWeight: 700, color: 'white' }}>
          Refer the most. Win the most. ● Live
        </h3>
        <p style={{ fontSize: '0.8125rem', color: 'var(--gray-300)', marginTop: '0.25rem' }}>
          Minimum 2 referrals to appear. Resets on the 1st of each month.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', padding: '0.875rem 1.25rem', background: 'var(--off-white)', borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}>
        {prizes.map((p: any) => (
          <span key={p.id} style={{ fontSize: '0.8125rem', color: 'var(--midnight)' }}>
            {rankEmojis[p.rank_position] || `${p.rank_position}th`} <strong>{p.prize_label}</strong>
          </span>
        ))}
      </div>

      {entries.length === 0 ? (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No entries yet this month. Be the first — refer 2 friends to appear.</p>
        </div>
      ) : (
        entries.map((entry: any, index: number) => {
          const isCurrentUser = entry.user_id === userId;
          const prize = prizes.find((p: any) => p.rank_position === entry.rank);
          return (
            <div key={entry.id || index} style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid var(--gray-100)', display: 'flex', alignItems: 'center', gap: '1rem', background: isCurrentUser ? 'var(--teal-pale)' : 'white' }}>
              <span style={{ fontSize: '1.25rem', width: 28, textAlign: 'center', flexShrink: 0 }}>
                {rankEmojis[entry.rank] || entry.rank}
              </span>
              <span style={{ flex: 1, fontWeight: isCurrentUser ? 700 : 400, color: 'var(--midnight)', fontSize: '0.9375rem' }}>
                {isCurrentUser ? "You" : entry.users?.full_name?.split(" ")[0] + " " + (entry.users?.full_name?.split(" ")[1]?.[0] || "") + "."}
              </span>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                {entry.referral_count} referral{entry.referral_count !== 1 ? "s" : ""}
              </span>
              {prize && (
                <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: '20px', background: 'var(--teal-pale)', color: 'var(--teal)', whiteSpace: 'nowrap' }}>
                  {prize.prize_label}
                </span>
              )}
            </div>
          );
        })
      )}

      {userEntry && !entries.find((e: any) => e.user_id === userId) && (
        <div style={{ padding: '0.875rem 1.25rem', background: 'var(--teal-pale)', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ width: 28, textAlign: 'center', fontWeight: 700, color: 'var(--teal)' }}>{userEntry.rank}</span>
          <span style={{ flex: 1, fontWeight: 700, color: 'var(--midnight)' }}>You</span>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{userEntry.referral_count} referrals</span>
        </div>
      )}

      {!userEntry && (
        <div style={{ padding: '0.875rem 1.25rem', background: 'var(--off-white)', borderTop: '1px solid var(--border)' }}>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            You are not on the leaderboard yet. Refer 2+ friends to qualify.{" "}
            <a href="/dashboard/refer" style={{ color: 'var(--teal)', fontWeight: 600 }}>Start referring →</a>
          </p>
        </div>
      )}
    </div>
  );
}
