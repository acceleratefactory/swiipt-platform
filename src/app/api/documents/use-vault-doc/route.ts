import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { documentRequestId, filePath } = await request.json();

  if (!documentRequestId || !filePath) {
    return NextResponse.json({ error: "documentRequestId and filePath required" }, { status: 400 });
  }

  if (!filePath.startsWith(user.id + "/")) {
    return NextResponse.json({ error: "Invalid file path" }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: docRequest, error: fetchError } = await (supabase as any)
    .from("document_requests")
    .select("document_name, order_id, user_id")
    .eq("id", documentRequestId)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !docRequest) {
    return NextResponse.json({ error: "Document request not found" }, { status: 404 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: updateError } = await (supabase as any)
    .from("document_requests")
    .update({
      status: "uploaded",
      file_url: filePath,
      uploaded_at: new Date().toISOString(),
    })
    .eq("id", documentRequestId);

  if (updateError) {
    return NextResponse.json({ error: "Failed to update document status" }, { status: 500 });
  }

  await supabase.rpc("increment_mobility_score", {
    user_id_input: user.id,
    points: 10,
  });

  await supabase.from("notifications").insert({
    user_id: null,
    type: "document_uploaded",
    title: "Document uploaded",
    body: `${docRequest.document_name} uploaded by user (from vault). Review in admin panel.`,
    action_url: "/admin/documents",
    target_segment: null,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).from("activity_log").insert({
    user_id: user.id,
    event_type: "document_uploaded",
    event_data: { document_name: docRequest.document_name, document_request_id: documentRequestId, source: "vault" },
  });

  return NextResponse.json({ success: true, filePath });
}
