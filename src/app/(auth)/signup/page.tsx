import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SignupForm from "@/components/auth/SignupForm";

export const metadata: Metadata = {
  title: "Sign up — Swiipt",
  description: "Create your Swiipt account and start saving toward your goals today.",
};

export default async function SignupPage({
  searchParams,
}: {
  searchParams: { return?: string; ref?: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect(searchParams.return || "/dashboard");

  return <SignupForm referralCode={searchParams.ref} />;
}
