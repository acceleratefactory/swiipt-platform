import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { generateReferralCode } from "@/lib/referral-code";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const returnUrl = searchParams.get("return") || "/dashboard";

  if (code) {
    const cookiesToSet: Array<{ name: string; value: string; options: any }> = [];

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookies) {
            cookies.forEach(({ name, value, options }) => {
              request.cookies.set(name, value);
              cookiesToSet.push({ name, value, options });
            });
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("users")
          .select("id")
          .eq("id", user.id)
          .single();

        if (!profile) {
          const fullName =
            user.user_metadata?.full_name ??
            user.email?.split('@')[0] ??
            'Swiipt User';

          await supabase.from("users").insert({
            id: user.id,
            email: user.email ?? "",
            full_name: fullName,
            phone: user.user_metadata?.phone ?? null,
            country_of_residence: null,
            preferred_currency: "NGN",
            profile_photo_url: null,
            referral_code: generateReferralCode(fullName),
            referred_by: null,
          });
        }

        const redirectUrl = profile
          ? `${origin}${returnUrl}`
          : `${origin}/onboarding`;

        const response = NextResponse.redirect(redirectUrl);
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
        return response;
      }
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
