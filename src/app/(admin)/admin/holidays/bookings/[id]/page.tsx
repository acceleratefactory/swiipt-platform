import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import HolidayBookingDetail from "@/components/admin/holidays/HolidayBookingDetail";

export default async function AdminBookingDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const serviceClient = createServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: role } = await (serviceClient as any)
    .from("user_roles").select("role").eq("user_id", user.id).single();
  if (!role || (role.role !== "admin" && role.role !== "case_manager")) redirect("/dashboard");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: booking } = await (serviceClient as any)
    .from("holiday_bookings")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!booking) notFound();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [userRes, pkgRes, docsRes] = await Promise.all([
    (serviceClient as any).from("users").select("full_name, email, mobility_score").eq("id", booking.user_id).single(),
    (serviceClient as any).from("holiday_packages").select("title, destination, duration_nights").eq("id", booking.package_id).single(),
    (serviceClient as any).from("document_requests").select("*").eq("order_id", params.id),
  ]);

  const enrichedBooking = {
    ...booking,
    user: userRes.data || null,
    package: pkgRes.data || null,
  };

  return (
    <div>
      <h1 style={{ fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', fontSize: '1.375rem', fontWeight: 800, color: 'var(--midnight)', marginBottom: '1.5rem' }}>
        Booking details
      </h1>
      <HolidayBookingDetail booking={enrichedBooking} documents={docsRes.data || []} adminId={user.id} />
    </div>
  );
}
