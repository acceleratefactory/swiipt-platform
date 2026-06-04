import { NextRequest, NextResponse } from "next/server";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { groupId, title, body } = await request.json();

  if (!groupId || !title || !body) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const { data: membership } = await (supabase as any)
    .from("community_memberships")
    .select("id")
    .eq("user_id", user.id)
    .eq("group_id", groupId)
    .single();

  if (!membership) return NextResponse.json({ error: "Not a member of this group" }, { status: 403 });

  const { error } = await (supabase as any).from("community_threads").insert({
    group_id: groupId,
    author_id: user.id,
    title,
    body,
    reply_count: 0,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
/* eslint-enable @typescript-eslint/no-explicit-any */
