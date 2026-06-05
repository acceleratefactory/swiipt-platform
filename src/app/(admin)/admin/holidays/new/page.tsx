import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import HolidayPackageForm from "@/components/admin/holidays/HolidayPackageForm";

export default async function NewHolidayPackagePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: role } = await (supabase as any).from("user_roles").select("role").eq("user_id", user.id).single();
  if (!role || (role.role !== "admin" && role.role !== "case_manager")) redirect("/dashboard");

  return (
    <div>
      <h1 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1.5rem", fontWeight: 800, color: "var(--midnight)", marginBottom: "1.5rem" }}>
        New Holiday Package
      </h1>
      <HolidayPackageForm />
    </div>
  );
}
