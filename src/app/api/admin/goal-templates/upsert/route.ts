import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: role } = await (supabase as any).from("user_roles").select("role").eq("user_id", user.id).single();
  if (!role || role.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const { id, name, description, category, destination, target_amount_ngn, lock_type, lock_months, icon, segment, related_niche_page_slug, sort_order, is_active } = body;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabaseAny = supabase as any;

  if (id) {
    const { data, error } = await supabaseAny
      .from("goal_templates")
      .update({ name, description, category, destination, target_amount_ngn, lock_type, lock_months, icon, segment, related_niche_page_slug, sort_order, is_active, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data });
  } else {
    const { data, error } = await supabaseAny
      .from("goal_templates")
      .insert({ name, description, category, destination, target_amount_ngn, lock_type, lock_months, icon, segment, related_niche_page_slug, sort_order, is_active })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data });
  }
}
