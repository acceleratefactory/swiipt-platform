"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function CommunityHub({ groups, memberGroupIds, userId, mobilityScore: _mobilityScore }: { groups: any[]; memberGroupIds: Set<string>; userId: string; mobilityScore: number }) {
  const [joining, setJoining] = useState<string | null>(null);
  const supabase = createClient();

  async function joinGroup(groupId: string) {
    setJoining(groupId);
    await (supabase as any).from("community_memberships").insert({ user_id: userId, group_id: groupId });
    window.location.reload();
    setJoining(null);
  }

  return (
    <div>
      <h1 style={{ fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', fontSize: '1.5rem', fontWeight: 800, color: 'var(--midnight)', marginBottom: '0.5rem' }}>
        Community
      </h1>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
        Connect with others on the same journey. Share tips, ask questions, and learn from people who have been through it.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
        {groups.map(group => {
          const isMember = memberGroupIds.has(group.id);
          return (
            <div key={group.id} style={{ background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.625rem' }}>
                <h3 style={{ fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', fontSize: '1rem', fontWeight: 700, color: 'var(--midnight)' }}>
                  {group.name}
                </h3>
                {group.group_type === "alumni" && (
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: '20px', background: 'var(--teal-pale)', color: 'var(--teal)' }}>
                    Alumni
                  </span>
                )}
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '1rem' }}>
                {group.description}
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {group.member_count} members
                </span>
                {isMember ? (
                  <a href={`/dashboard/community/${group.slug}`} style={{ padding: '0.5rem 1rem', background: 'var(--teal)', color: 'var(--midnight)', fontWeight: 700, fontSize: '0.8125rem', borderRadius: 'var(--radius-sm)', textDecoration: 'none' }}>
                    Open →
                  </a>
                ) : (
                  <button
                    onClick={() => joinGroup(group.id)}
                    disabled={joining === group.id}
                    style={{ padding: '0.5rem 1rem', background: 'var(--off-white)', color: 'var(--midnight)', fontWeight: 600, fontSize: '0.8125rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', cursor: 'pointer' }}
                  >
                    {joining === group.id ? "Joining..." : "Join"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
/* eslint-enable @typescript-eslint/no-explicit-any */
