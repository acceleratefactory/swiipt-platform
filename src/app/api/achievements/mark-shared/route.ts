import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { cardId, platform } = await request.json();
  if (!cardId || !platform) return NextResponse.json({ error: "cardId and platform required" }, { status: 400 });

  const col = platform === "whatsapp" ? "is_shared_whatsapp" : "is_shared_instagram";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from("achievement_cards")
    .update({ [col]: true })
    .eq("id", cardId)
    .eq("user_id", user.id);

  return NextResponse.json({ success: true });
}
