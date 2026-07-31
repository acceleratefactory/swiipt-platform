import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const adminSupabase = createServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: role } = await (adminSupabase as any).from("user_roles").select("role").eq("user_id", user.id).single();
  if (!role || role.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = adminSupabase as any;

  const { data: pkg } = await db.from("holiday_packages").select("title, is_active").eq("id", id).single();
  if (!pkg) return NextResponse.json({ error: "Package not found" }, { status: 404 });

  const { count: bookingCount } = await db
    .from("holiday_bookings")
    .select("id", { count: "exact", head: true })
    .eq("package_id", id);
  if (bookingCount && bookingCount > 0) {
    return NextResponse.json({
      error: `Cannot delete — ${bookingCount} booking(s) reference this package. Deactivate it instead.`,
    }, { status: 409 });
  }

  const { count: groupBuyCount } = await db
    .from("group_buys")
    .select("id", { count: "exact", head: true })
    .eq("holiday_package_id", id);
  if (groupBuyCount && groupBuyCount > 0) {
    return NextResponse.json({
      error: `Cannot delete — ${groupBuyCount} group buy(s) reference this package. Deactivate it instead.`,
    }, { status: 409 });
  }

  const { error } = await db.from("holiday_packages").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await db.from("admin_audit_log").insert({
    admin_id: user.id,
    action_type: "holiday_package_deleted",
    target_record_id: id,
    target_table: "holiday_packages",
    previous_value: JSON.stringify({ title: pkg.title, is_active: pkg.is_active }),
    new_value: null,
    note: `Deleted holiday package "${pkg.title}"`,
  });

  return NextResponse.json({ success: true });
}
