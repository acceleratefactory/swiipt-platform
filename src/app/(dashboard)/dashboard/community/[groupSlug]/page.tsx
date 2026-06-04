import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
/* eslint-disable @typescript-eslint/no-explicit-any */
import GroupDiscussion from "@/components/dashboard/community/GroupDiscussion";

export default async function GroupPage({ params }: { params: { groupSlug: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: group } = await (supabase as any).from("community_groups").select("*").eq("slug", params.groupSlug).single();
  if (!group) notFound();

  const { data: membership } = await (supabase as any).from("community_memberships")
    .select("id").eq("user_id", user.id).eq("group_id", group.id).single();

  if (!membership) redirect("/dashboard/community");

  const { data: threads } = await (supabase as any)
    .from("community_threads")
    .select("*, author:author_id(full_name)")
    .eq("group_id", group.id)
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false });

  return <GroupDiscussion group={group} threads={threads || []} userId={user.id} />;
}
/* eslint-enable @typescript-eslint/no-explicit-any */
