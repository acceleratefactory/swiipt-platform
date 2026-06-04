import { NextRequest, NextResponse } from "next/server";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: role } = await (supabase as any).from("user_roles").select("role").eq("user_id", user.id).single();
  if (!role || role.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { target, channel, title, body, actionUrl, scheduleTime, destination, category, scoreMin, scoreMax, email } = await request.json();

  if (!title || !body) {
    return NextResponse.json({ error: "Title and body are required" }, { status: 400 });
  }

  // Build user_id list based on target segment
  let userIds: string[] = [];

  if (target === "all") {
    const { data: users } = await supabase.from("users").select("id");
    userIds = users?.map(u => u.id) || [];
  } else if (target === "individual" && email) {
    const { data: userData } = await supabase.from("users").select("id").eq("email", email).single();
    if (userData) userIds = [userData.id];
    else return NextResponse.json({ error: "User not found" }, { status: 404 });
  } else if (target === "destination" && destination) {
    const { data: goals } = await supabase
      .from("savings_goals")
      .select("user_id")
      .eq("destination", destination)
      .eq("status", "active");
      userIds = Array.from(new Set(goals?.map(g => g.user_id) || []));
    } else if (target === "category" && category) {
      const { data: goals } = await supabase
        .from("savings_goals")
        .select("user_id")
        .eq("goal_category", category)
        .eq("status", "active");
      userIds = Array.from(new Set(goals?.map(g => g.user_id) || []));
  } else if (target === "score_range") {
    const query = supabase.from("users").select("id");
    if (scoreMin != null) query.gte("mobility_score", scoreMin);
    if (scoreMax != null) query.lte("mobility_score", scoreMax);
    const { data: users } = await query;
    userIds = users?.map(u => u.id) || [];
  }

  if (userIds.length === 0) {
    return NextResponse.json({ error: "No users match the selected target" }, { status: 400 });
  }

  // Insert notification records (batched)
  const notificationInsert: any[] = userIds.map(uid => ({
    user_id: uid,
    type: "broadcast",
    title,
    body,
    action_url: actionUrl || null,
    target_segment: target,
  }));

  // Insert in batches of 100
  for (let i = 0; i < notificationInsert.length; i += 100) {
    const batch = notificationInsert.slice(i, i + 100);
    const { error: insertError } = await supabase.from("notifications").insert(batch);
    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  // Log broadcast in activity_log
  await supabase.from("activity_log").insert({
    user_id: user.id,
    event_type: "notification_broadcast",
    event_data: { target, channel, title, recipientCount: userIds.length, scheduleTime },
  });

  return NextResponse.json({ success: true, recipientCount: userIds.length });
}
/* eslint-enable @typescript-eslint/no-explicit-any */
