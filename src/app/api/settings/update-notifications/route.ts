import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { key, inApp, email } = await request.json();

  if (!key || typeof inApp !== "boolean" || typeof email !== "boolean") {
    return NextResponse.json({ error: "key, inApp (boolean), and email (boolean) are required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("user_preferences")
    .upsert(
      {
        user_id: user.id,
        preference_key: key,
        in_app: inApp,
        email: email,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id, preference_key" }
    );

  if (error) {
    console.error("Failed to save notification preference:", error);
    return NextResponse.json({ error: "Failed to save preference" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function GET(_request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: prefs, error } = await supabase
    .from("user_preferences")
    .select("preference_key, in_app, email")
    .eq("user_id", user.id);

  if (error) {
    console.error("Failed to fetch notification preferences:", error);
    return NextResponse.json({ error: "Failed to fetch preferences" }, { status: 500 });
  }

  const result: Record<string, { inApp: boolean; email: boolean }> = {};
  (prefs || []).forEach((p) => {
    result[p.preference_key] = { inApp: p.in_app, email: p.email };
  });

  return NextResponse.json({ preferences: result });
}
