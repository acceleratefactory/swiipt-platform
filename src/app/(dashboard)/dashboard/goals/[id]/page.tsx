import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import GoalDetailView from "@/components/dashboard/goals/GoalDetailView";

export default async function GoalDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: goal } = await supabase
    .from("savings_goals")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single();

  if (!goal) notFound();

  const { data: deposits } = await supabase
    .from("deposits")
    .select("*")
    .eq("goal_id", params.id)
    .order("created_at", { ascending: false });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: milestoneRewards } = await (supabase as any)
    .from("milestone_rewards")
    .select("*")
    .eq("goal_id", params.id)
    .order("created_at", { ascending: true });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: gifts } = await (supabase as any)
    .from("goal_gifts")
    .select("*, giver:giver_id(full_name), recipient:recipient_id(full_name)")
    .or(`giver_id.eq.${user.id},recipient_id.eq.${user.id}`)
    .eq("giver_goal_id", params.id)
    .order("created_at", { ascending: false });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: serviceOrders } = await (supabase as any)
    .from("service_orders")
    .select("*, service_packages(name)")
    .eq("goal_id", params.id)
    .order("created_at", { ascending: false });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: holidayBookings } = await (supabase as any)
    .from("holiday_bookings")
    .select("*, holiday_packages(title)")
    .eq("goal_id", params.id)
    .order("created_at", { ascending: false });

  // Show certificates issued for this goal OR paid using a deposit from this goal
  const feeDepositIds = (deposits || []).map((d) => d.id).filter(Boolean);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let certQuery = (supabase as any)
    .from("platform_certificates")
    .select("*")
    .eq("user_id", user.id)
    .eq("certificate_type", "proof_of_funds");

  if (feeDepositIds.length > 0) {
    certQuery = certQuery.or(`goal_id.eq.${params.id},fee_deposit_id.in.(${feeDepositIds.join(",")})`);
  } else {
    certQuery = certQuery.eq("goal_id", params.id);
  }

  const { data: certificates } = await certQuery.order("issued_at", { ascending: false });

  const { data: profile } = await supabase
    .from("users")
    .select("preferred_currency, mobility_score")
    .eq("id", user.id)
    .single();

  return (
    <GoalDetailView
      goal={goal}
      deposits={deposits || []}
      milestoneRewards={milestoneRewards || []}
      gifts={gifts || []}
      serviceOrders={serviceOrders || []}
      holidayBookings={holidayBookings || []}
      certificates={certificates || []}
      userId={user.id}
      preferredCurrency={profile?.preferred_currency || "NGN"}
    />
  );
}
