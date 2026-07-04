"use client";

const typeIcons: Record<string, string> = {
  article: "📖",
  video: "🎬",
  template: "📝",
};

export default function UniversityModuleCard({
  module,
  progress,
}: {
  module: any;
  progress?: { status: string; completed_at: string | null };
}) {
  const isCompleted = progress?.status === "completed";
  const isLocked = !module.is_free;

  return (
    <a
      href={isLocked ? "#" : `/dashboard/affiliate/university/${module.id}`}
      style={{
        display: 'block',
        background: isCompleted ? 'var(--teal-pale)' : 'white',
        borderRadius: 'var(--radius-lg)',
        border: `1px solid ${isCompleted ? 'var(--teal)' : 'var(--border)'}`,
        padding: '1.25rem',
        textDecoration: 'none',
        opacity: isLocked ? 0.5 : 1,
        cursor: isLocked ? 'not-allowed' : 'pointer',
        transition: 'box-shadow 0.2s',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.25rem' }}>{typeIcons[module.content_type] || "📄"}</span>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', background: 'var(--gray-100)', padding: '2px 8px', borderRadius: '4px' }}>
            {module.content_type}
          </span>
        </div>
        {isCompleted ? (
          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--teal)' }}>✓ Completed</span>
        ) : isLocked ? (
          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#D97706' }}>🔒 Silver+</span>
        ) : (
          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--teal)' }}>{module.duration_minutes} min</span>
        )}
      </div>

      <h3 style={{ fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', fontSize: '0.9375rem', fontWeight: 700, color: 'var(--midnight)', marginBottom: '0.375rem' }}>
        {module.title}
      </h3>
      <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '0.75rem' }}>
        {module.subtitle}
      </p>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Module {module.order_in_course}
        </span>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: isCompleted ? 'var(--teal)' : 'var(--text-muted)' }}>
          +{module.points_on_completion} pts
        </span>
      </div>
    </a>
  );
}
