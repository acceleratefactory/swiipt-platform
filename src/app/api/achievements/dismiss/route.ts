import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { cardId } = await request.json();
  if (!cardId) return NextResponse.json({ error: "cardId required" }, { status: 400 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from("achievement_cards")
    .update({ is_dismissed: true })
    .eq("id", cardId)
    .eq("user_id", user.id);

  return NextResponse.json({ success: true });
}
