import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await request.formData();
  const passportPhoto = formData.get("passportPhoto") as File;
  const passportDataPage = formData.get("passportDataPage") as File;
  const redemptionId = formData.get("redemptionId") as string;

  if (!passportPhoto || !passportDataPage || !redemptionId) {
    return NextResponse.json({ error: "Both documents and redemption ID are required." }, { status: 400 });
  }

  // Verify redemption belongs to user
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: redemption } = await (supabase as any)
    .from("visa_redemptions")
    .select("*")
    .eq("id", redemptionId)
    .eq("user_id", user.id)
    .single();

  if (!redemption) {
    return NextResponse.json({ error: "Redemption not found." }, { status: 404 });
  }

  if (redemption.status !== "payment_confirmed") {
    return NextResponse.json({ error: "Payment must be confirmed before uploading documents." }, { status: 400 });
  }

  const timestamp = Date.now();

  // Upload passport photo
  const photoExt = passportPhoto.name.split(".").pop();
  const photoPath = `${user.id}/visa-redemption/${redemptionId}/passport-photo-${timestamp}.${photoExt}`;
  const { error: photoError } = await supabase.storage
    .from("documents")
    .upload(photoPath, passportPhoto, { upsert: true });

  if (photoError) {
    return NextResponse.json({ error: "Failed to upload passport photo." }, { status: 500 });
  }

  // Upload passport data page
  const passportExt = passportDataPage.name.split(".").pop();
  const passportPath = `${user.id}/visa-redemption/${redemptionId}/passport-data-${timestamp}.${passportExt}`;
  const { error: passportError } = await supabase.storage
    .from("documents")
    .upload(passportPath, passportDataPage, { upsert: true });

  if (passportError) {
    return NextResponse.json({ error: "Failed to upload passport data page." }, { status: 500 });
  }

  // Update redemption record
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).from("visa_redemptions").update({
    passport_photo_url: photoPath,
    passport_data_page_url: passportPath,
    status: "documents_uploaded",
    updated_at: new Date().toISOString(),
  }).eq("id", redemptionId);

  // Mark the reward as redeemed
  await supabase.from("milestone_rewards").update({
    redeemed: true,
    redeemed_at: new Date().toISOString(),
    redeemed_as: "visa_redemption",
  }).eq("id", redemption.reward_id);

  // Notify admin
  await supabase.from("notifications").insert({
    user_id: null,
    type: "visa_redemption_ready",
    title: "Qatar visa redemption ready to process",
    body: "A user has paid the booking fee and uploaded documents for Qatar Tourist Visa. Ready to create service order.",
    action_url: "/admin/visa-redemptions",
  });

  // Notify user
  await supabase.from("notifications").insert({
    user_id: user.id,
    type: "visa_documents_received",
    title: "Documents received — Qatar visa processing started",
    body: "Your booking fee and documents have been received. Your Qatar Tourist Visa application has started. We will update you within 2–5 business days.",
    action_url: "/dashboard/rewards",
  });

  return NextResponse.json({ success: true, status: "documents_uploaded" });
}
