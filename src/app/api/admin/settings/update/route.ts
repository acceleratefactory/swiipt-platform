import { NextRequest, NextResponse } from "next/server";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: role } = await (supabase as any).from("user_roles").select("role").eq("user_id", user.id).single();
  if (!role || (role.role !== "admin" && role.role !== "case_manager")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { key, value } = await request.json();

  if (!key || value === undefined) {
    return NextResponse.json({ error: "Key and value are required" }, { status: 400 });
  }

  // Get old value
  const { data: existing } = await (supabase as any)
    .from("platform_settings")
    .select("value")
    .eq("key", key)
    .single();

  if (!existing) return NextResponse.json({ error: "Setting not found" }, { status: 404 });

  const oldValue = existing.value;

  // Update
  const { error: updateError } = await (supabase as any)
    .from("platform_settings")
    .update({ value })
    .eq("key", key);

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  // Log to admin_audit_log
  await (supabase as any).from("admin_audit_log").insert({
    admin_id: user.id,
    action: "setting_update",
    entity_type: "platform_settings",
    entity_id: key,
    old_value: oldValue,
    new_value: value,
    details: { key },
  });

  return NextResponse.json({ success: true });
}
/* eslint-enable @typescript-eslint/no-explicit-any */
