import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { moduleId } = await request.json();
    if (!moduleId) {
      return NextResponse.json({ error: "moduleId required" }, { status: 400 });
    }

    const { data: module } = await supabase
      .from("affiliate_modules")
      .select("id, points_on_completion")
      .eq("id", moduleId)
      .single();

    if (!module) {
      return NextResponse.json({ error: "Module not found" }, { status: 404 });
    }

    const { data: existing } = await supabase
      .from("affiliate_module_progress")
      .select("id, completed_at")
      .eq("user_id", user.id)
      .eq("module_id", moduleId)
      .single();

    if (existing?.completed_at) {
      return NextResponse.json({ success: true, alreadyCompleted: true });
    }

    const now = new Date().toISOString();
    if (existing) {
      await supabase
        .from("affiliate_module_progress")
        .update({ completed_at: now })
        .eq("id", existing.id);
    } else {
      await supabase
        .from("affiliate_module_progress")
        .insert({ user_id: user.id, module_id: moduleId, completed_at: now, score: module.points_on_completion });
    }

    await supabase.rpc("increment_mobility_score", { points: module.points_on_completion, user_id_input: user.id });

    const { data: statusRow } = await supabase
      .from("affiliate_status")
      .select("id, university_points")
      .eq("user_id", user.id)
      .single();

    if (statusRow) {
      await supabase
        .from("affiliate_status")
        .update({ university_points: (statusRow.university_points || 0) + module.points_on_completion })
        .eq("id", statusRow.id);
    }

    return NextResponse.json({ success: true, pointsEarned: module.points_on_completion });
  } catch (error) {
    console.error("Complete module error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
