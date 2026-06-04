// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function MilestoneProgress({ goals }: { goals: any[] }) {
  if (goals.length === 0) {
    return (
      <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: '2rem', border: '1px solid var(--border)', marginBottom: '1rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          No active goals. Create a savings goal to track milestone progress.
        </p>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: '1rem' }}>
      <h2 style={{ fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', fontSize: '1rem', fontWeight: 700, color: 'var(--midnight)', marginBottom: '1rem' }}>
        Goal milestones
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem' }}>
        {goals.map((goal: any) => {
          const milestones = [
            { pct: 25, unlocked: goal.milestone_25_unlocked, reward: 'Unlock Gift to Friend' },
            { pct: 50, unlocked: goal.milestone_50_unlocked, reward: 'Priority processing' },
            { pct: 75, unlocked: goal.milestone_75_unlocked, reward: 'Free document review' },
            { pct: 100, unlocked: goal.milestone_100_unlocked, reward: 'Goal complete! 🎉' },
          ];
          const progress = goal.target_amount > 0
            ? Math.round((goal.current_balance / goal.target_amount) * 100)
            : 0;

          return (
            <div key={goal.id} style={{ background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', padding: '1.25rem' }}>
              <p style={{ fontWeight: 700, color: 'var(--midnight)', fontSize: '0.9375rem', marginBottom: '0.25rem' }}>{goal.goal_name}</p>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                {goal.currency} {Number(goal.current_balance).toLocaleString()} / {goal.currency} {Number(goal.target_amount).toLocaleString()}
              </p>

              <div style={{ height: '6px', background: 'var(--gray-100)', borderRadius: '3px', overflow: 'hidden', marginBottom: '1rem' }}>
                <div style={{ height: '100%', width: `${Math.min(progress, 100)}%`, background: 'var(--teal)', borderRadius: '3px', transition: 'width 0.5s ease' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                {milestones.map(m => (
                  <div key={m.pct} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.375rem 0.5rem', borderRadius: 'var(--radius-sm)', background: m.unlocked ? 'var(--teal-pale)' : 'transparent' }}>
                    <span style={{ fontSize: '0.75rem', color: m.unlocked ? 'var(--teal)' : 'var(--text-muted)', fontWeight: 700, width: 28 }}>
                      {m.unlocked ? '✓' : `${m.pct}%`}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: m.unlocked ? 'var(--text-secondary)' : 'var(--text-muted)' }}>
                      {m.reward}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
