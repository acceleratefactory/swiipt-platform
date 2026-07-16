import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { opportunityId, saved } = await request.json();
    if (!opportunityId) {
      return NextResponse.json({ error: "opportunityId is required" }, { status: 400 });
    }

    const isSaved = saved !== false;

    const { error } = await (supabase as any).from("user_opportunity_feed").upsert(
      {
        user_id: user.id,
        opportunity_id: opportunityId,
        is_saved: isSaved,
        saved_at: isSaved ? new Date().toISOString() : null,
      },
      { onConflict: "user_id, opportunity_id" }
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, is_saved: isSaved });
  } catch (error) {
    console.error("Save error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
