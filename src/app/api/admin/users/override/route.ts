import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: role } = await (supabase as any).from("user_roles").select("role").eq("user_id", user.id).single();
  if (!role || (role.role !== "admin" && role.role !== "case_manager")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { action, targetUserId, note, payload } = await request.json();

  if (!note || !note.trim()) {
    return NextResponse.json({ error: "Mandatory note is required" }, { status: 400 });
  }

  if (!action || !targetUserId) {
    return NextResponse.json({ error: "action and targetUserId are required" }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let previousValue: any = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let newValue: any = null;

  try {
    switch (action) {
      case "adjust_balance": {
        const { goalId, amount: adjustAmount } = payload;
        if (!goalId || !adjustAmount) throw new Error("goalId and amount required");
        const { data: goal } = await supabase.from("savings_goals").select("current_balance").eq("id", goalId).single();
        previousValue = { current_balance: goal?.current_balance };
        const newBalance = (goal?.current_balance || 0) + Number(adjustAmount);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any).from("savings_goals").update({ current_balance: newBalance }).eq("id", goalId);
        newValue = { current_balance: newBalance };
        break;
      }

      case "unlock_milestone": {
        const { goalId: mGoalId, milestone } = payload;
        if (!mGoalId || !milestone) throw new Error("goalId and milestone required");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sgSupabase = supabase as any;
        switch (Number(milestone)) {
          case 25: await sgSupabase.from("savings_goals").update({ milestone_25_unlocked: true }).eq("id", mGoalId); break;
          case 50: await sgSupabase.from("savings_goals").update({ milestone_50_unlocked: true }).eq("id", mGoalId); break;
          case 75: await sgSupabase.from("savings_goals").update({ milestone_75_unlocked: true }).eq("id", mGoalId); break;
          case 100: await sgSupabase.from("savings_goals").update({ milestone_100_unlocked: true }).eq("id", mGoalId); break;
        }
        newValue = { milestone_unlocked: milestone };
        break;
      }

      case "add_score": {
        const { points: addPoints } = payload;
        if (!addPoints) throw new Error("points required");
        const { data: userData } = await supabase.from("users").select("mobility_score").eq("id", targetUserId).single();
        previousValue = { mobility_score: userData?.mobility_score };
        const newScore = (userData?.mobility_score || 0) + Number(addPoints);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any).from("users").update({ mobility_score: newScore }).eq("id", targetUserId);
        newValue = { mobility_score: newScore };
        break;
      }

      case "award_credit": {
        const { amount: creditAmount } = payload;
        if (!creditAmount) throw new Error("amount required");
        const { data: wallet } = await supabase.from("wallets").select("total_credits_ngn").eq("user_id", targetUserId).single();
        previousValue = { total_credits_ngn: wallet?.total_credits_ngn };
        const newCredits = (wallet?.total_credits_ngn || 0) + Number(creditAmount);
        await supabase.from("wallets").update({ total_credits_ngn: newCredits }).eq("user_id", targetUserId);
        newValue = { total_credits_ngn: newCredits };
        break;
      }

      case "send_notification": {
        const { message: notifMessage } = payload;
        if (!notifMessage) throw new Error("message required");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any).from("notifications").insert({
          user_id: targetUserId,
          type: "admin_direct",
          title: "Admin message",
          body: notifMessage,
          is_read: false,
        });
        newValue = { notification_body: notifMessage };
        break;
      }

      case "set_alumni": {
        const { data: userData } = await supabase.from("users").select("alumni_status").eq("id", targetUserId).single();
        previousValue = { alumni_status: userData?.alumni_status };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any).from("users").update({ alumni_status: true }).eq("id", targetUserId);
        newValue = { alumni_status: true };
        break;
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message || "Action failed" }, { status: 500 });
  }

  // Audit log
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).from("admin_audit_log").insert({
    admin_id: user.id,
    action,
    target_table: "users",
    target_record_id: targetUserId,
    target_user_id: targetUserId,
    previous_value: previousValue ? JSON.stringify(previousValue) : null,
    new_value: newValue ? JSON.stringify(newValue) : null,
    notes: note,
  });

  return NextResponse.json({ success: true });
}
