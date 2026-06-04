// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function ReferralStats({ totalReferrals, pendingCommissions, earnedCommissions, isAlumni, leaderboardEntry }: { totalReferrals: number; pendingCommissions: number; earnedCommissions: number; isAlumni: boolean; leaderboardEntry: any }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
      {[
        { label: "Total referred", value: totalReferrals, color: 'var(--midnight)' },
        { label: "Pending commissions", value: `₦${pendingCommissions.toLocaleString()}`, color: '#B45309' },
        { label: isAlumni ? "Withdrawable earnings" : "Service credits earned", value: `₦${earnedCommissions.toLocaleString()}`, color: 'var(--teal)' },
        { label: "Leaderboard rank", value: leaderboardEntry ? `#${leaderboardEntry.rank}` : "—", color: leaderboardEntry ? '#F59E0B' : 'var(--text-muted)' },
      ].map(stat => (
        <div key={stat.label} style={{ background: 'white', borderRadius: 'var(--radius-md)', padding: '1rem', border: '1px solid var(--border)' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.375rem' }}>{stat.label}</p>
          <p style={{ fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', fontSize: '1.375rem', fontWeight: 800, color: stat.color }}>
            {stat.value}
          </p>
        </div>
      ))}
    </div>
  );
}
