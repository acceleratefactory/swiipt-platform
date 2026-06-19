import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { Resend } from "resend";

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { redemptionId, reference: providedReference } = await request.json();
  if (!redemptionId) {
    return NextResponse.json({ error: "Missing redemptionId." }, { status: 400 });
  }

  const reference = providedReference || `SWP-VISA-${user.id.replace(/-/g, "").slice(0, 6).toUpperCase()}-${Date.now().toString().slice(-6)}`;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: redemption, error: fetchError } = await (supabase as any)
    .from("visa_redemptions")
    .select("id, status, total_fee_usd, booking_fee_ngn, booking_fee_usd")
    .eq("id", redemptionId)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !redemption) {
    return NextResponse.json({ error: "Redemption not found." }, { status: 404 });
  }

  if (redemption.status !== "pending_payment") {
    return NextResponse.json({ error: "Redemption is not in pending payment state." }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: deposit, error: depositError } = await (supabase as any)
    .from("deposits")
    .insert({
      user_id: user.id,
      goal_id: null,
      amount: redemption.booking_fee_ngn,
      currency: "NGN",
      ngn_equivalent: redemption.booking_fee_ngn,
      payment_reference: reference,
      status: "pending",
      user_confirmed_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    })
    .select()
    .single();

  if (depositError) {
    console.error("Deposit creation error:", depositError);
    return NextResponse.json({ error: "Failed to create deposit.", details: depositError.message || depositError }, { status: 500 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: updateError } = await (supabase as any)
    .from("visa_redemptions")
    .update({ booking_fee_deposit_id: deposit.id, deposit_id: deposit.id })
    .eq("id", redemptionId);

  if (updateError) {
    return NextResponse.json({ error: "Deposit created but failed to link to visa redemption. Please contact support." }, { status: 500 });
  }

  // Notify admins about the new pending visa payment
  const { data: adminUsers } = await (supabase as any)
    .from("user_roles")
    .select("user_id")
    .eq("role", "admin");

  if (adminUsers && adminUsers.length > 0) {
    const adminNotifications = adminUsers.map((a: any) => ({
      user_id: a.user_id,
      type: "visa_payment_pending",
      title: "New visa payment needs confirmation",
      body: `${user.email || "A user"} has sent ₦${Number(redemption.booking_fee_ngn || 0).toLocaleString()} for visa booking fee. Reference: ${reference}`,
      action_url: "/admin/deposits",
    }));
    await (supabase as any).from("notifications").insert(adminNotifications);
  }

  // Send email notification to admin
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
  if (adminEmail) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY || "");
      await resend.emails.send({
        from: "Swiipt <hello@swiipt.com>",
        to: adminEmail,
        subject: `New visa payment pending — ${reference}`,
        html: `
          <div style="font-family: 'Plus Jakarta Sans', sans-serif; max-width: 560px; margin: 0 auto; padding: 2rem;">
            <h1 style="color: #06112B; font-size: 1.375rem; margin-bottom: 0.75rem;">New visa payment confirmation needed</h1>
            <p style="color: #3D4657; line-height: 1.6; margin-bottom: 1rem;">
              A user has sent their visa booking fee. Please verify in your bank app.
            </p>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 1rem;">
              <tr><td style="padding: 0.5rem 0; color: #7A8599;">User</td><td style="font-weight: 600; color: #06112B;">${user.email || "—"}</td></tr>
              <tr><td style="padding: 0.5rem 0; color: #7A8599;">Amount</td><td style="font-weight: 600; color: #06112B;">₦${Number(redemption.booking_fee_ngn || 0).toLocaleString()}</td></tr>
              <tr><td style="padding: 0.5rem 0; color: #7A8599;">Reference</td><td style="font-weight: 600; color: #06112B; font-family: monospace;">${reference}</td></tr>
            </table>
            <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://swiipt.com"}/admin/deposits" style="display: inline-block; padding: 0.875rem 1.75rem; background: #00C896; color: #06112B; font-weight: 700; border-radius: 10px; text-decoration: none;">
              Review deposit →
            </a>
            <p style="color: #7A8599; font-size: 0.75rem; margin-top: 2rem;">Swiipt · swiipt.com</p>
          </div>
        `,
      });
    } catch (emailErr) {
      console.error("Failed to send admin notification email:", emailErr);
    }
  }

  return NextResponse.json({
    depositId: deposit.id,
    reference,
    status: "pending_payment",
  });
}
