import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ProfileForm from "@/components/dashboard/settings/ProfileForm";
import CurrencyPreference from "@/components/dashboard/settings/CurrencyPreference";
import NotificationPreferences from "@/components/dashboard/settings/NotificationPreferences";

export default async function SettingsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [profileRes, currenciesRes] = await Promise.all([
    supabase.from("users").select("*").eq("id", user.id).single(),
    supabase.from("currencies").select("code, name, symbol, is_active").eq("is_active", true).order("code"),
  ]);

  return (
    <div style={{ maxWidth: "640px" }}>
      <h1 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1.5rem", fontWeight: 800, color: "var(--midnight)", marginBottom: "1.5rem" }}>
        Settings
      </h1>
      <ProfileForm profile={profileRes.data} userId={user.id} userEmail={user.email!} />
      <CurrencyPreference
        currentCurrency={profileRes.data?.preferred_currency || "NGN"}
        currencies={currenciesRes.data || []}
        userId={user.id}
      />
      <NotificationPreferences userId={user.id} />
    </div>
  );
}
