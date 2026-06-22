import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import OrderDetailView from "@/components/admin/orders/OrderDetailView";

export default async function AdminOrderDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const adminSupabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: role } = await (adminSupabase as any)
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .single();
  if (!role || (role.role !== "admin" && role.role !== "case_manager")) redirect("/dashboard");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: order } = await (adminSupabase as any)
    .from("service_orders")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!order) notFound();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [userRes, pkgRes, docsRes] = await Promise.all([
    (adminSupabase as any).from("users").select("full_name, email, mobility_score").eq("id", order.user_id).single(),
    (adminSupabase as any).from("service_packages").select("*").eq("id", order.package_id).single(),
    (adminSupabase as any).from("document_requests").select("*").eq("order_id", params.id),
  ]);

  const enrichedOrder = {
    ...order,
    users: userRes.data || null,
    service_packages: pkgRes.data || null,
  };

  return (
    <div>
      <h1 style={{ fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', fontSize: '1.375rem', fontWeight: 800, color: 'var(--midnight)', marginBottom: '1.5rem' }}>
        Order details
      </h1>
      <OrderDetailView order={enrichedOrder} documents={docsRes.data || []} adminId={user.id} />
    </div>
  );
}
