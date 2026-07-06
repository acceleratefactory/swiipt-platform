import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SearchExplore from "@/components/dashboard/opportunities/SearchExplore";
import { getOpportunityTypes, buildTypeStyleMap } from "@/lib/opportunity-types";

export default async function SearchPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [oppTypes] = await Promise.all([
    getOpportunityTypes(),
  ]);

  const { data: countries } = await supabase
    .from("opportunities")
    .select("location_country")
    .eq("is_active", true)
    .not("location_country", "is", null);

  const countrySet = new Set(
    (countries || []).map((c) => c.location_country).filter(Boolean) as string[]
  );
  const uniqueCountries = Array.from(countrySet).sort();

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "1rem" }}>
      <h1 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1rem" }}>
        Search Opportunities
      </h1>
      <SearchExplore
        typeStyles={buildTypeStyleMap(oppTypes)}
        opportunityTypes={oppTypes.filter((t) => t.is_active)}
        countries={uniqueCountries}
      />
    </div>
  );
}
