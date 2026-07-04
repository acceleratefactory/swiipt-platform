import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { firstName, photoUrl, destinationCountry, serviceCompleted, journeyDuration, approximateCostRange, hardestPart, advice, openToContact } = await request.json();

  if (!firstName || !destinationCountry || !serviceCompleted || !advice) {
    return NextResponse.json({ error: "firstName, destinationCountry, serviceCompleted, and advice are required" }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: story } = await (supabase as any)
    .from("success_stories")
    .insert({
      user_id: user.id,
      first_name: firstName,
      photo_url: photoUrl || null,
      destination_country: destinationCountry,
      service_completed: serviceCompleted,
      journey_duration: journeyDuration || null,
      approximate_cost_range: approximateCostRange || null,
      hardest_part: hardestPart || null,
      advice,
      open_to_contact: openToContact || false,
      status: "pending",
    })
    .select()
    .single();

  // Fire achievement card
  fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/achievements/generate-card`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-internal-secret": process.env.INTERNAL_API_SECRET || "" },
    body: JSON.stringify({
      userId: user.id,
      cardType: "goal_funded",
      data: {
        goalName: `Success story — ${destinationCountry}`,
        subtitle: "Shared their relocation journey on Swiipt",
      },
    }),
  }).catch(() => {});

  // Admin notification
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).from("notifications").insert({
    user_id: null,
    type: "success_story_submitted",
    title: "New success story",
    body: `${firstName} shared their story about moving to ${destinationCountry}`,
    action_url: "/admin/success-stories",
    target_segment: null,
  });

  return NextResponse.json({ story });
}
