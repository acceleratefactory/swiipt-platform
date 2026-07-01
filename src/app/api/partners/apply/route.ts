import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await request.formData();
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;
  const partnerType = formData.get("partnerType") as string;
  const businessName = formData.get("businessName") as string;
  const cacNumber = formData.get("cacNumber") as string;
  const licenceNumber = formData.get("licenceNumber") as string;
  const yearsInOperation = formData.get("yearsInOperation") ? parseInt(formData.get("yearsInOperation") as string) : null;
  const specialisations = JSON.parse((formData.get("specialisations") as string) || "[]");
  const destinationsServed = JSON.parse((formData.get("destinationsServed") as string) || "[]");
  const files = formData.getAll("verificationDocuments") as File[];

  if (!name || !email || !partnerType) {
    return NextResponse.json({ error: "name, email, and partnerType required" }, { status: 400 });
  }

  const validTypes = [
    "immigration_lawyer", "visa_agent", "relocation_consultant",
    "trade_agent", "recruitment_agency", "education_consultant",
  ];
  if (!validTypes.includes(partnerType)) {
    return NextResponse.json({ error: "Invalid partner type" }, { status: 400 });
  }

  // Upload verification documents
  const verificationDocuments: Array<{ name: string; url: string; uploaded_at: string }> = [];
  for (const file of files) {
    const _fileExt = file.name.split(".").pop();
    const timestamp = Date.now();
    const filePath = `partner-applications/${user.id}/${timestamp}-${file.name.replace(/\s+/g, "_")}`;

    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(filePath, file, { upsert: true });

    if (!uploadError) {
      const { data: signedUrl } = await supabase.storage
        .from("documents")
        .createSignedUrl(filePath, 60 * 60 * 24 * 365);

      verificationDocuments.push({
        name: file.name,
        url: signedUrl?.signedUrl || "",
        uploaded_at: new Date().toISOString(),
      });
    }
  }

  const { data: partner, error: insertError } = await (supabase as any)
    .from("platform_partners")
    .insert({
      name,
      business_name: businessName || null,
      email,
      phone: phone || null,
      partner_type: partnerType,
      status: "pending",
      verification_documents: verificationDocuments,
      cac_number: cacNumber || null,
      professional_licence_number: licenceNumber || null,
      years_in_operation: yearsInOperation,
      specialisations,
      destinations_served: destinationsServed,
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  // Notify all admins
  const { data: admins } = await supabase
    .from("user_roles")
    .select("user_id")
    .eq("role", "admin");

  if (admins) {
    for (const admin of admins) {
      try {
        await (supabase as any).from("notifications").insert({
          user_id: admin.user_id,
          type: "partner_application",
          title: `New partner application: ${name}`,
          body: `${partnerType.replace(/_/g, " ")} — ${businessName || name} applied to join as a partner.`,
          action_url: `/admin/partners/${partner.id}`,
          target_segment: null,
          event_data: { name, partner_type: partnerType, business_name: businessName },
        });
      } catch {
        // Fire-and-forget
      }
    }
  }

  return NextResponse.json({ success: true, partner });
}
