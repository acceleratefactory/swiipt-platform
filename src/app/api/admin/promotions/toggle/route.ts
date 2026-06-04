import { NextRequest, NextResponse } from "next/server";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: role } = await (supabase as any).from("user_roles").select("role").eq("user_id", user.id).single();
  if (!role || role.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id, action } = await request.json();

  if (!id) return NextResponse.json({ error: "Promotion ID required" }, { status: 400 });

  if (action === "toggle") {
    const { data: promo } = await (supabase as any).from("promotions").select("status").eq("id", id).single();
    if (!promo) return NextResponse.json({ error: "Promotion not found" }, { status: 404 });
    const newStatus = promo.status === "active" ? "paused" : "active";
    const { error } = await (supabase as any).from("promotions").update({ status: newStatus }).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, status: newStatus });
  }

  if (action === "end_now") {
    const { error } = await (supabase as any).from("promotions").update({ status: "ended" }).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, status: "ended" });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
/* eslint-enable @typescript-eslint/no-explicit-any */
