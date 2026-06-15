import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const returnUrl = searchParams.get("return") || "/dashboard";

  console.log("[auth/callback] URL:", request.url);
  console.log("[auth/callback] origin:", origin, "code:", code?.slice(0, 10) + "...", "returnUrl:", returnUrl);

  if (code) {
    const cookiesToSet: Array<{ name: string; value: string; options: any }> = [];

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            const all = request.cookies.getAll();
            console.log("[auth/callback] getAll() cookie names:", all.map(c => c.name));
            return all;
          },
          setAll(cookies) {
            console.log("[auth/callback] setAll() called with", cookies.length, "cookies:", cookies.map(c => c.name));
            cookies.forEach(({ name, value, options }) => {
              request.cookies.set(name, value);
              cookiesToSet.push({ name, value, options });
            });
          },
        },
      }
    );

    console.log("[auth/callback] calling exchangeCodeForSession...");
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    console.log("[auth/callback] exchangeCodeForSession error:", error?.message ?? "none");

    if (!error) {
      console.log("[auth/callback] calling getUser...");
      const { data: { user } } = await supabase.auth.getUser();
      console.log("[auth/callback] getUser result:", user ? `user_id=${user.id}` : "null");

      if (user) {
        console.log("[auth/callback] querying users table for profile...");
        const { data: profile, error: profileError } = await supabase
          .from("users")
          .select("id")
          .eq("id", user.id)
          .single();
        console.log("[auth/callback] profile query error:", profileError?.message ?? "none");
        console.log("[auth/callback] profile found:", !!profile);

        const redirectUrl = profile
          ? `${origin}${returnUrl}`
          : `${origin}/onboarding`;

        console.log("[auth/callback] redirectUrl:", redirectUrl);
        console.log("[auth/callback] cookiesToSet count:", cookiesToSet.length, "names:", cookiesToSet.map(c => c.name));

        const response = NextResponse.redirect(redirectUrl);
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
        console.log("[auth/callback] returning redirect to:", redirectUrl);
        return response;
      }

      console.log("[auth/callback] user was null — falling through to error redirect");
    }
  }

  console.log("[auth/callback] fallback redirect to /login?error=auth_failed");
  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
