import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import AffiliateWithdrawals from "@/components/admin/affiliates/AffiliateWithdrawals";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/* eslint-disable @typescript-eslint/no-explicit-any */
export default async function AdminAffiliateWithdrawalsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const adminSupabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: role } = await adminSupabase.from("user_roles").select("role").eq("user_id", user.id).single();
  if (!role || role.role !== "admin") redirect("/dashboard");

  const { data: pending } = await (adminSupabase as any)
    .from("affiliate_withdrawals")
    .select("*")
    .eq("status", "pending")
    .order("requested_at", { ascending: false });

  const { data: processed } = await (adminSupabase as any)
    .from("affiliate_withdrawals")
    .select("*")
    .in("status", ["approved", "rejected"])
    .order("processed_at", { ascending: false })
    .limit(20);

  const allUserIds = Array.from(new Set([
    ...(pending || []).map((w: any) => w.user_id),
    ...(processed || []).map((w: any) => w.user_id),
  ].filter(Boolean)));

  const { data: users } = allUserIds.length
    ? await (adminSupabase as any).from("users").select("id, full_name, email").in("id", allUserIds)
    : { data: [] };

  const userMap = new Map((users || []).map((u: any) => [u.id, { full_name: u.full_name, email: u.email }]));

  const pendingWithdrawals = (pending || []).map((w: any) => ({
    ...w,
    users: userMap.get(w.user_id) || null,
  }));

  const recentProcessed = (processed || []).map((w: any) => ({
    ...w,
    users: userMap.get(w.user_id) || null,
  }));

  return (
    <div>
      <h1 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1.375rem", fontWeight: 800, color: "var(--midnight)", marginBottom: "1.5rem" }}>
        Withdrawal Requests
      </h1>
      <AffiliateWithdrawals pendingWithdrawals={pendingWithdrawals} recentProcessed={recentProcessed} />
    </div>
  );
}
/* eslint-enable @typescript-eslint/no-explicit-any */
