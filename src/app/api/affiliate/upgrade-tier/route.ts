import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(_request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await (supabase as any).rpc("check_and_upgrade_tier", { user_id_input: user.id });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, newTier: data });
  } catch (error) {
    console.error("Upgrade tier error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
