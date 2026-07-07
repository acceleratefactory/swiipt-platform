import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: role } = await (supabase as any).from("user_roles").select("role").eq("user_id", user.id).single();
  if (!role || role.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const { action, notes } = body;

  if (!action || !["approve", "reject", "request_changes"].includes(action)) {
    return NextResponse.json({ error: "action must be approve, reject, or request_changes" }, { status: 400 });
  }

  const { data: opp } = await (supabase as any)
    .from("opportunities")
    .select("id, needs_review")
    .eq("id", params.id)
    .single();

  if (!opp) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (action === "approve") {
    const { error } = await (supabase as any)
      .from("opportunities")
      .update({ needs_review: false, review_reason: null })
      .eq("id", params.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else if (action === "reject") {
    const { error } = await (supabase as any)
      .from("opportunities")
      .update({ is_active: false, needs_review: false, review_reason: notes || "Rejected by admin" })
      .eq("id", params.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    const { error } = await (supabase as any)
      .from("opportunities")
      .update({ needs_review: true, review_reason: notes || "Changes requested" })
      .eq("id", params.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
