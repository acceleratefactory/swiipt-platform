import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(_request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("career_profiles")
      .select("segment_slug")
      .eq("user_id", user.id)
      .single();

    if (!profile?.segment_slug) {
      return NextResponse.json({ error: "No career profile found" }, { status: 400 });
    }

    const { data: freshOpps } = await supabase
      .from("opportunities")
      .select("*")
      .eq("segment_slug", profile.segment_slug)
      .eq("is_active", true)
      .gt("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    return NextResponse.json({
      fresh: freshOpps || [],
      count: freshOpps?.length || 0,
    });
  } catch (error) {
    console.error("Refresh error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
