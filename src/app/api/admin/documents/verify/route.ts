import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: role } = await (supabase as any)
    .from("user_roles").select("role").eq("user_id", user.id).single();
  if (!role || (role.role !== "admin" && role.role !== "case_manager")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { documentRequestId, action, rejectionReason } = await request.json();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: docRequest } = await (supabase as any)
    .from("document_requests")
    .select("user_id, document_name, order_id")
    .eq("id", documentRequestId)
    .single();

  if (!docRequest) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (action === "approve") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from("document_requests").update({
      status: "verified",
      verified_at: new Date().toISOString(),
      verified_by: user.id,
    }).eq("id", documentRequestId);

    await supabase.rpc("increment_mobility_score", {
      user_id_input: docRequest.user_id,
      points: 20,
    });

    await supabase.from("notifications").insert({
      user_id: docRequest.user_id,
      type: "document_verified",
      title: `${docRequest.document_name} verified ✓`,
      body: "Your document has been reviewed and accepted by our team.",
      action_url: "/dashboard/documents",
      target_segment: null,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: allDocs } = await (supabase as any)
      .from("document_requests")
      .select("status")
      .eq("order_id", docRequest.order_id);

    const allVerified = allDocs?.every((d: { status: string }) => d.status === "verified");
    if (allVerified) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from("service_orders")
        .update({ status: "documents_received" })
        .eq("id", docRequest.order_id);

      await supabase.from("notifications").insert({
        user_id: docRequest.user_id,
        type: "all_documents_verified",
        title: "All documents verified ✓",
        body: "All your documents have been verified. Your application is progressing.",
        action_url: "/dashboard/documents",
        target_segment: null,
      });
    }

  } else if (action === "reject") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from("document_requests").update({
      status: "rejected",
      rejection_reason: rejectionReason || "Document did not meet requirements.",
      verified_by: user.id,
    }).eq("id", documentRequestId);

    await supabase.from("notifications").insert({
      user_id: docRequest.user_id,
      type: "document_rejected",
      title: `${docRequest.document_name} needs to be re-uploaded`,
      body: `Reason: ${rejectionReason || "Document did not meet requirements."}. Please upload a new version.`,
      action_url: "/dashboard/documents",
      target_segment: null,
    });
  }

  return NextResponse.json({ success: true });
}
