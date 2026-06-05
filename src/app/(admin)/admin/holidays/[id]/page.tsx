import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import HolidayPackageForm from "@/components/admin/holidays/HolidayPackageForm";

export default async function EditHolidayPackagePage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: role } = await (supabase as any).from("user_roles").select("role").eq("user_id", user.id).single();
  if (!role || (role.role !== "admin" && role.role !== "case_manager")) redirect("/dashboard");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: pkg } = await (supabase as any)
    .from("holiday_packages")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!pkg) {
    return (
      <div style={{ background: "white", borderRadius: "var(--radius-lg)", padding: "2rem", border: "1px solid var(--border)", textAlign: "center" }}>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9375rem" }}>Package not found.</p>
      </div>
    );
  }

  return (
    <div>
      <h1 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1.5rem", fontWeight: 800, color: "var(--midnight)", marginBottom: "1.5rem" }}>
        Edit: {pkg.title}
      </h1>
      <HolidayPackageForm pkg={pkg} />
    </div>
  );
}
