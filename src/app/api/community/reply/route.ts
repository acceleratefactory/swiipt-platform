import { NextRequest, NextResponse } from "next/server";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { threadId, body } = await request.json();

  if (!threadId || !body) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const { data: thread } = await (supabase as any)
    .from("community_threads")
    .select("group_id")
    .eq("id", threadId)
    .single();

  if (!thread) return NextResponse.json({ error: "Thread not found" }, { status: 404 });

  const { data: membership } = await (supabase as any)
    .from("community_memberships")
    .select("id")
    .eq("user_id", user.id)
    .eq("group_id", thread.group_id)
    .single();

  if (!membership) return NextResponse.json({ error: "Not a member of this group" }, { status: 403 });

  const { error: replyError } = await (supabase as any).from("community_replies").insert({
    thread_id: threadId,
    author_id: user.id,
    body,
  });

  if (replyError) return NextResponse.json({ error: replyError.message }, { status: 500 });

  // Increment reply count
  const { data: currentThread } = await (supabase as any)
    .from("community_threads")
    .select("reply_count")
    .eq("id", threadId)
    .single();
  
  if (currentThread) {
    await (supabase as any)
      .from("community_threads")
      .update({ reply_count: (currentThread.reply_count || 0) + 1 })
      .eq("id", threadId);
  }

  return NextResponse.json({ success: true });
}
/* eslint-enable @typescript-eslint/no-explicit-any */
