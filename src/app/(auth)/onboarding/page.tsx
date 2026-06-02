import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import OnboardingShell from "@/components/onboarding/OnboardingShell";

export default async function OnboardingPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: goals } = await supabase
    .from("savings_goals")
    .select("id")
    .eq("user_id", user.id)
    .limit(1);

  if (goals && goals.length > 0) redirect("/dashboard");

  const { data: profile } = await supabase
    .from("users")
    .select("full_name, referral_code")
    .eq("id", user.id)
    .single();

  return (
    <OnboardingShell
      user={{
        id: user.id,
        full_name: profile?.full_name ?? undefined,
        referral_code: profile?.referral_code ?? undefined,
      }}
    />
  );
}
