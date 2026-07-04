import { NextRequest, NextResponse } from "next/server";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

const VALID_TYPES = ["article", "video", "template"];

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const adminSupabase = createServiceClient();
    const { data: role } = await (adminSupabase as any).from("user_roles").select("role").eq("user_id", user.id).single();
    if (!role || role.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const moduleId = params.id;
    const body = await request.json();

    const updates: Record<string, any> = {};
    if (body.title !== undefined) updates.title = body.title;
    if (body.subtitle !== undefined) updates.subtitle = body.subtitle;
    if (body.content_type !== undefined) {
      if (!VALID_TYPES.includes(body.content_type)) {
        return NextResponse.json({ error: "content_type must be one of: " + VALID_TYPES.join(", ") }, { status: 400 });
      }
      updates.content_type = body.content_type;
    }
    if (body.content_body !== undefined) updates.content_body = body.content_body;
    if (body.duration_minutes !== undefined) updates.duration_minutes = body.duration_minutes;
    if (body.order_in_course !== undefined) updates.order_in_course = body.order_in_course;
    if (body.is_free !== undefined) updates.is_free = body.is_free;
    if (body.points_on_completion !== undefined) updates.points_on_completion = body.points_on_completion;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const { error } = await (adminSupabase as any)
      .from("affiliate_modules")
      .update(updates)
      .eq("id", moduleId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Admin update module error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
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

    const moduleId = params.id;

    const { count: progressCount } = await (adminSupabase as any)
      .from("affiliate_module_progress")
      .select("*", { count: "exact", head: true })
      .eq("module_id", moduleId);

    if (progressCount > 0) {
      return NextResponse.json({
        error: "Cannot delete module with existing progress records",
        progressCount,
      }, { status: 409 });
    }

    const { error } = await (adminSupabase as any)
      .from("affiliate_modules")
      .delete()
      .eq("id", moduleId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Admin delete module error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */
