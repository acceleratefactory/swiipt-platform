"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ModuleDetailView({
  module,
  progress,
  isCompleted,
}: {
  module: any;
  progress: any;
  isCompleted: boolean;
}) {
  const router = useRouter();
  const [completing, setCompleting] = useState(false);
  const [completed, setCompleted] = useState(isCompleted);

  async function handleComplete() {
    setCompleting(true);
    try {
      const res = await fetch("/api/affiliate/complete-module", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moduleId: module.id }),
      });
      if (res.ok) {
        setCompleted(true);
        router.refresh();
      }
    } finally {
      setCompleting(false);
    }
  }

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto' }}>
      <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', background: 'var(--gray-100)', padding: '2px 8px', borderRadius: '4px' }}>
            Module {module.order_in_course} · {module.content_type} · {module.duration_minutes} min
          </span>
          {completed && (
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--teal)', background: 'var(--teal-pale)', padding: '2px 10px', borderRadius: '20px' }}>
              ✓ Completed
            </span>
          )}
        </div>

        <h1 style={{ fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', fontSize: '1.375rem', fontWeight: 800, color: 'var(--midnight)', marginBottom: '0.5rem' }}>
          {module.title}
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          {module.subtitle}
        </p>

        <div style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: '1.5rem' }}>
          {module.content_body.split("\n").map((line: string, i: number) => {
            if (line.startsWith("## ")) return <h2 key={i} style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--midnight)', marginTop: '1.5rem', marginBottom: '0.5rem' }}>{line.replace("## ", "")}</h2>;
            if (line.startsWith("**")) return <p key={i} style={{ fontWeight: 600, color: 'var(--midnight)', marginTop: '1rem', marginBottom: '0.25rem' }}>{line.replace(/\*\*/g, "")}</p>;
            if (line.trim()) return <p key={i} style={{ marginBottom: '0.75rem' }}>{line}</p>;
            return null;
          })}
        </div>

        {!completed && (
          <button
            onClick={handleComplete}
            disabled={completing}
            style={{ padding: '0.75rem 2rem', background: completing ? 'var(--text-muted)' : 'var(--teal)', color: 'white', fontWeight: 700, fontSize: '0.875rem', borderRadius: 'var(--radius-md)', border: 'none', cursor: completing ? 'not-allowed' : 'pointer' }}
          >
            {completing ? "Completing..." : `Mark as Complete (+${module.points_on_completion} pts)`}
          </button>
        )}
      </div>
    </div>
  );
}
