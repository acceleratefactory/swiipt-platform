import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import OrderDetailView from "@/components/admin/orders/OrderDetailView";

export default async function AdminOrderDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const adminSupabase = createServiceClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: role } = await (supabase as any).from("user_roles").select("role").eq("user_id", user.id).single();
  if (!role || (role.role !== "admin" && role.role !== "case_manager")) redirect("/dashboard");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: order } = await (adminSupabase as any)
    .from("service_orders")
    .select(`
      *,
      users(full_name, email, mobility_score),
      service_packages(*)
    `)
    .eq("id", params.id)
    .single();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: documents } = await (adminSupabase as any)
    .from("document_requests")
    .select("*")
    .eq("order_id", params.id);

  if (!order) notFound();

  return (
    <div>
      <h1 style={{ fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', fontSize: '1.375rem', fontWeight: 800, color: 'var(--midnight)', marginBottom: '1.5rem' }}>
        Order details
      </h1>
      <OrderDetailView order={order} documents={documents || []} adminId={user.id} />
    </div>
  );
}
