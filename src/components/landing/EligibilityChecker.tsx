import { createClient } from "@/lib/supabase/server";
import EligibilityCheckerClient from "./EligibilityCheckerClient";

export default async function EligibilityChecker() {
  const supabase = createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: pathways } = await (supabase as any)
    .from("eligibility_pathways")
    .select("*")
    .eq("is_active", true)
    .order("priority_order", { ascending: true });

  return <EligibilityCheckerClient pathways={pathways || []} />;
}
