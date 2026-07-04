import { NextRequest, NextResponse } from "next/server";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

const VALID_TIERS = ["starter", "bronze", "silver", "gold", "platinum"];

export async function POST(
  request: NextRequest,
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
    const { tier } = await request.json();

    if (!tier || !VALID_TIERS.includes(tier)) {
      return NextResponse.json({ error: "Invalid tier. Must be one of: " + VALID_TIERS.join(", ") }, { status: 400 });
    }

    const { data: current } = await (adminSupabase as any)
      .from("affiliate_status")
      .select("tier")
      .eq("user_id", userId)
      .single();

    if (!current) {
      return NextResponse.json({ error: "Affiliate not found" }, { status: 404 });
    }

    const previousTier = current.tier;

    const { error: updateError } = await (adminSupabase as any)
      .from("affiliate_status")
      .update({ tier })
      .eq("user_id", userId);

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

    await (adminSupabase as any).from("admin_audit_log").insert({
      admin_id: user.id,
      action: "affiliate_tier_change",
      target_user_id: userId,
      previous_value: previousTier,
      new_value: tier,
    });

    return NextResponse.json({ success: true, previousTier, newTier: tier });
  } catch (error: any) {
    console.error("Admin update tier error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */
