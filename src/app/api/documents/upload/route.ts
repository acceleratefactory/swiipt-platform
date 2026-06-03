import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file") as File;
  const documentRequestId = formData.get("documentRequestId") as string;

  if (!file || !documentRequestId) {
    return NextResponse.json({ error: "File and documentRequestId required" }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: docRequest } = await (supabase as any)
    .from("document_requests")
    .select("*, service_orders(id)")
    .eq("id", documentRequestId)
    .eq("user_id", user.id)
    .single();

  if (!docRequest) {
    return NextResponse.json({ error: "Document request not found" }, { status: 404 });
  }

  const fileExt = file.name.split(".").pop();
  const timestamp = Date.now();
  const filePath = `${user.id}/${docRequest.order_id}/${docRequest.document_name.replace(/\s+/g, "_")}-${timestamp}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from("documents")
    .upload(filePath, file, { upsert: true });

  if (uploadError) {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }

  const { data: signedUrl } = await supabase.storage
    .from("documents")
    .createSignedUrl(filePath, 60 * 60 * 24 * 7);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from("document_requests")
    .update({
      status: "uploaded",
      file_url: filePath,
      uploaded_at: new Date().toISOString(),
    })
    .eq("id", documentRequestId);

  await supabase.rpc("increment_mobility_score", {
    user_id_input: user.id,
    points: 10,
  });

  await supabase.from("notifications").insert({
    user_id: null,
    type: "document_uploaded",
    title: "Document uploaded",
    body: `${docRequest.document_name} uploaded by user. Review in admin panel.`,
    action_url: "/admin/documents",
    target_segment: null,
  });

  await supabase.from("activity_log").insert({
    user_id: user.id,
    event_type: "document_uploaded",
    event_data: { document_name: docRequest.document_name, document_request_id: documentRequestId },
  });

  return NextResponse.json({ success: true, filePath, signedUrl: signedUrl?.signedUrl });
}
