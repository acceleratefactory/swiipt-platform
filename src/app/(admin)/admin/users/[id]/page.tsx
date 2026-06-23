import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import UserProfileAdmin from "@/components/admin/users/UserProfileAdmin";

export default async function AdminUserProfilePage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: role } = await (supabase as any).from("user_roles").select("role").eq("user_id", user.id).single();
  if (!role || (role.role !== "admin" && role.role !== "case_manager")) redirect("/dashboard");

  const userId = params.id;

  const [profileRes, walletRes, goalsRes, depositsRes, withdrawalsRes, ordersRes, referralsRes, activityRes, auditRes, vaultDocsRes] = await Promise.all([
    supabase.from("users").select("*").eq("id", userId).single(),
    supabase.from("wallets").select("*").eq("user_id", userId).single(),
    supabase.from("savings_goals").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    supabase.from("deposits").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(20),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).from("withdrawals").select("*").eq("user_id", userId).order("requested_at", { ascending: false }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).from("service_orders").select("*, service_packages(name)").eq("user_id", userId).order("created_at", { ascending: false }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).from("referrals").select("*, referred:referred_id(full_name, email)").eq("referrer_id", userId),
    supabase.from("activity_log").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(30),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).from("admin_audit_log").select("*").eq("target_user_id", userId).order("created_at", { ascending: false }).limit(20),
    supabase
      .from("activity_log")
      .select("event_data, created_at")
      .eq("user_id", userId)
      .eq("event_type", "vault_document_uploaded")
      .order("created_at", { ascending: false }),
  ]);

  return (
    <UserProfileAdmin
      profile={profileRes.data}
      wallet={walletRes.data}
      goals={goalsRes.data || []}
      deposits={depositsRes.data || []}
      withdrawals={withdrawalsRes.data || []}
      orders={ordersRes.data || []}
      referrals={referralsRes.data || []}
      activityLog={activityRes.data || []}
      adminAuditLog={auditRes.data || []}
      vaultDocs={(vaultDocsRes.data || []).map((d: any) => ({ ...d.event_data, uploaded_at: d.created_at }))}
      adminId={user.id}
    />
  );
}
