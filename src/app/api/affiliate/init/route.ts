import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: existing } = await supabase
      .from("affiliate_status")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (existing) {
      return NextResponse.json({ status: existing });
    }

    const code = `AFF-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
    const service = createServiceClient();
    const { data, error } = await service
      .from("affiliate_status")
      .insert({ user_id: user.id, custom_affiliate_code: code, tier_upgraded_at: null, custom_landing_page_slug: null, tracking_pixel_code: null, monthly_rank: null, all_time_rank: null })
      .select("*")
      .single();

    if (error) {
      if (error.code === "23505") {
        const retryCode = `AFF-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
        const { data: retryData, error: retryError } = await service
          .from("affiliate_status")
          .insert({ user_id: user.id, custom_affiliate_code: retryCode, tier_upgraded_at: null, custom_landing_page_slug: null, tracking_pixel_code: null, monthly_rank: null, all_time_rank: null })
          .select("*")
          .single();
        if (retryError) throw retryError;
        return NextResponse.json({ status: retryData });
      }
      throw error;
    }

    return NextResponse.json({ status: data });
  } catch (error) {
    console.error("Affiliate init error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
