import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DocumentRequestsList from "@/components/dashboard/documents/DocumentRequestsList";
import DocumentVault from "@/components/dashboard/documents/DocumentVault";
import DocumentReadinessScore from "@/components/dashboard/documents/DocumentReadinessScore";

export default async function DocumentsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [docRequestsRes, profileRes, vaultDocsRes] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from("document_requests")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("users")
      .select("mobility_score")
      .eq("id", user.id)
      .single(),
    supabase
      .from("activity_log")
      .select("event_data, created_at")
      .eq("user_id", user.id)
      .eq("event_type", "vault_document_uploaded")
      .order("created_at", { ascending: false }),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const docs = (docRequestsRes.data || []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const orderIds = [...new Set(docs.map((d: any) => d.order_id).filter(Boolean))] as string[];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let serviceOrders: any[] = [];
  if (orderIds.length) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any)
      .from("service_orders")
      .select("id, status, service_packages(name, destination)")
      .in("id", orderIds);
    serviceOrders = data || [];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const soMap = new Map(serviceOrders.map((s: any) => [s.id, s]));

  const remainingIds = orderIds.filter(id => !soMap.has(id));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let holidayBookings: any[] = [];
  if (remainingIds.length) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any)
      .from("holiday_bookings")
      .select("id, status, holiday_packages(title, destination)")
      .in("id", remainingIds);
    holidayBookings = data || [];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hbMap = new Map(holidayBookings.map((b: any) => [b.id, b]));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const requestsByOrder = docs.reduce((acc: any, doc: any) => {
    const orderId = doc.order_id;
    if (!acc[orderId]) {
      const so = soMap.get(orderId);
      const hb = hbMap.get(orderId);
      acc[orderId] = {
        order: so
          ? so
          : hb
            ? { id: hb.id, status: hb.status, service_packages: { name: hb.holiday_packages?.title, destination: hb.holiday_packages?.destination } }
            : null,
        docs: [],
      };
    }
    acc[orderId].docs.push(doc);
    return acc;
  }, {});

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const verifiedCount = docs.filter((d: any) => d.status === "verified").length;
  const totalRequested = docs.length;

  return (
    <div>
      <h1 style={{ fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', fontSize: '1.5rem', fontWeight: 800, color: 'var(--midnight)', marginBottom: '1.5rem' }}>
        Documents
      </h1>

      <DocumentReadinessScore
        verifiedCount={verifiedCount}
        totalRequested={totalRequested}
        mobilityScore={profileRes.data?.mobility_score || 0}
      />

      <DocumentRequestsList
        requestsByOrder={requestsByOrder}
        userId={user.id}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        vaultDocs={(vaultDocsRes.data || []).map((d: any) => d.event_data)}
      />

      <DocumentVault
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        vaultDocs={(vaultDocsRes.data || []).map((d: any) => d.event_data)}
        userId={user.id}
      />
    </div>
  );
}
