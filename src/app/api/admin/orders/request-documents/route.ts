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

  const { orderId, documents } = await request.json();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: order } = await (supabase as any)
    .from("service_orders")
    .select("user_id, service_packages(name)")
    .eq("id", orderId)
    .single();

  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const docRecords = documents.map((doc: any) => ({
    order_id: orderId,
    user_id: order.user_id,
    document_name: doc.document_name,
    instructions: doc.instructions || null,
    is_required: doc.is_required !== false,
    status: "pending",
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from("document_requests").insert(docRecords);
  if (error) return NextResponse.json({ error: "Failed to create document requests" }, { status: 500 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).from("service_orders").update({
    status: "documents_requested",
    documents_requested_at: new Date().toISOString(),
  }).eq("id", orderId);

  const docNames = documents.map((d: { document_name: string }) => d.document_name).join(", ");
  await supabase.from("notifications").insert({
    user_id: order.user_id,
    type: "documents_requested",
    title: "Documents needed for your application",
    body: `Your case manager has requested: ${docNames}. Upload them in your Documents tab to keep your application on track.`,
    action_url: "/dashboard/documents",
    target_segment: null,
  });

  return NextResponse.json({ success: true });
}
