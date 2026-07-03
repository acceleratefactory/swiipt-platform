import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: role } = await (supabase as any)
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (!role || (role.role !== "admin" && role.role !== "case_manager")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { certificateId } = await request.json();
  if (!certificateId) {
    return NextResponse.json({ error: "certificateId is required" }, { status: 400 });
  }

  const { data: cert } = await (supabase as any)
    .from("platform_certificates")
    .select("id, certificate_number, certificate_type, user_id, is_valid")
    .eq("id", certificateId)
    .single();

  if (!cert) return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
  if (!cert.is_valid) return NextResponse.json({ error: "Certificate is already revoked" }, { status: 400 });

  await (supabase as any)
    .from("platform_certificates")
    .update({ is_valid: false })
    .eq("id", certificateId);

  await supabase.from("notifications").insert({
    user_id: cert.user_id,
    type: "certificate_revoked",
    title: "Certificate revoked",
    body: `Your ${cert.certificate_type.replace(/_/g, ' ')} certificate (${cert.certificate_number}) has been revoked by an admin.`,
    action_url: "/dashboard/profile",
    target_segment: null,
  });

  await (supabase as any).from("admin_audit_log").insert({
    admin_id: user.id,
    action: "revoke_certificate",
    target_table: "platform_certificates",
    target_record_id: certificateId,
    target_user_id: cert.user_id,
    previous_value: JSON.stringify({ is_valid: cert.is_valid }),
    new_value: JSON.stringify({ is_valid: false }),
  });

  return NextResponse.json({ success: true });
}
