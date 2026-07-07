import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

const ADMIN_SUPABASE = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ ok: true });

    const { adId } = await request.json();
    if (!adId) return NextResponse.json({ ok: true });

    const { data: ad } = await ADMIN_SUPABASE
      .from("feed_ads")
      .select("impression_count")
      .eq("id", adId)
      .single();

    if (ad) {
      await ADMIN_SUPABASE
        .from("feed_ads")
        .update({ impression_count: (ad.impression_count || 0) + 1 })
        .eq("id", adId);
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
