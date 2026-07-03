import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import CertificatesTable from "@/components/admin/certificates/CertificatesTable";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminCertificatesPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const adminSupabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: role } = await (adminSupabase as any).from("user_roles").select("role").eq("user_id", user.id).single();
  if (!role || (role.role !== "admin" && role.role !== "case_manager")) redirect("/dashboard");

  const { data: rawCerts } = await (adminSupabase as any)
    .from("platform_certificates")
    .select("*")
    .order("created_at", { ascending: false });

  const userIds = Array.from(new Set((rawCerts || []).map((c: any) => c.user_id).filter(Boolean)));

  const { data: users } = userIds.length
    ? await (adminSupabase as any).from("users").select("id, full_name, email").in("id", userIds)
    : { data: [] };

  const userMap = new Map((users || []).map((u: any) => [u.id, { full_name: u.full_name, email: u.email }]));

  const certificates = (rawCerts || []).map((c: any) => ({
    ...c,
    user: userMap.get(c.user_id) || null,
  }));

  return (
    <div>
      <h1 style={{ fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', fontSize: '1.375rem', fontWeight: 800, color: 'var(--midnight)', marginBottom: '1.5rem' }}>
        Certificates
      </h1>
      <CertificatesTable certificates={certificates || []} />
    </div>
  );
}
