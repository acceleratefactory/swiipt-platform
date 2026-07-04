import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: role } = await (supabase as any).from("user_roles").select("role").eq("user_id", user.id).single();
  if (!role || role.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { title, description, rewardType, rewardAmountNgn, rewardPerInvite, invitesTarget, requiresSegment, minReadinessScore, startsAt, endsAt, maxParticipants } = await request.json();

  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).from("viral_campaigns").insert({
    title,
    description: description || null,
    reward_type: rewardType || "fixed",
    reward_amount_ngn: rewardAmountNgn || 0,
    reward_per_invite: rewardPerInvite || false,
    invites_target: invitesTarget || null,
    requires_segment: requiresSegment || null,
    min_readiness_score: minReadinessScore || 0,
    starts_at: startsAt || new Date().toISOString(),
    ends_at: endsAt || null,
    max_participants: maxParticipants || null,
    is_active: true,
  }).select("id").single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, id: data.id });
}
