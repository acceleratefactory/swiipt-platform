import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: role } = await (supabase as any).from("user_roles").select("role").eq("user_id", user.id).single();
  if (!role || role.role !== "admin") {
    return NextResponse.json({ error: "Forbidden. Only admins can suspend accounts." }, { status: 403 });
  }

  const { targetUserId, note } = await request.json();

  if (!targetUserId) {
    return NextResponse.json({ error: "targetUserId is required" }, { status: 400 });
  }

  if (!note || !note.trim()) {
    return NextResponse.json({ error: "Mandatory note is required" }, { status: 400 });
  }

  // Check if user_roles row exists, upsert
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (supabase as any)
    .from("user_roles")
    .select("role")
    .eq("user_id", targetUserId)
    .single();

  if (existing) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from("user_roles")
      .update({ role: "suspended" })
      .eq("user_id", targetUserId);
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from("user_roles")
      .insert({ user_id: targetUserId, role: "suspended" });
  }

  // Audit log
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).from("admin_audit_log").insert({
    admin_id: user.id,
    action: "suspend_user",
    target_table: "user_roles",
    target_record_id: targetUserId,
    target_user_id: targetUserId,
    previous_value: existing ? JSON.stringify({ role: existing.role }) : null,
    new_value: JSON.stringify({ role: "suspended" }),
    notes: note,
  });

  return NextResponse.json({ success: true });
}
