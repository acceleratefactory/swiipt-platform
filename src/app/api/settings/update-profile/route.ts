import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { fullName, phone, country } = await request.json();

  const { error } = await supabase
    .from("users")
    .update({ full_name: fullName, phone, country_of_residence: country })
    .eq("id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from("activity_log").insert({
    user_id: user.id,
    event_type: "profile_updated",
    event_data: { full_name: fullName, phone, country_of_residence: country },
  });

  return NextResponse.json({ success: true });
}
