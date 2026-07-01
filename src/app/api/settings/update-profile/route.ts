import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { fullName, phone, country } = await request.json();

  if (!fullName || fullName.trim().length < 2) {
    return NextResponse.json({ error: "Full name must be at least 2 characters." }, { status: 400 });
  }

  const { error } = await supabase
    .from("users")
    .update({
      full_name: fullName.trim(),
      phone: phone?.trim() || null,
      country_of_residence: country?.trim() || null,
    })
    .eq("id", user.id);

  if (error) {
    console.error("Profile update error:", error);
    return NextResponse.json({ error: "Failed to update profile." }, { status: 500 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  fetch(`${appUrl}/api/readiness/recalculate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  }).catch(() => {});

  return NextResponse.json({ success: true });
}
