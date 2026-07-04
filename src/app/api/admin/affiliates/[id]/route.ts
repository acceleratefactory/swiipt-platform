import { NextRequest, NextResponse } from "next/server";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function GET(
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

    const { data: affiliate, error: affError } = await (adminSupabase as any)
      .from("affiliate_status")
      .select("*, users!inner(id, email, full_name, phone, created_at, referral_code, readiness_score, mobility_score)")
      .eq("user_id", userId)
      .single();

    if (affError || !affiliate) {
      return NextResponse.json({ error: "Affiliate not found" }, { status: 404 });
    }

    const { data: referrals } = await (adminSupabase as any)
      .from("referrals")
      .select("*, referred_user:users!referrals_referred_id_fkey(id, email, full_name, created_at)")
      .eq("referrer_id", userId)
      .order("created_at", { ascending: false });

    const referralIds = (referrals || []).map((r: any) => r.referred_id);

    let conversionOrders: any[] = [];
    if (referralIds.length > 0) {
      const { data: orders } = await (adminSupabase as any)
        .from("service_orders")
        .select("id, user_id, package_id, final_price, status, created_at, service_packages!inner(name, destination)")
        .in("user_id", referralIds)
        .order("created_at", { ascending: false });
      conversionOrders = orders || [];
    }

    const { data: moduleProgress } = await (adminSupabase as any)
      .from("affiliate_module_progress")
      .select("*, affiliate_modules!inner(title, content_type, points_on_completion, order_in_course)")
      .eq("user_id", userId)
      .order("affiliate_modules(order_in_course)", { ascending: true });

    const { data: activityLog } = await (adminSupabase as any)
      .from("activity_log")
      .select("*")
      .eq("user_id", userId)
      .in("event_type", ["affiliate_commission", "affiliate_manual_adjustment", "affiliate_withdrawal_requested", "affiliate_withdrawal_approved", "affiliate_withdrawal_rejected"])
      .order("created_at", { ascending: false })
      .limit(100);

    const { data: withdrawals } = await (adminSupabase as any)
      .from("affiliate_withdrawals")
      .select("*")
      .eq("user_id", userId)
      .order("requested_at", { ascending: false });

    let subAffiliates: any[] = [];
    if (affiliate.tier === "gold" || affiliate.tier === "platinum") {
      const { data: subs } = await (adminSupabase as any)
        .from("users")
        .select("id, email, full_name, created_at, affiliate_status!inner(tier, total_earned_ngn, total_referrals, pending_earnings_ngn)")
        .eq("referred_by", affiliate.users?.referral_code);
      subAffiliates = (subs || []).map((s: any) => ({
        user_id: s.id,
        email: s.email,
        full_name: s.full_name,
        joined_at: s.created_at,
        tier: s.affiliate_status?.tier || "starter",
        total_earned: s.affiliate_status?.total_earned_ngn || 0,
        total_referrals: s.affiliate_status?.total_referrals || 0,
        pending_earnings: s.affiliate_status?.pending_earnings_ngn || 0,
      }));
    }

    return NextResponse.json({
      affiliate: {
        ...affiliate,
        user: affiliate.users,
      },
      referrals: (referrals || []).map((r: any) => ({
        id: r.id,
        referred_user: r.referred_user,
        commission_status: r.commission_status,
        commission_earned: r.commission_earned,
        created_at: r.created_at,
      })),
      conversionOrders: conversionOrders.map((o: any) => ({
        id: o.id,
        user_id: o.user_id,
        package_name: o.service_packages?.name || "Unknown",
        destination: o.service_packages?.destination || "",
        final_price: o.final_price,
        status: o.status,
        created_at: o.created_at,
      })),
      moduleProgress: moduleProgress || [],
      earningsTimeline: activityLog || [],
      withdrawals: withdrawals || [],
      subAffiliates,
    });
  } catch (error: any) {
    console.error("Admin affiliate detail error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */
