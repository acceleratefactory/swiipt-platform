import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = request.nextUrl.searchParams.get("userId");
  if (!userId || userId !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const cardEmojiMap: Record<string, string> = {
    goal_created: "🎯",
    milestone_25: "💪",
    milestone_50: "🔥",
    milestone_75: "🚀",
    goal_funded: "🎉",
    service_ordered: "📋",
    service_completed: "✅",
    visa_approved: "🛂",
    certificate_issued: "📜",
    joined_swiipt: "👋",
    readiness_score: "📊",
  };

  const { data: cards } = await supabase
    .from("achievement_cards")
    .select("*")
    .eq("user_id", userId)
    .eq("is_dismissed", false)
    .order("created_at", { ascending: false })
    .limit(10);

  return NextResponse.json({
    cards: (cards || []).map((c) => ({ ...c, emoji: cardEmojiMap[c.card_type] || "🏆" })),
  });
}
