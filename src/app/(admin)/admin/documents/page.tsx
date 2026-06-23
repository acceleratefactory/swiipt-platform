import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import DocumentVerificationQueue from "@/components/admin/documents/DocumentVerificationQueue";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminDocumentsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const adminSupabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: role } = await (adminSupabase as any).from("user_roles").select("role").eq("user_id", user.id).single();
  if (!role || (role.role !== "admin" && role.role !== "case_manager")) redirect("/dashboard");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: _pendingDocs } = await (adminSupabase as any)
    .from("document_requests")
    .select("*")
    .eq("status", "uploaded")
    .order("uploaded_at", { ascending: true });

  const userIds = Array.from(new Set((_pendingDocs || []).map((d: any) => d.user_id).filter(Boolean)));
  const orderIds = Array.from(new Set((_pendingDocs || []).map((d: any) => d.order_id).filter(Boolean)));

  const [{ data: users }, { data: orders }] = await Promise.all([
    userIds.length ? (adminSupabase as any).from("users").select("id, full_name, email").in("id", userIds) : { data: [] },
    orderIds.length ? (adminSupabase as any).from("service_orders").select("id, package_id").in("id", orderIds) : { data: [] },
  ]);

  const packageIds = Array.from(new Set((orders || []).map((o: any) => o.package_id).filter(Boolean)));
  const { data: packages } = packageIds.length
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ? await (adminSupabase as any).from("service_packages").select("id, name").in("id", packageIds)
    : { data: [] };

  const userMap = new Map((users || []).map((u: any) => [u.id, { full_name: u.full_name, email: u.email }]));
  const orderMap = new Map((orders || []).map((o: any) => [o.id, o]));
  const packageMap = new Map((packages || []).map((p: any) => [p.id, p.name]));

  const pendingDocs = (_pendingDocs || []).map((d: any) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const order = orderMap.get(d.order_id) as any;
    const pkgName = order ? packageMap.get(order.package_id) : null;
    return {
      ...d,
      users: userMap.get(d.user_id) || null,
      service_orders: order ? { service_packages: { name: pkgName || null } } : null,
    };
  });

  return (
    <div>
      <h1 style={{ fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', fontSize: '1.375rem', fontWeight: 800, color: 'var(--midnight)', marginBottom: '1.5rem' }}>
        Document verification
      </h1>
      <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
        {pendingDocs.length} document(s) pending review
      </p>
      <DocumentVerificationQueue initialDocs={pendingDocs} />
    </div>
  );
}
