"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import DocumentUploadCard from "./DocumentUploadCard";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function DocumentRequestsList({ requestsByOrder, userId }: { requestsByOrder: any; userId: string }) {
  const [orders, setOrders] = useState(requestsByOrder);
  const supabase = createClient();

  useEffect(() => {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const channel = supabase
      .channel(`doc_requests:${userId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "document_requests",
        filter: `user_id=eq.${userId}`,
      }, () => {
        window.location.reload();
      })
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "document_requests",
        filter: `user_id=eq.${userId}`,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }, (payload: any) => {
        setOrders((prev: any) => {
          const updated = { ...prev };
          for (const orderId in updated) {
            updated[orderId].docs = updated[orderId].docs.map((d: any) =>
              d.id === payload.new.id ? { ...d, ...payload.new } : d
            );
          }
          return updated;
        });
      })
      .subscribe();
    /* eslint-enable @typescript-eslint/no-explicit-any */

    return () => { supabase.removeChannel(channel); };
  }, [userId, supabase]);

  if (Object.keys(orders).length === 0) {
    return (
      <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: '2rem', border: '1px solid var(--border)', marginBottom: '1.5rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          No document requests yet. Once you place a service order, your case manager will request the required documents here.
        </p>
      </div>
    );
  }

  /* eslint-disable @typescript-eslint/no-explicit-any */
  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <h2 style={{ fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', fontSize: '1rem', fontWeight: 700, color: 'var(--midnight)', marginBottom: '1rem' }}>
        Application documents
      </h2>

      {Object.values(orders).map((orderGroup: any) => (
        <div key={orderGroup.order?.id} style={{ background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', marginBottom: '1rem', overflow: 'hidden' }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', background: 'var(--off-white)' }}>
            <p style={{ fontWeight: 700, color: 'var(--midnight)', fontSize: '0.9375rem' }}>
              {orderGroup.order?.service_packages?.name}
            </p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>
              {orderGroup.order?.service_packages?.destination}
            </p>
          </div>

          {orderGroup.docs.map((doc: any) => (
            <DocumentUploadCard
              key={doc.id}
              doc={doc}
              userId={userId}
              onUploaded={(docId, filePath) => {
                setOrders((prev: any) => {
                  const updated = { ...prev };
                  for (const orderId in updated) {
                    updated[orderId].docs = updated[orderId].docs.map((d: any) =>
                      d.id === docId ? { ...d, status: "uploaded", file_url: filePath } : d
                    );
                  }
                  return updated;
                });
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
  /* eslint-enable @typescript-eslint/no-explicit-any */
}
