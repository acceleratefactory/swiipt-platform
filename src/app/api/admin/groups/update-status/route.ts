import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

const validGroupTransitions: Record<string, string[]> = {
  open: ["expired", "cancelled"],
  filled: ["completed", "cancelled"],
  expired: [],
  completed: [],
  cancelled: [],
};

const validMemberStatusTransitions: Record<string, string[]> = {
  committed: ["withdrawn"],
  pending_payment: ["paid", "withdrawn"],
  paid: [],
  withdrawn: [],
};

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const adminSupabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: role } = await (adminSupabase as any)
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .single();
  if (!role || (role.role !== "admin" && role.role !== "case_manager")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { groupId, newStatus, memberId, newMemberStatus } = await request.json();

  if (!groupId) {
    return NextResponse.json({ error: "groupId is required." }, { status: 400 });
  }

  // Group status transition
  if (newStatus) {
    const { data: group } = await (adminSupabase as any)
      .from("group_buys")
      .select("status, title, creator_id")
      .eq("id", groupId)
      .single();

    if (!group) {
      return NextResponse.json({ error: "Group not found." }, { status: 404 });
    }

    const allowed = validGroupTransitions[group.status] || [];
    if (!allowed.includes(newStatus)) {
      return NextResponse.json({ error: `Cannot transition from ${group.status} to ${newStatus}.` }, { status: 400 });
    }

    const now = new Date().toISOString();
    const updateData: Record<string, any> = { status: newStatus, updated_at: now };
    if (newStatus === "expired") updateData.expires_at = now;

    await (adminSupabase as any).from("group_buys").update(updateData).eq("id", groupId);
    await (adminSupabase as any).from("admin_audit_log").insert({
      admin_id: user.id,
      action_type: `group_${newStatus}`,
      target_user_id: group.creator_id,
      target_record_id: groupId,
      target_table: "group_buys",
      previous_value: group.status,
      new_value: newStatus,
    });

    if (newStatus === "cancelled" || newStatus === "expired") {
      const { data: members } = await (adminSupabase as any)
        .from("group_buy_members")
        .select("user_id")
        .eq("group_buy_id", groupId);

      if (members) {
        const notifications = members.map((m: any) => ({
          user_id: m.user_id,
          type: `group_${newStatus}`,
          title: newStatus === "cancelled" ? "Group cancelled" : "Group expired",
          body: `Your group "${group.title}" has been ${newStatus} by an admin.`,
          action_url: "/dashboard/groups",
        }));
        await (adminSupabase as any).from("notifications").insert(notifications);
      }
    }

    return NextResponse.json({ success: true });
  }

  // Member status transition
  if (memberId && newMemberStatus) {
    const { data: member } = await (adminSupabase as any)
      .from("group_buy_members")
      .select("status, user_id, group_buy_id, order_id, booking_id")
      .eq("id", memberId)
      .single();

    if (!member) {
      return NextResponse.json({ error: "Member not found." }, { status: 404 });
    }

    const allowed = validMemberStatusTransitions[member.status] || [];
    if (!allowed.includes(newMemberStatus)) {
      return NextResponse.json({ error: `Cannot transition member from ${member.status} to ${newMemberStatus}.` }, { status: 400 });
    }

    await (adminSupabase as any).from("group_buy_members").update({ status: newMemberStatus }).eq("id", memberId);

    if (newMemberStatus === "withdrawn") {
      const { data: grp } = await (adminSupabase as any)
        .from("group_buys")
        .select("current_size")
        .eq("id", member.group_buy_id)
        .single();
      if (grp) {
        await (adminSupabase as any)
          .from("group_buys")
          .update({ current_size: Math.max(0, grp.current_size - 1), updated_at: new Date().toISOString() })
          .eq("id", member.group_buy_id);
      }
    }

    if (newMemberStatus === "paid") {
      await (adminSupabase as any)
        .from("group_buy_members")
        .update({ paid_at: new Date().toISOString() })
        .eq("id", memberId);

      const { data: allMembers } = await (adminSupabase as any)
        .from("group_buy_members")
        .select("status")
        .eq("group_buy_id", member.group_buy_id);

      const allPaid = allMembers?.every((m: any) => m.status === "paid");
      if (allPaid) {
        await (adminSupabase as any)
          .from("group_buys")
          .update({ status: "completed", updated_at: new Date().toISOString() })
          .eq("id", member.group_buy_id);
      }

      if (member.order_id) {
        await (adminSupabase as any)
          .from("service_orders")
          .update({ status: "payment_confirmed" })
          .eq("id", member.order_id);
      }
      if (member.booking_id) {
        await (adminSupabase as any)
          .from("holiday_bookings")
          .update({ status: "confirmed" })
          .eq("id", member.booking_id);
      }
    }

    await (adminSupabase as any).from("admin_audit_log").insert({
      admin_id: user.id,
      action_type: `member_${newMemberStatus}`,
      target_user_id: member.user_id,
      target_record_id: memberId,
      target_table: "group_buy_members",
      previous_value: member.status,
      new_value: newMemberStatus,
    });

    const memberNotificationTitles: Record<string, string> = {
      paid: "Payment confirmed ✓",
    };
    const memberNotificationBodies: Record<string, string> = {
      paid: "Your group buy payment has been confirmed by an admin.",
    };

    await (adminSupabase as any).from("notifications").insert({
      user_id: member.user_id,
      type: `member_${newMemberStatus}`,
      title: memberNotificationTitles[newMemberStatus] || "Membership updated",
      body: memberNotificationBodies[newMemberStatus] || `Your membership in the group has been updated to ${newMemberStatus.replace(/_/g, " ")} by an admin.`,
      action_url: "/dashboard/groups",
    });

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "No action specified." }, { status: 400 });
}
