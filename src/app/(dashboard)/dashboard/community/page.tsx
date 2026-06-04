import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
/* eslint-disable @typescript-eslint/no-explicit-any */
import CommunityHub from "@/components/dashboard/community/CommunityHub";

export default async function CommunityPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("mobility_score, alumni_status")
    .eq("id", user.id)
    .single();

  const mobilityScore = profile?.mobility_score || 0;

  if (mobilityScore < 200) {
    return (
      <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: '3rem', border: '1px solid var(--border)', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
        <h2 style={{ fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', fontSize: '1.25rem', fontWeight: 700, color: 'var(--midnight)', marginBottom: '0.75rem' }}>
          Community unlocks at Mobility Score 200
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem', marginBottom: '1.5rem', maxWidth: 400, margin: '0 auto 1.5rem' }}>
          You are at {mobilityScore} points. Save toward a goal, upload documents, and make deposits to reach 200.
        </p>
        <div style={{ height: '8px', background: 'var(--gray-100)', borderRadius: '4px', maxWidth: 300, margin: '0 auto', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${(mobilityScore / 200) * 100}%`, background: 'var(--teal)', borderRadius: '4px', transition: 'width 0.5s' }} />
        </div>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
          {200 - mobilityScore} more points needed
        </p>
        <a href="/dashboard/goals" style={{ display: 'inline-block', marginTop: '1.5rem', padding: '0.75rem 1.5rem', background: 'var(--teal)', color: 'var(--midnight)', fontWeight: 700, borderRadius: 'var(--radius-md)', textDecoration: 'none' }}>
          Go to my goals →
        </a>
      </div>
    );
  }

  const { data: groups } = await (supabase as any)
    .from("community_groups")
    .select("*, community_memberships(user_id)")
    .eq("is_active", true);

  const { data: memberships } = await (supabase as any)
    .from("community_memberships")
    .select("group_id")
    .eq("user_id", user.id);

  const memberGroupIds = new Set<string>(memberships?.map((m: any) => m.group_id));

  return (
    <CommunityHub
      groups={(groups || []).filter((g: any) => g.group_type !== "alumni" || profile?.alumni_status)}
      memberGroupIds={memberGroupIds}
      userId={user.id}
      mobilityScore={mobilityScore}
    />
  );
}
/* eslint-enable @typescript-eslint/no-explicit-any */
