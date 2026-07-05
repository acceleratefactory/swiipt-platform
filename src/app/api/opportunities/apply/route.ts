import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const opportunityId = searchParams.get("id");

  if (!opportunityId) {
    return NextResponse.redirect(new URL("/dashboard/opportunities", request.url));
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const serviceSupabase = createServiceClient();

  const { data: opportunity } = await (serviceSupabase as any)
    .from("opportunities")
    .select("id, application_url, title, apply_click_count")
    .eq("id", opportunityId)
    .eq("is_active", true)
    .single();

  if (!opportunity || !opportunity.application_url || opportunity.application_url === "#") {
    return NextResponse.redirect(
      new URL(`/dashboard/opportunities?error=link_unavailable&id=${opportunityId}`, request.url)
    );
  }

  await (serviceSupabase as any)
    .from("opportunities")
    .update({ apply_click_count: (opportunity.apply_click_count || 0) + 1 })
    .eq("id", opportunityId);

  if (user) {
    await (serviceSupabase as any)
      .from("user_opportunity_feed")
      .upsert({
        user_id: user.id,
        opportunity_id: opportunityId,
        is_applied: true,
        applied_at: new Date().toISOString(),
      }, { onConflict: "user_id, opportunity_id" });
  }

  return NextResponse.redirect(opportunity.application_url);
}
