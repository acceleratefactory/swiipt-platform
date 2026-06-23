import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const adminSupabase = createServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: role } = await (adminSupabase as any).from("user_roles").select("role").eq("user_id", user.id).single();
  if (!role || role.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { type, id, meta_title, meta_description, og_image_url } = await request.json();

  if (!type || !id) return NextResponse.json({ error: "type and id required" }, { status: 400 });
  if (!["niche_pages", "resource_guides"].includes(type)) return NextResponse.json({ error: "Invalid type" }, { status: 400 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabaseAny = adminSupabase as any;

  const { error: updateError } = await supabaseAny
    .from(type)
    .update({ meta_title, meta_description, og_image_url, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  await supabaseAny.from("admin_audit_log").insert({
    admin_id: user.id,
    action: "seo_update",
    table_name: type,
    record_id: id,
    details: { meta_title, meta_description, og_image_url },
  });

  return NextResponse.json({ success: true });
}
