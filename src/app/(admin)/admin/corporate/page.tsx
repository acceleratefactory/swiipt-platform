import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import CorporateClientsList from "@/components/admin/corporate/CorporateClientsList";

export default async function AdminCorporatePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: role } = await (supabase as any).from("user_roles").select("role").eq("user_id", user.id).single();
  if (!role || (role.role !== "admin" && role.role !== "case_manager")) redirect("/dashboard");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: clients } = await (supabase as any)
    .from("corporate_clients")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1.5rem", fontWeight: 800, color: "var(--midnight)", marginBottom: "1.5rem" }}>
        Corporate Clients
      </h1>
      <CorporateClientsList clients={clients || []} />
    </div>
  );
}
