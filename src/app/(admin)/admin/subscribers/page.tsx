import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { redirect } from "next/navigation";
import SubscribersManager from "@/components/admin/subscribers/SubscribersManager";

export default async function AdminSubscribersPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: role } = await (supabase as any).from("user_roles").select("role").eq("user_id", user.id).single();
  if (!role || role.role !== "admin") redirect("/dashboard");

  const serviceClient = createServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: subscribers, count } = await (serviceClient as any)
    .from("email_subscribers")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 style={{
        fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif",
        fontSize: "1.375rem",
        fontWeight: 800,
        color: "var(--midnight)",
        marginBottom: "0.5rem",
      }}>
        Newsletter Subscribers
      </h1>
      <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginBottom: "1.5rem" }}>
        {count || 0} total subscribers · Export CSV to import into your email marketing platform.
      </p>
      <SubscribersManager subscribers={subscribers || []} />
    </div>
  );
}
