"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useRouter } from "next/navigation";

function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(date).toLocaleDateString("en-NG", { month: "short", day: "numeric" });
}

export default function GroupDiscussion({ group, threads, userId: _userId }: { group: any; threads: any[]; userId: string }) {
  const router = useRouter();
  const [showNewThread, setShowNewThread] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [posting, setPosting] = useState(false);

  async function handleCreateThread() {
    if (!title.trim() || !body.trim()) return;
    setPosting(true);
    try {
      const res = await fetch("/api/community/thread", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId: group.id, title: title.trim(), body: body.trim() }),
      });
      if (res.ok) {
        setShowNewThread(false);
        setTitle("");
        setBody("");
        router.refresh();
      }
    } finally {
      setPosting(false);
    }
  }

  return (
    <div>
      <a href="/dashboard/community" style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '1.5rem' }}>
        ← All groups
      </a>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', fontSize: '1.5rem', fontWeight: 800, color: 'var(--midnight)', marginBottom: '0.25rem' }}>
            {group.name}
          </h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            {group.member_count} members · {group.destination || group.group_type}
          </p>
        </div>
        <button
          onClick={() => setShowNewThread(true)}
          style={{ padding: '0.625rem 1.25rem', background: 'var(--teal)', color: 'var(--midnight)', fontWeight: 700, fontSize: '0.875rem', borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer' }}
        >
          + New thread
        </button>
      </div>

      {showNewThread && (
        <div style={{ background: 'var(--off-white)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', marginBottom: '1.5rem' }}>
          <input
            placeholder="Thread title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            style={{ width: '100%', padding: '0.625rem 0.875rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', marginBottom: '0.75rem', background: 'white' }}
          />
          <textarea
            placeholder="What's on your mind?"
            value={body}
            onChange={e => setBody(e.target.value)}
            rows={4}
            style={{ width: '100%', padding: '0.625rem 0.875rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', marginBottom: '0.75rem', background: 'white', resize: 'vertical', fontFamily: 'inherit' }}
          />
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={handleCreateThread}
              disabled={posting || !title.trim() || !body.trim()}
              style={{ padding: '0.5rem 1rem', background: 'var(--teal)', color: 'var(--midnight)', fontWeight: 700, fontSize: '0.8125rem', borderRadius: 'var(--radius-sm)', border: 'none', cursor: posting ? 'not-allowed' : 'pointer', opacity: posting || !title.trim() || !body.trim() ? 0.6 : 1 }}
            >
              {posting ? "Posting..." : "Post thread"}
            </button>
            <button
              onClick={() => { setShowNewThread(false); setTitle(""); setBody(""); }}
              style={{ padding: '0.5rem 1rem', background: 'white', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.8125rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', cursor: 'pointer' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gap: '0.75rem' }}>
        {threads.map(thread => (
          <a
            key={thread.id}
            href={`/dashboard/community/${group.slug}/${thread.id}`}
            style={{ background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', padding: '1.25rem', textDecoration: 'none', display: 'block', transition: 'box-shadow 0.15s' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-sm)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = 'none'}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
              <h3 style={{ fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', fontSize: '0.9375rem', fontWeight: 700, color: 'var(--midnight)' }}>
                {thread.is_pinned && "📌 "}{thread.title}
              </h3>
            </div>
            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <span>By {thread.author?.full_name || "Unknown"}</span>
              <span>{thread.reply_count} {thread.reply_count === 1 ? 'reply' : 'replies'}</span>
              <span>{timeAgo(thread.created_at)}</span>
            </div>
          </a>
        ))}

        {threads.length === 0 && (
          <div style={{ padding: '2rem', textAlign: 'center', background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem' }}>No threads yet. Be the first to start a conversation!</p>
          </div>
        )}
      </div>
    </div>
  );
}
/* eslint-enable @typescript-eslint/no-explicit-any */
