import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import OrdersTable from "@/components/admin/orders/OrdersTable";

export default async function AdminOrdersPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: role } = await (supabase as any).from("user_roles").select("role").eq("user_id", user.id).single();
  if (!role || (role.role !== "admin" && role.role !== "case_manager")) redirect("/dashboard");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: orders } = await (supabase as any)
    .from("service_orders")
    .select(`
      *,
      users(full_name, email),
      service_packages(name, category, destination)
    `)
    .not("status", "in", '("cancelled")')
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 style={{ fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', fontSize: '1.375rem', fontWeight: 800, color: 'var(--midnight)', marginBottom: '1.5rem' }}>
        Service Orders
      </h1>
      <OrdersTable orders={orders || []} />
    </div>
  );
}
