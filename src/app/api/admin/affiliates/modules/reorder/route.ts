import { NextRequest, NextResponse } from "next/server";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const adminSupabase = createServiceClient();
    const { data: role } = await (adminSupabase as any).from("user_roles").select("role").eq("user_id", user.id).single();
    if (!role || role.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { moduleIds } = await request.json();

    if (!Array.isArray(moduleIds) || moduleIds.length === 0) {
      return NextResponse.json({ error: "moduleIds must be a non-empty array" }, { status: 400 });
    }

    const errors: string[] = [];
    for (let i = 0; i < moduleIds.length; i++) {
      const { error } = await (adminSupabase as any)
        .from("affiliate_modules")
        .update({ order_in_course: i + 1 })
        .eq("id", moduleIds[i]);

      if (error) errors.push(`Module ${moduleIds[i]}: ${error.message}`);
    }

    if (errors.length > 0) {
      return NextResponse.json({ error: "Some modules failed to reorder", details: errors }, { status: 500 });
    }

    return NextResponse.json({ success: true, reordered: moduleIds.length });
  } catch (error: any) {
    console.error("Admin reorder modules error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */
