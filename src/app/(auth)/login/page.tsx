import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import LoginForm from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Log in — Swiipt",
  description: "Log in to your Swiipt account to save, book flights, and manage your goals.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { return?: string; error?: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect(searchParams.return || "/dashboard");

  return <LoginForm returnUrl={searchParams.return} authError={searchParams.error} />;
}
