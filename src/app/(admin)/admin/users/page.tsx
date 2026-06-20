import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import UserListTable from "@/components/admin/users/UserListTable";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminUsersPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const adminSupabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: role } = await adminSupabase.from("user_roles").select("role").eq("user_id", user.id).single();
  if (!role || (role.role !== "admin" && role.role !== "case_manager")) redirect("/dashboard");

  const { data: rawUsers, count } = await adminSupabase
    .from("users")
    .select("id, full_name, email, phone, country_of_residence, mobility_score, alumni_status, referral_code, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(0, 49);

  const userIds = (rawUsers || []).map((u: any) => u.id);
  const [{ data: wallets }, { data: userRoles }] = await Promise.all([
    userIds.length ? adminSupabase.from("wallets").select("user_id, total_locked_ngn, balance_ngn").in("user_id", userIds) : { data: [] },
    userIds.length ? adminSupabase.from("user_roles").select("user_id, role").in("user_id", userIds) : { data: [] },
  ]);

  const walletMap = new Map((wallets || []).map((w: any) => [w.user_id, { total_locked_ngn: w.total_locked_ngn, balance_ngn: w.balance_ngn }]));
  const roleMap = new Map((userRoles || []).map((r: any) => [r.user_id, { role: r.role }]));

  const users = (rawUsers || []).map((u: any) => ({
    ...u,
    wallets: walletMap.get(u.id) || null,
    user_roles: roleMap.get(u.id) || null,
  }));

  return (
    <div>
      <h1 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1.5rem", fontWeight: 800, color: "var(--midnight)", marginBottom: "1.5rem" }}>
        User Management
      </h1>
      <UserListTable users={users || []} totalCount={count || 0} />
    </div>
  );
}
