import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const serviceClient = createServiceClient();

  const { groupBuyId } = await request.json();

  if (!groupBuyId) {
    return NextResponse.json({ error: "groupBuyId is required." }, { status: 400 });
  }

  const { data: groupBuy } = await (serviceClient as any)
    .from("group_buys")
    .select("*")
    .eq("id", groupBuyId)
    .single();

  if (!groupBuy) {
    return NextResponse.json({ error: "Group not found." }, { status: 404 });
  }

  if (groupBuy.status !== "open") {
    return NextResponse.json({ error: "Can only leave a group that is still open." }, { status: 400 });
  }

  const { data: membership } = await (serviceClient as any)
    .from("group_buy_members")
    .select("*")
    .eq("group_buy_id", groupBuyId)
    .eq("user_id", user.id)
    .single();

  if (!membership) {
    return NextResponse.json({ error: "You are not a member of this group." }, { status: 404 });
  }

  await (serviceClient as any)
    .from("group_buy_members")
    .update({ status: "withdrawn" })
    .eq("id", membership.id);

  if (membership.role === "creator") {
    const { data: otherMembers } = await (serviceClient as any)
      .from("group_buy_members")
      .select("*")
      .eq("group_buy_id", groupBuyId)
      .eq("status", "committed")
      .neq("id", membership.id)
      .order("joined_at", { ascending: true })
      .limit(1);

    if (otherMembers && otherMembers.length > 0) {
      await (serviceClient as any)
        .from("group_buy_members")
        .update({ role: "creator" })
        .eq("id", otherMembers[0].id);

      await (serviceClient as any)
        .from("group_buys")
        .update({
          current_size: groupBuy.current_size - 1,
          creator_id: otherMembers[0].user_id,
        })
        .eq("id", groupBuyId);

      await (serviceClient as any).from("notifications").insert({
        user_id: otherMembers[0].user_id,
        type: "group_buy_creator_transferred",
        title: "You are now the group organizer",
        body: `The original organizer left "${groupBuy.title}". You are now the organizer.`,
        action_url: `/dashboard/groups/${groupBuy.id}`,
      });

      return NextResponse.json({
        success: true,
        action: "creator_transferred",
        message: "You left the group. Another member is now the organizer.",
      });
    } else {
      await (serviceClient as any)
        .from("group_buys")
        .update({ status: "cancelled", current_size: 0 })
        .eq("id", groupBuyId);

      const { data: members } = await (serviceClient as any)
        .from("group_buy_members")
        .select("user_id")
        .eq("group_buy_id", groupBuyId)
        .eq("status", "committed");

      if (members && members.length > 0) {
        await (serviceClient as any).from("notifications").insert(
          members.map((m: any) => ({
            user_id: m.user_id,
            type: "group_buy_cancelled",
            title: "Group cancelled",
            body: `"${groupBuy.title}" has been cancelled because the organizer left.`,
            action_url: "/dashboard/groups",
          }))
        );
      }

      return NextResponse.json({
        success: true,
        action: "cancelled",
        message: "You were the only member. The group has been cancelled.",
      });
    }
  }

  await (serviceClient as any)
    .from("group_buys")
    .update({ current_size: groupBuy.current_size - 1 })
    .eq("id", groupBuyId);

  await (serviceClient as any).from("notifications").insert({
    user_id: groupBuy.creator_id,
    type: "group_buy_member_left",
    title: "Someone left your group",
    body: `A member left "${groupBuy.title}". ${groupBuy.current_size - 1}/${groupBuy.target_size} members remaining.`,
    action_url: `/dashboard/groups/${groupBuy.id}`,
  });

  return NextResponse.json({
    success: true,
    action: "left",
    message: "You have left the group.",
  });
}
