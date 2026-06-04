"use client";
import { useState } from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function AdminLeaderboardView({ entries, prizes, periodKey }: { entries: any[]; prizes: any[]; periodKey: string }) {
  const [awardingId, setAwardingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleAward(entryId: string) {
    setAwardingId(entryId);
    setMessage(null);
    const res = await fetch("/api/admin/leaderboard/award-prize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leaderboardEntryId: entryId, periodKey }),
    });
    const data = await res.json();
    if (res.ok) {
      setMessage({ type: "success", text: `Prize awarded to ${data.userName}!` });
    } else {
      setMessage({ type: "error", text: data.error || "Failed to award prize" });
    }
    setAwardingId(null);
  }

  const rankEmojis: Record<number, string> = { 1: "🏆", 2: "🥈", 3: "🥉" };

  return (
    <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', overflow: 'hidden' }}>
      {message && (
        <div style={{ padding: '0.75rem 1.25rem', background: message.type === "success" ? 'var(--teal-pale)' : '#FEF2F2', borderBottom: `1px solid ${message.type === "success" ? 'var(--teal)' : '#FECACA'}`, fontSize: '0.8125rem', color: message.type === "success" ? 'var(--teal)' : 'var(--danger)', fontWeight: 600 }}>
          {message.text}
        </div>
      )}

      <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        {prizes.map((p: any) => (
          <span key={p.id} style={{ fontSize: '0.8125rem', padding: '4px 10px', borderRadius: '20px', background: 'var(--off-white)', border: '1px solid var(--border)' }}>
            {rankEmojis[p.rank_position] || `${p.rank_position}th`} <strong>{p.prize_label}</strong>
          </span>
        ))}
      </div>

      {entries.length === 0 ? (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No entries this period.</p>
        </div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--off-white)' }}>
              <th style={{ textAlign: 'left', padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--midnight)' }}>Rank</th>
              <th style={{ textAlign: 'left', padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--midnight)' }}>User</th>
              <th style={{ textAlign: 'left', padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--midnight)' }}>Referrals</th>
              <th style={{ textAlign: 'left', padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--midnight)' }}>Prize</th>
              <th style={{ textAlign: 'right', padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--midnight)' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry: any) => {
              const prize = prizes.find((p: any) => p.rank_position === entry.rank);
              return (
                <tr key={entry.id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--midnight)' }}>
                    {rankEmojis[entry.rank] || `#${entry.rank}`}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <p style={{ fontWeight: 600, color: 'var(--midnight)' }}>{entry.users?.full_name || 'N/A'}</p>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{entry.users?.email}</p>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>{entry.referral_count}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    {prize ? (
                      <span style={{ fontWeight: 600, color: 'var(--teal)' }}>{prize.prize_label}</span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>—</span>
                    )}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                    <button
                      onClick={() => handleAward(entry.id)}
                      disabled={awardingId === entry.id || !prize}
                      style={{ padding: '0.375rem 0.75rem', background: (!prize || awardingId === entry.id) ? 'var(--gray-200)' : 'var(--teal)', color: (!prize || awardingId === entry.id) ? 'var(--text-muted)' : 'var(--midnight)', fontWeight: 600, fontSize: '0.75rem', borderRadius: 'var(--radius-sm)', border: 'none', cursor: (!prize || awardingId === entry.id) ? 'not-allowed' : 'pointer' }}
                    >
                      {awardingId === entry.id ? "Awarding..." : "Award prize"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
