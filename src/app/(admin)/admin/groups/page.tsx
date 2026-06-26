import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import GroupsTable from "@/components/admin/groups/GroupsTable";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminGroupsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const adminSupabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: role } = await (adminSupabase as any).from("user_roles").select("role").eq("user_id", user.id).single();
  if (!role || (role.role !== "admin" && role.role !== "case_manager")) redirect("/dashboard");

  const { data: rawGroups } = await (adminSupabase as any)
    .from("group_buys")
    .select("*")
    .order("created_at", { ascending: false });

  const creatorIds = Array.from(new Set((rawGroups || []).map((g: any) => g.creator_id).filter(Boolean)));

  const { data: creators } = creatorIds.length
    ? await (adminSupabase as any).from("users").select("id, full_name, email").in("id", creatorIds)
    : { data: [] };

  const creatorMap = new Map((creators || []).map((u: any) => [u.id, { full_name: u.full_name, email: u.email }]));

  const groups = (rawGroups || []).map((g: any) => ({
    ...g,
    creator: creatorMap.get(g.creator_id) || null,
  }));

  return (
    <div>
      <h1 style={{ fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', fontSize: '1.375rem', fontWeight: 800, color: 'var(--midnight)', marginBottom: '1.5rem' }}>
        Groups
      </h1>
      <GroupsTable groups={groups || []} />
    </div>
  );
}
