import { NextRequest, NextResponse } from "next/server";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const adminSupabase = createServiceClient();
    const { data: role } = await (adminSupabase as any).from("user_roles").select("role").eq("user_id", user.id).single();
    if (!role || role.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { periodKey } = await request.json();
    if (!periodKey) return NextResponse.json({ error: "periodKey required" }, { status: 400 });

    const { data: deleted, error } = await (adminSupabase as any)
      .from("leaderboard_entries")
      .delete()
      .eq("period_key", periodKey)
      .select("id");

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await (adminSupabase as any).from("admin_audit_log").insert({
      admin_id: user.id,
      action: "leaderboard_monthly_reset",
      target_user_id: null,
      notes: `Reset monthly leaderboard for period "${periodKey}" — removed ${deleted?.length || 0} entries`,
    });

    return NextResponse.json({ success: true, removed: deleted?.length || 0 });
  } catch (error: any) {
    console.error("Admin leaderboard reset error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */
