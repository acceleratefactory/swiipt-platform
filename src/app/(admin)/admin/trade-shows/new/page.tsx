import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import TradeShowForm from "@/components/admin/trade-shows/TradeShowForm";

export default async function NewTradeShowPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: role } = await (supabase as any).from("user_roles").select("role").eq("user_id", user.id).single();
  if (!role || (role.role !== "admin" && role.role !== "case_manager")) redirect("/dashboard");

  return (
    <div>
      <h1 style={{ fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', fontSize: '1.375rem', fontWeight: 800, color: 'var(--midnight)', marginBottom: '1.5rem' }}>
        Create Trade Show
      </h1>
      <TradeShowForm />
    </div>
  );
}
