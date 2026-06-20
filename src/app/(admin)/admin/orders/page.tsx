import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import OrdersTable from "@/components/admin/orders/OrdersTable";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminOrdersPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const adminSupabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: role } = await adminSupabase.from("user_roles").select("role").eq("user_id", user.id).single();
  if (!role || (role.role !== "admin" && role.role !== "case_manager")) redirect("/dashboard");

  const { data: rawOrders } = await adminSupabase
    .from("service_orders")
    .select("*")
    .not("status", "in", '("cancelled")')
    .order("created_at", { ascending: false });

  const userIds = Array.from(new Set((rawOrders || []).map((o: any) => o.user_id).filter(Boolean)));
  const packageIds = Array.from(new Set((rawOrders || []).map((o: any) => o.package_id).filter(Boolean)));

  const [{ data: users }, { data: packages }] = await Promise.all([
    userIds.length ? adminSupabase.from("users").select("id, full_name, email").in("id", userIds) : { data: [] },
    packageIds.length ? adminSupabase.from("service_packages").select("id, name, category, destination").in("id", packageIds) : { data: [] },
  ]);

  const userMap = new Map((users || []).map((u: any) => [u.id, { full_name: u.full_name, email: u.email }]));
  const pkgMap = new Map((packages || []).map((p: any) => [p.id, { name: p.name, category: p.category, destination: p.destination }]));

  const orders = (rawOrders || []).map((o: any) => ({
    ...o,
    users: userMap.get(o.user_id) || null,
    service_packages: pkgMap.get(o.package_id) || null,
  }));

  return (
    <div>
      <h1 style={{ fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', fontSize: '1.375rem', fontWeight: 800, color: 'var(--midnight)', marginBottom: '1.5rem' }}>
        Service Orders
      </h1>
      <OrdersTable orders={orders || []} />
    </div>
  );
}
