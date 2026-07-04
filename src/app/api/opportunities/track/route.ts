import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { opportunityId, action } = await request.json();
    if (!opportunityId || !["apply", "view"].includes(action)) {
      return NextResponse.json(
        { error: "opportunityId and action (apply|view) are required" },
        { status: 400 }
      );
    }

    if (action === "apply") {
      const { data: opp } = await (supabase as any)
        .from("opportunities")
        .select("apply_click_count")
        .eq("id", opportunityId)
        .single();

      await (supabase as any)
        .from("opportunities")
        .update({ apply_click_count: (opp?.apply_click_count || 0) + 1 })
        .eq("id", opportunityId);

      await (supabase as any).from("user_opportunity_feed").upsert(
        {
          user_id: user.id,
          opportunity_id: opportunityId,
          is_applied: true,
          applied_at: new Date().toISOString(),
        },
        { onConflict: "user_id, opportunity_id" }
      );
    } else {
      const { data: opp } = await (supabase as any)
        .from("opportunities")
        .select("view_count")
        .eq("id", opportunityId)
        .single();

      await (supabase as any)
        .from("opportunities")
        .update({ view_count: (opp?.view_count || 0) + 1 })
        .eq("id", opportunityId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Track error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
