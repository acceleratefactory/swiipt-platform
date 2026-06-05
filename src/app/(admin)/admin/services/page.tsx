import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import ServicePackagesTable from "@/components/admin/services/ServicePackagesTable";

export default async function AdminServicesPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: role } = await (supabase as any).from("user_roles").select("role").eq("user_id", user.id).single();
  if (!role || (role.role !== "admin" && role.role !== "case_manager")) redirect("/dashboard");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: packages } = await (supabase as any)
    .from("service_packages")
    .select("*")
    .order("sort_order", { ascending: true });

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h1 style={{ fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', fontSize: '1.375rem', fontWeight: 800, color: 'var(--midnight)' }}>
          Service Packages
        </h1>
        <Link
          href="/admin/services/new"
          style={{
            padding: "0.625rem 1.25rem",
            background: "var(--midnight)",
            color: "white",
            fontWeight: 700,
            fontSize: "0.875rem",
            borderRadius: "var(--radius-md)",
            textDecoration: "none",
          }}
        >
          + New package
        </Link>
      </div>
      <ServicePackagesTable packages={packages || []} />
    </div>
  );
}
