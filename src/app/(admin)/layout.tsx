import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AdminShell from "@/components/admin/shell/AdminShell";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: role } = await (supabase as any)
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (!role || (role.role !== "admin" && role.role !== "case_manager")) {
    redirect("/dashboard");
  }

  const { count: pendingDeposits } = await supabase
    .from("deposits")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending")
    .not("user_confirmed_at", "is", null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count: pendingWithdrawals } = await (supabase as any)
    .from("withdrawals")
    .select("*", { count: "exact", head: true })
    .eq("status", "requested");

  return (
    <AdminShell
      adminEmail={user.email!}
      adminRole={role.role}
      pendingDeposits={pendingDeposits || 0}
      pendingWithdrawals={pendingWithdrawals || 0}
    >
      {children}
    </AdminShell>
  );
}
