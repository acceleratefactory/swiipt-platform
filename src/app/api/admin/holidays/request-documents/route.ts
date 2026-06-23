import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const serviceClient = createServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: role } = await (serviceClient as any)
    .from("user_roles").select("role").eq("user_id", user.id).single();
  if (!role || (role.role !== "admin" && role.role !== "case_manager")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { bookingId, documents } = await request.json();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: booking } = await (serviceClient as any)
    .from("holiday_bookings")
    .select("user_id, package_id")
    .eq("id", bookingId)
    .single();

  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const docRecords = documents.map((doc: any) => ({
    order_id: bookingId,
    user_id: booking.user_id,
    document_name: doc.document_name,
    instructions: doc.instructions || null,
    is_required: doc.is_required !== false,
    status: "pending",
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (serviceClient as any).from("document_requests").insert(docRecords);
  if (error) return NextResponse.json({ error: "Failed to create document requests" }, { status: 500 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (serviceClient as any).from("holiday_bookings").update({
    status: "documents_requested",
    documents_requested_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }).eq("id", bookingId);

  const docNames = documents.map((d: { document_name: string }) => d.document_name).join(", ");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (serviceClient as any).from("notifications").insert({
    user_id: booking.user_id,
    type: "holiday_documents_requested",
    title: "Documents needed for your holiday booking",
    body: `Your case manager has requested: ${docNames}. Upload them in your Documents tab to keep your booking on track.`,
    action_url: "/dashboard/documents",
    target_segment: null,
  });

  return NextResponse.json({ success: true });
}
