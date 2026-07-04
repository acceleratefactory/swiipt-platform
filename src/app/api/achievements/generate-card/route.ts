import { NextRequest, NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  if (request.headers.get("x-internal-secret") !== process.env.INTERNAL_API_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId, cardType, data } = await request.json();
  if (!userId || !cardType) {
    return NextResponse.json({ error: "userId and cardType required" }, { status: 400 });
  }

  const adminSupabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const cardTitles: Record<string, (d: any) => string> = {
    goal_created: (d) => `I started saving toward ${d.goalName}`,
    milestone_25: (d) => `25% funded — ${d.goalName}`,
    milestone_50: (d) => `Halfway there — ${d.goalName}`,
    milestone_75: (_d) => `75% funded — almost ready to move!`,
    goal_funded: (d) => `${d.goalName} — fully funded!`,
    service_ordered: (d) => `My ${d.serviceName} application has started`,
    service_completed: (d) => `I just completed my ${d.serviceName} 🎉`,
    visa_approved: (d) => `Visa approved — I'm moving to ${d.destination}`,
    certificate_issued: (d) => `I just got my Swiipt ${d.certificateType}`,
    joined_swiipt: () => `I just joined Swiipt — planning my move abroad`,
    readiness_score: (d) => `My relocation readiness score is ${d.score}/100`,
  };

  const titleFn = cardTitles[cardType];
  if (!titleFn) return NextResponse.json({ error: "Unknown card type" }, { status: 400 });

  const title = titleFn(data);
  const subtitle = data?.subtitle || "Swiipt — Plan, fund, and execute your global move";

  const { data: card } = await adminSupabase
    .from("achievement_cards")
    .insert({ user_id: userId, card_type: cardType, title, subtitle, data })
    .select()
    .single();

  return NextResponse.json({ card });
}
