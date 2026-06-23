import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file") as File;
  const documentName = formData.get("documentName") as string;
  const documentType = formData.get("documentType") as string;
  const expiryDate = formData.get("expiryDate") as string;

  if (!file || !documentName) {
    return NextResponse.json({ error: "File and documentName required" }, { status: 400 });
  }

  const fileExt = file.name.split(".").pop();
  const timestamp = Date.now();
  const filePath = `${user.id}/vault/${documentType || "other"}-${timestamp}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from("documents")
    .upload(filePath, file, { upsert: true });

  if (uploadError) {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }

  const { error: logError } = await supabase.from("activity_log").insert({
    user_id: user.id,
    event_type: "vault_document_uploaded",
    event_data: {
      document_name: documentName,
      document_type: documentType,
      file_path: filePath,
      expiry_date: expiryDate || null,
    },
  });

  if (logError) {
    return NextResponse.json({ error: "Failed to save document record" }, { status: 500 });
  }

  if (documentType === "passport") {
    await supabase.rpc("increment_mobility_score", {
      user_id_input: user.id,
      points: 30,
    });
  }

  return NextResponse.json({ success: true, filePath });
}
