import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import FlightSearchForm from "@/components/dashboard/flights/FlightSearchForm";

export default async function FlightResultsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("country_of_residence, preferred_currency")
    .eq("id", user.id)
    .single();

  const { data: recentSearches } = await supabase
    .from("activity_log")
    .select("event_data, created_at")
    .eq("user_id", user.id)
    .eq("event_type", "flight_searched")
    .order("created_at", { ascending: false })
    .limit(5);

  const { data: goals } = await supabase
    .from("savings_goals")
    .select("destination, goal_name")
    .eq("user_id", user.id)
    .eq("status", "active")
    .not("destination", "is", null);

  return (
    <div>
      <h1 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1.5rem", fontWeight: 800, color: "var(--midnight)", marginBottom: "0.5rem" }}>
        Flight Results
      </h1>
      <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginBottom: "1.5rem" }}>
        Refine your search or browse results below.
      </p>
      <FlightSearchForm
        defaultOrigin={profile?.country_of_residence === "Nigeria" ? "LOS" : ""}
        recentSearches={recentSearches || []}
        goalDestinations={goals || []}
      />
    </div>
  );
}
