import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import UserListTable from "@/components/admin/users/UserListTable";

export default async function AdminUsersPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: role } = await (supabase as any).from("user_roles").select("role").eq("user_id", user.id).single();
  if (!role || (role.role !== "admin" && role.role !== "case_manager")) redirect("/dashboard");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: users, count } = await (supabase as any)
    .from("users")
    .select(`
      id, full_name, email, phone, country_of_residence,
      mobility_score, alumni_status, referral_code, created_at,
      wallets(total_locked_ngn, balance_ngn),
      user_roles(role)
    `, { count: "exact" })
    .order("created_at", { ascending: false })
    .range(0, 49);

  return (
    <div>
      <h1 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1.5rem", fontWeight: 800, color: "var(--midnight)", marginBottom: "1.5rem" }}>
        User Management
      </h1>
      <UserListTable users={users || []} totalCount={count || 0} />
    </div>
  );
}
