import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SignupForm from "@/components/auth/SignupForm";

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
