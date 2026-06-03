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
      .select("*, service_orders(id, status, service_packages(name, destination))")
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
  const requestsByOrder = (docRequestsRes.data || []).reduce((acc: any, doc: any) => {
    const orderId = doc.order_id;
    if (!acc[orderId]) acc[orderId] = { order: doc.service_orders, docs: [] };
    acc[orderId].docs.push(doc);
    return acc;
  }, {});

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const verifiedCount = (docRequestsRes.data || []).filter((d: any) => d.status === "verified").length;
  const totalRequested = (docRequestsRes.data || []).length;

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
      />

      <DocumentVault
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        vaultDocs={(vaultDocsRes.data || []).map((d: any) => d.event_data)}
        userId={user.id}
      />
    </div>
  );
}
