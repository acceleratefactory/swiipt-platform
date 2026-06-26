import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import GroupDetailView from "@/components/admin/groups/GroupDetailView";

export default async function AdminGroupDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const adminSupabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: role } = await (adminSupabase as any)
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .single();
  if (!role || (role.role !== "admin" && role.role !== "case_manager")) redirect("/dashboard");

  const { data: group } = await (adminSupabase as any)
    .from("group_buys")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!group) notFound();

  const { data: creator } = await (adminSupabase as any)
    .from("users")
    .select("full_name, email")
    .eq("id", group.creator_id)
    .single();

  const { data: members } = await (adminSupabase as any)
    .from("group_buy_members")
    .select("*")
    .eq("group_buy_id", params.id)
    .order("joined_at", { ascending: true });

  const memberIds = Array.from(new Set((members || []).map((m: any) => m.user_id).filter(Boolean)));

  const { data: memberUsers } = memberIds.length
    ? await (adminSupabase as any).from("users").select("id, full_name, email").in("id", memberIds)
    : { data: [] };

  const userMap = new Map((memberUsers || []).map((u: any) => [u.id, { full_name: u.full_name, email: u.email }]));

  const enrichedMembers = (members || []).map((m: any) => ({
    ...m,
    user: userMap.get(m.user_id) || null,
  }));

  return (
    <div>
      <h1 style={{ fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', fontSize: '1.375rem', fontWeight: 800, color: 'var(--midnight)', marginBottom: '1.5rem' }}>
        Group details
      </h1>
      <GroupDetailView group={{ ...group, creator }} members={enrichedMembers} adminId={user.id} />
    </div>
  );
}
