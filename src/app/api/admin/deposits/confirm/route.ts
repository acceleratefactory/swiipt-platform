import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: role } = await (supabase as any)
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (!role || (role.role !== "admin" && role.role !== "case_manager")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { depositId, notes } = await request.json();

  if (!depositId) {
    return NextResponse.json({ error: "depositId required" }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).rpc("confirm_deposit", {
    deposit_id: depositId,
    admin_id: user.id,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Fire-and-forget financial profile recalculation
  supabase
    .from("deposits")
    .select("user_id")
    .eq("id", depositId)
    .single()
    .then(({ data: deposit }) => {
      if (deposit) {
        const url = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        fetch(`${url}/api/financial-profile/recalculate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: deposit.user_id }),
        }).catch(() => {});
      }
    });

  if (notes) {
    await supabase
      .from("deposits")
      .update({ notes })
      .eq("id", depositId);
  }

  return NextResponse.json({ success: true });
}
