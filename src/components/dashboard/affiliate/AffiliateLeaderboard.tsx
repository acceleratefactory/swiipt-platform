"use client";

const tierColors: Record<string, string> = {
  starter: "#6B7280",
  bronze: "#D97706",
  silver: "#6B7280",
  gold: "#D97706",
  platinum: "#6B7280",
};

export default function AffiliateLeaderboard({ leaders, userRank }: { leaders: any[]; userRank: any }) {
  return (
    <div>
      {/* Top 10 */}
      <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', overflow: 'hidden', marginBottom: '1.5rem' }}>
        <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', fontSize: '0.9375rem', fontWeight: 700, color: 'var(--midnight)' }}>
            Top Affiliates
          </h3>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--off-white)' }}>
              <th style={{ textAlign: 'center', padding: '0.75rem 0.5rem', fontWeight: 700, color: 'var(--midnight)', width: '50px' }}>#</th>
              <th style={{ textAlign: 'left', padding: '0.75rem 0.5rem', fontWeight: 700, color: 'var(--midnight)' }}>Affiliate</th>
              <th style={{ textAlign: 'center', padding: '0.75rem 0.5rem', fontWeight: 700, color: 'var(--midnight)' }}>Tier</th>
              <th style={{ textAlign: 'right', padding: '0.75rem 0.5rem', fontWeight: 700, color: 'var(--midnight)' }}>Earnings</th>
              <th style={{ textAlign: 'right', padding: '0.75rem 0.5rem', fontWeight: 700, color: 'var(--midnight)' }}>Referrals</th>
            </tr>
          </thead>
          <tbody>
            {leaders.map((l: any, i: number) => (
              <tr key={l.id} style={{ borderBottom: '1px solid var(--gray-100)', background: l.isCurrentUser ? 'var(--teal-pale)' : 'transparent' }}>
                <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center', fontWeight: 700, color: i < 3 ? '#D97706' : 'var(--text-muted)' }}>
                  {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                </td>
                <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600, color: 'var(--midnight)' }}>
                  {l.full_name || l.email || l.user_id.slice(0, 8)}
                  {l.isCurrentUser && <span style={{ fontSize: '0.7rem', color: 'var(--teal)', marginLeft: '0.375rem' }}>(you)</span>}
                </td>
                <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: '20px', background: `${tierColors[l.tier] || '#6B7280'}18`, color: tierColors[l.tier] || '#6B7280' }}>
                    {l.tier || "starter"}
                  </span>
                </td>
                <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', fontWeight: 700, color: 'var(--teal)' }}>
                  ₦{(l.total_earned_ngn || 0).toLocaleString()}
                </td>
                <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', color: 'var(--text-muted)' }}>
                  {l.total_referrals || 0}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {leaders.length === 0 && (
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>No affiliates yet. Be the first!</p>
          </div>
        )}
      </div>

      {/* User's rank */}
      {userRank && !leaders.some((l: any) => l.isCurrentUser) && (
        <div style={{ background: 'var(--teal-pale)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--teal)', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Your Rank</p>
            <p style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--midnight)' }}>#{userRank.monthly_rank || "—"}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Your Earnings</p>
            <p style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--teal)' }}>₦{(userRank.total_earned_ngn || 0).toLocaleString()}</p>
          </div>
        </div>
      )}
    </div>
  );
}
