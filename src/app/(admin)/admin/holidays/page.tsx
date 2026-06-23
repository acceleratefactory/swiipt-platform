import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { redirect } from "next/navigation";
import Link from "next/link";
import HolidayPackagesTable from "@/components/admin/holidays/HolidayPackagesTable";
import HolidayBookingsPanel from "@/components/admin/holidays/HolidayBookingsPanel";

export default async function AdminHolidaysPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: role } = await (supabase as any).from("user_roles").select("role").eq("user_id", user.id).single();
  if (!role || (role.role !== "admin" && role.role !== "case_manager")) redirect("/dashboard");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: packages } = await (supabase as any)
    .from("holiday_packages")
    .select("id, title, destination, duration_nights, price_per_person_ngn, slots_available, is_active, is_featured")
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false });

  const serviceClient = createServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rawBookings } = await (serviceClient as any)
    .from("holiday_bookings")
    .select("*")
    .order("created_at", { ascending: false });

  const userIds = Array.from(new Set((rawBookings || []).map((b: any) => b.user_id).filter(Boolean)));
  const packageIds = Array.from(new Set((rawBookings || []).map((b: any) => b.package_id).filter(Boolean)));

  const [{ data: users }, { data: bookingPkgs }] = await Promise.all([
    userIds.length ? (serviceClient as any).from("users").select("id, full_name, email").in("id", userIds) : { data: [] },
    packageIds.length ? (serviceClient as any).from("holiday_packages").select("id, title").in("id", packageIds) : { data: [] },
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userMap = new Map((users || []).map((u: any) => [u.id, { full_name: u.full_name, email: u.email }]));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pkgMap = new Map((bookingPkgs || []).map((p: any) => [p.id, p.title]));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bookings = (rawBookings || []).map((b: any) => ({
    ...b,
    user: userMap.get(b.user_id) || null,
    package_title: pkgMap.get(b.package_id) || null,
  }));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1.5rem", fontWeight: 800, color: "var(--midnight)", margin: 0 }}>
            Holiday Packages
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginTop: "0.25rem" }}>
            Manage holiday packages across destinations.
          </p>
        </div>
        <Link href="/admin/holidays/new" style={{ padding: "0.625rem 1.25rem", background: "var(--midnight)", color: "white", fontWeight: 700, fontSize: "0.875rem", borderRadius: "var(--radius-md)", textDecoration: "none" }}>
          + New package
        </Link>
      </div>
      <HolidayPackagesTable packages={packages || []} />

      <h2 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1.25rem", fontWeight: 700, color: "var(--midnight)", marginTop: "2.5rem", marginBottom: "1rem" }}>
        Booking Requests
      </h2>
      <HolidayBookingsPanel bookings={bookings} />
    </div>
  );
}
