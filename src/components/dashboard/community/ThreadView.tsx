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

export default function ThreadView({ thread, replies, groupSlug, userId: _userId }: { thread: any; replies: any[]; groupSlug: string; userId: string }) {
  const router = useRouter();
  const [replyBody, setReplyBody] = useState("");
  const [posting, setPosting] = useState(false);

  async function handleReply() {
    if (!replyBody.trim()) return;
    setPosting(true);
    try {
      const res = await fetch("/api/community/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadId: thread.id, body: replyBody.trim() }),
      });
      if (res.ok) {
        setReplyBody("");
        router.refresh();
      }
    } finally {
      setPosting(false);
    }
  }

  return (
    <div>
      <a href={`/dashboard/community/${groupSlug}`} style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '1.5rem' }}>
        ← Back to discussions
      </a>

      <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', padding: '1.5rem', marginBottom: '1rem' }}>
        <h1 style={{ fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', fontSize: '1.25rem', fontWeight: 800, color: 'var(--midnight)', marginBottom: '0.5rem' }}>
          {thread.is_pinned && "📌 "}{thread.title}
        </h1>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          By {thread.author?.full_name || "Unknown"} · {timeAgo(thread.created_at)}
        </p>
        <div style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
          {thread.body}
        </div>
      </div>

      <h3 style={{ fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', fontSize: '0.9375rem', fontWeight: 700, color: 'var(--midnight)', marginBottom: '0.75rem' }}>
        {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
      </h3>

      <div style={{ display: 'grid', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {replies.map(reply => (
          <div key={reply.id} style={{ background: 'var(--off-white)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
              {reply.author?.full_name || "Unknown"} · {timeAgo(reply.created_at)}
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
              {reply.body}
            </div>
          </div>
        ))}

        {replies.length === 0 && (
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>
            No replies yet. Be the first to respond.
          </p>
        )}
      </div>

      <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', padding: '1.25rem' }}>
        <textarea
          placeholder="Write a reply..."
          value={replyBody}
          onChange={e => setReplyBody(e.target.value)}
          rows={3}
          style={{ width: '100%', padding: '0.625rem 0.875rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', marginBottom: '0.75rem', background: 'var(--off-white)', resize: 'vertical', fontFamily: 'inherit' }}
        />
        <button
          onClick={handleReply}
          disabled={posting || !replyBody.trim()}
          style={{ padding: '0.5rem 1.25rem', background: 'var(--midnight)', color: 'white', fontWeight: 700, fontSize: '0.8125rem', borderRadius: 'var(--radius-sm)', border: 'none', cursor: posting ? 'not-allowed' : 'pointer', opacity: posting || !replyBody.trim() ? 0.6 : 1 }}
        >
          {posting ? "Posting..." : "Post reply"}
        </button>
      </div>
    </div>
  );
}
/* eslint-enable @typescript-eslint/no-explicit-any */
