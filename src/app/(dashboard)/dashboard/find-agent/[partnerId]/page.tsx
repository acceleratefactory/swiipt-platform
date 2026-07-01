import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import AgentDetail from "./AgentDetail";

export const dynamic = "force-dynamic";

export default async function AgentDetailPage({ params }: { params: { partnerId: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: partner } = await supabase
    .from("platform_partners")
    .select("*")
    .eq("id", params.partnerId)
    .single();

  if (!partner) notFound();

  const p = partner as unknown as {
    id: string; name: string; business_name: string | null;
    email: string; phone: string | null;
    partner_type: string; status: string;
    specialisations: string[]; destinations_served: string[];
    average_rating: number; total_reviews: number;
    total_escrow_volume_ngn: number; total_escrow_transactions: number;
    platform_fee_pct: number;
    years_in_operation: number | null;
    cac_number: string | null;
    professional_licence_number: string | null;
    created_at: string;
  };

  const PARTNER_TYPE_LABELS: Record<string, string> = {
    immigration_lawyer: "Immigration Lawyer",
    visa_agent: "Visa Agent",
    relocation_consultant: "Relocation Consultant",
    trade_agent: "Trade Agent",
    recruitment_agency: "Recruitment Agency",
    education_consultant: "Education Consultant",
  };

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto" }}>
      <AgentDetail partner={p} typeLabel={PARTNER_TYPE_LABELS[p.partner_type] || p.partner_type} />
    </div>
  );
}
