import { NextRequest, NextResponse } from "next/server";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const adminSupabase = createServiceClient();
    const { data: role } = await (adminSupabase as any).from("user_roles").select("role").eq("user_id", user.id).single();
    if (!role || role.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const tier = searchParams.get("tier");
    const search = searchParams.get("search");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const offset = (page - 1) * limit;

    let query = (adminSupabase as any)
      .from("affiliate_status")
      .select("*, users!inner(id, email, full_name, created_at)", { count: "exact" });

    if (tier && tier !== "all") {
      query = query.eq("tier", tier);
    }

    if (search) {
      query = query.or(`users.full_name.ilike.%${search}%,users.email.ilike.%${search}%,custom_affiliate_code.ilike.%${search}%`);
    }

    const { data: affiliates, count: total, error } = await query
      .order("total_earned_ngn", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const { data: allTiers } = await (adminSupabase as any)
      .from("affiliate_status")
      .select("tier, pending_earnings_ngn, withdrawn_earnings_ngn");

    const tiers: Record<string, number> = {};
    let totalPendingEarnings = 0;
    let totalWithdrawn = 0;

    if (allTiers) {
      for (const row of allTiers) {
        tiers[row.tier] = (tiers[row.tier] || 0) + 1;
        totalPendingEarnings += Number(row.pending_earnings_ngn) || 0;
        totalWithdrawn += Number(row.withdrawn_earnings_ngn) || 0;
      }
    }

    return NextResponse.json({
      affiliates: affiliates || [],
      total: total || 0,
      page,
      limit,
      tiers,
      totalPendingEarnings,
      totalWithdrawn,
    });
  } catch (error: any) {
    console.error("Admin affiliates list error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */
