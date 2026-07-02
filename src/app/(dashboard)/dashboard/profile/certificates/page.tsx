import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import CertificateList from "./CertificateList";

export const dynamic = "force-dynamic";

export default async function CertificatesPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [certsRes, goalsRes, depositsRes] = await Promise.all([
    supabase.from("platform_certificates").select("*").eq("user_id", user.id).order("issued_at", { ascending: false }),
    supabase.from("savings_goals").select("id, goal_name, current_balance, target_amount, destination, status").eq("user_id", user.id).eq("status", "active"),
    supabase.from("deposits").select("id, status, amount, created_at").eq("user_id", user.id).eq("status", "confirmed").order("created_at", { ascending: false }).limit(20),
  ]);

  const certificates = (certsRes.data || []) as unknown as Array<{
    id: string; certificate_type: string; certificate_number: string;
    data_snapshot: Record<string, unknown>; is_valid: boolean;
    expires_at: string; issued_at: string; verification_url: string;
    fee_deposit_id: string | null;
  }>;

  const eligibleGoals = (goalsRes.data || []).filter(
    (g) => (g as unknown as { current_balance: number }).current_balance >= 50000
  ) as unknown as Array<{
    id: string; goal_name: string; current_balance: number;
    target_amount: number; destination: string | null;
  }>;

  const confirmedDeposits = (depositsRes.data || []) as unknown as Array<{
    id: string; amount: number; created_at: string;
  }>;

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1.5rem", fontWeight: 800, color: "var(--midnight)", margin: 0 }}>My Certificates</h1>
        <p style={{ fontSize: "0.875rem", color: "#6B7280", margin: "0.25rem 0 0 0" }}>
          Request Proof of Funds or Trust Certificates for your visa and relocation applications
        </p>
      </div>

      <CertificateList
        certificates={certificates}
        eligibleGoals={eligibleGoals}
        confirmedDeposits={confirmedDeposits}
        userId={user.id}
      />
    </div>
  );
}
