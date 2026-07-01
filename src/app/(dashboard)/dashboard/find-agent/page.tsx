import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PartnerDirectory from "./PartnerDirectory";

export const dynamic = "force-dynamic";

const PARTNER_TYPE_LABELS: Record<string, string> = {
  immigration_lawyer: "Immigration Lawyer",
  visa_agent: "Visa Agent",
  relocation_consultant: "Relocation Consultant",
  trade_agent: "Trade Agent",
  recruitment_agency: "Recruitment Agency",
  education_consultant: "Education Consultant",
};

export default async function FindAgentPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: partners } = await supabase
    .from("platform_partners")
    .select("*")
    .eq("status", "active")
    .order("average_rating", { ascending: false, nullsFirst: false });

  const partnersList = (partners || []).map((p: Record<string, unknown>) => ({
    id: p.id as string,
    name: p.name as string,
    business_name: p.business_name as string | null,
    partner_type: p.partner_type as string,
    typeLabel: PARTNER_TYPE_LABELS[p.partner_type as string] || (p.partner_type as string),
    specialisations: (p.specialisations as string[]) || [],
    destinations_served: (p.destinations_served as string[]) || [],
    average_rating: (p.average_rating as number) || 0,
    total_reviews: (p.total_reviews as number) || 0,
    total_escrow_transactions: (p.total_escrow_transactions as number) || 0,
    years_in_operation: p.years_in_operation as number | null,
  }));

  return (
    <div>
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1.5rem", fontWeight: 800, color: "var(--midnight)", margin: "0 0 0.25rem 0" }}>
          Find an Agent
        </h1>
        <p style={{ fontSize: "0.875rem", color: "#6B7280", margin: 0 }}>
          Browse verified partners offering immigration, visa, relocation and trade services
        </p>
      </div>

      {partnersList.length === 0 ? (
        <div style={{ padding: "3rem", background: "white", borderRadius: "var(--radius-xl)", border: "1px solid var(--border)", textAlign: "center" }}>
          <p style={{ fontSize: "0.9375rem", color: "#6B7280", margin: "0 0 0.75rem 0" }}>No active agents yet.</p>
          <p style={{ fontSize: "0.8125rem", color: "#9CA3AF", margin: 0 }}>Check back soon or <a href="/partners/apply" style={{ color: "var(--teal)", fontWeight: 600 }}>apply to become a partner</a>.</p>
        </div>
      ) : (
        <PartnerDirectory partners={partnersList} />
      )}
    </div>
  );
}
