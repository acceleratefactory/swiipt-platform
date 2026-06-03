"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function DocumentVerificationQueue({ initialDocs }: { initialDocs: any[] }) {
  const [docs, setDocs] = useState(initialDocs);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  async function handleVerify(documentRequestId: string, action: "approve" | "reject", reason?: string) {
    setActionLoading(documentRequestId);
    await fetch("/api/admin/documents/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ documentRequestId, action, rejectionReason: reason }),
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setDocs(prev => prev.filter((d: any) => d.id !== documentRequestId));
    setActionLoading(null);
    setRejectingId(null);
    setRejectionReason("");
  }

  async function getSignedUrl(filePath: string) {
    const supabase = createClient();
    const { data } = await supabase.storage
      .from("documents")
      .createSignedUrl(filePath, 300);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  }

  function elapsed(uploadedAt: string) {
    const diff = Date.now() - new Date(uploadedAt).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return "Less than 1 hour ago";
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }

  if (docs.length === 0) {
    return (
      <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', padding: '2.5rem', textAlign: 'center' }}>
        <p style={{ fontSize: '1rem', color: 'var(--teal)', fontWeight: 700 }}>All documents reviewed. No pending reviews. ✓</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {// eslint-disable-next-line @typescript-eslint/no-explicit-any
        docs.map((doc: any) => (
        <div key={doc.id} style={{ background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--midnight)', marginBottom: '0.25rem' }}>{doc.document_name}</p>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '0.125rem' }}>
                {doc.users?.full_name} — {doc.users?.email}
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Order: {doc.service_orders?.service_packages?.name || 'N/A'}
              </p>
              {doc.instructions && (
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '0.375rem' }}>
                  Request note: {doc.instructions}
                </p>
              )}
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.375rem' }}>
                Uploaded {elapsed(doc.uploaded_at)}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexShrink: 0 }}>
              <button
                onClick={() => getSignedUrl(doc.file_url)}
                style={{ padding: '0.5rem 0.75rem', background: 'var(--off-white)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                View document
              </button>

              <button
                onClick={() => handleVerify(doc.id, "approve")}
                disabled={actionLoading === doc.id}
                style={{ padding: '0.5rem 0.75rem', background: actionLoading === doc.id ? 'var(--gray-300)' : 'var(--teal)', border: 'none', borderRadius: 'var(--radius-sm)', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--midnight)', cursor: actionLoading === doc.id ? 'not-allowed' : 'pointer' }}
              >
                {actionLoading === doc.id ? "..." : "Approve"}
              </button>

              <button
                onClick={() => setRejectingId(rejectingId === doc.id ? null : doc.id)}
                style={{ padding: '0.5rem 0.75rem', background: 'transparent', border: '1px solid var(--danger)', borderRadius: 'var(--radius-sm)', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--danger)', cursor: 'pointer' }}
              >
                Reject
              </button>
            </div>
          </div>

          {rejectingId === doc.id && (
            <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
              <input
                type="text"
                placeholder="Rejection reason"
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
                style={{ flex: 1, padding: '0.5rem', border: '1px solid var(--danger)', borderRadius: 'var(--radius-sm)', fontSize: '0.8125rem', outline: 'none' }}
              />
              <button
                onClick={() => handleVerify(doc.id, "reject", rejectionReason)}
                disabled={actionLoading === doc.id || !rejectionReason.trim()}
                style={{ padding: '0.5rem 0.75rem', background: actionLoading === doc.id ? 'var(--gray-300)' : 'var(--danger)', border: 'none', borderRadius: 'var(--radius-sm)', fontSize: '0.8125rem', fontWeight: 700, color: 'white', cursor: actionLoading === doc.id ? 'not-allowed' : 'pointer' }}
              >
                {actionLoading === doc.id ? "..." : "Confirm reject"}
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
