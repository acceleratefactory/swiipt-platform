import { NextRequest, NextResponse } from "next/server";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const adminSupabase = createServiceClient();
    const { data: role } = await (adminSupabase as any).from("user_roles").select("role").eq("user_id", user.id).single();
    if (!role || role.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const userId = params.id;

    const { data: current } = await (adminSupabase as any)
      .from("affiliate_status")
      .select("custom_affiliate_code")
      .eq("user_id", userId)
      .single();

    if (!current) {
      return NextResponse.json({ error: "Affiliate not found" }, { status: 404 });
    }

    const oldCode = current.custom_affiliate_code;
    const newCode = `AFF-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;

    const { error: updateError } = await (adminSupabase as any)
      .from("affiliate_status")
      .update({ custom_affiliate_code: newCode })
      .eq("user_id", userId);

    if (updateError) {
      if (updateError.code === "23505") {
        return NextResponse.json({ error: "Generated code conflicts, try again" }, { status: 409 });
      }
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    await (adminSupabase as any).from("admin_audit_log").insert({
      admin_id: user.id,
      action: "affiliate_code_reset",
      target_user_id: userId,
      previous_value: oldCode,
      new_value: newCode,
    });

    return NextResponse.json({ success: true, oldCode, newCode });
  } catch (error: any) {
    console.error("Admin reset code error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */
