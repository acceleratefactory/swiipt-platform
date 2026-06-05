import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import FlightBookingConfirm from "@/components/dashboard/flights/FlightBookingConfirm";

export default async function FlightBookingPage({ params }: { params: { offerId: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("full_name, email, phone")
    .eq("id", user.id)
    .single();

  return (
    <div>
      <h1 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1.5rem", fontWeight: 800, color: "var(--midnight)", marginBottom: "0.5rem" }}>
        Complete Booking
      </h1>
      <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginBottom: "1.5rem" }}>
        Review your flight and enter passenger details.
      </p>
      <FlightBookingConfirm
        offerId={params.offerId}
        profile={{
          full_name: profile?.full_name || "",
          email: profile?.email || "",
          phone: profile?.phone || "",
        }}
      />
    </div>
  );
}
