import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { redirect, notFound } from "next/navigation";
import AdminPartnerDetail from "./AdminPartnerDetail";

export const dynamic = "force-dynamic";

export default async function AdminPartnerDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: role } = await (supabase as any).from("user_roles").select("role").eq("user_id", user.id).single();
  if (!role || role.role !== "admin") redirect("/dashboard");

  const serviceClient = createServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: partner } = await (serviceClient as any)
    .from("platform_partners")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!partner) notFound();

  // Fetch escrow deals for this partner
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: deals } = await (serviceClient as any)
    .from("escrow_deals")
    .select("*")
    .eq("partner_id", params.id)
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <div>
      <AdminPartnerDetail partner={partner} deals={deals || []} />
    </div>
  );
}
