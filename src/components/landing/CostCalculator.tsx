import { createClient } from "@/lib/supabase/server";
import CostCalculatorClient from "./CostCalculatorClient";

export default async function CostCalculator() {
  const supabase = createClient();
  const { data: configs } = await supabase
    .from("calculator_configs")
    .select("*")
    .eq("is_active", true);

  return <CostCalculatorClient configs={configs || []} />;
}
