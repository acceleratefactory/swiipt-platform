import { NextRequest, NextResponse } from "next/server";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function GET() {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const adminSupabase = createServiceClient();
    const { data: role } = await (adminSupabase as any).from("user_roles").select("role").eq("user_id", user.id).single();
    if (!role || role.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { data: modules, error } = await (adminSupabase as any)
      .from("affiliate_modules")
      .select("*")
      .order("order_in_course", { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ modules: modules || [] });
  } catch (error: any) {
    console.error("Admin list modules error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const adminSupabase = createServiceClient();
    const { data: role } = await (adminSupabase as any).from("user_roles").select("role").eq("user_id", user.id).single();
    if (!role || role.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { title, subtitle, content_type, content_body, duration_minutes, order_in_course, is_free, points_on_completion } = await request.json();

    if (!title || !content_type || !content_body) {
      return NextResponse.json({ error: "title, content_type, and content_body are required" }, { status: 400 });
    }

    const validTypes = ["article", "video", "template"];
    if (!validTypes.includes(content_type)) {
      return NextResponse.json({ error: "content_type must be one of: " + validTypes.join(", ") }, { status: 400 });
    }

    const { data, error } = await (adminSupabase as any)
      .from("affiliate_modules")
      .insert({
        title,
        subtitle: subtitle || "",
        content_type,
        content_body,
        duration_minutes: duration_minutes || 10,
        order_in_course: order_in_course || 0,
        is_free: is_free !== undefined ? is_free : true,
        points_on_completion: points_on_completion || 20,
      })
      .select("id")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true, id: data.id });
  } catch (error: any) {
    console.error("Admin create module error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */
