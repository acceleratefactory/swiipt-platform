import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: role } = await (supabase as any).from("user_roles").select("role").eq("user_id", user.id).single();
  if (!role || role.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const { data: opp } = await (supabase as any)
    .from("opportunities")
    .select("is_active")
    .eq("id", id)
    .single();

  if (!opp) return NextResponse.json({ error: "Opportunity not found" }, { status: 404 });

  const newActive = !opp.is_active;
  await (supabase as any).from("opportunities").update({ is_active: newActive }).eq("id", id);

  return NextResponse.json({ is_active: newActive });
}
