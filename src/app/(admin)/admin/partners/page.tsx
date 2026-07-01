import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { redirect } from "next/navigation";
import AdminPartnerList from "./AdminPartnerList";

export const dynamic = "force-dynamic";

const PARTNER_TYPE_LABELS: Record<string, string> = {
  immigration_lawyer: "Immigration Lawyer",
  visa_agent: "Visa Agent",
  relocation_consultant: "Relocation Consultant",
  trade_agent: "Trade Agent",
  recruitment_agency: "Recruitment Agency",
  education_consultant: "Education Consultant",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "#F59E0B",
  active: "#059669",
  suspended: "#DC2626",
  rejected: "#6B7280",
};

export default async function AdminPartnersPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: role } = await (supabase as any).from("user_roles").select("role").eq("user_id", user.id).single();
  if (!role || role.role !== "admin") redirect("/dashboard");

  const serviceClient = createServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: partners } = await (serviceClient as any)
    .from("platform_partners")
    .select("*")
    .order("created_at", { ascending: false });

  const partnersList = (partners || []).map((p: Record<string, unknown>) => ({
    ...p,
    typeLabel: PARTNER_TYPE_LABELS[p.partner_type as string] || (p.partner_type as string),
    statusColor: STATUS_COLORS[p.status as string] || "#6B7280",
  }));

  return (
    <div>
      <h1 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1.375rem", fontWeight: 800, color: "var(--midnight)", marginBottom: "0.5rem" }}>
        Partners
      </h1>
      <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginBottom: "1.5rem" }}>
        {partnersList.length} partner{(partnersList as Array<unknown>).length !== 1 ? "s" : ""} · Manage applications and active agents
      </p>
      <AdminPartnerList partners={partnersList} />
    </div>
  );
}
