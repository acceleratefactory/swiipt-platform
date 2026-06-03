"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import DocumentRequestForm from "./DocumentRequestForm";

const validTransitions: Record<string, string[]> = {
  initiated: ["payment_pending", "cancelled"],
  payment_pending: ["payment_confirmed", "cancelled"],
  payment_confirmed: ["documents_requested", "in_progress"],
  documents_requested: ["documents_received"],
  documents_received: ["in_progress"],
  in_progress: ["awaiting_approval", "documents_requested"],
  awaiting_approval: ["approved", "in_progress"],
  approved: ["completed"],
};

const statusColors: Record<string, { bg: string; color: string }> = {
  initiated: { bg: '#F3F4F6', color: '#6B7280' },
  payment_pending: { bg: '#FEF3C7', color: '#B45309' },
  payment_confirmed: { bg: 'var(--teal-pale)', color: 'var(--teal)' },
  documents_requested: { bg: '#FEF3C7', color: '#B45309' },
  documents_received: { bg: '#DBEAFE', color: '#1D4ED8' },
  in_progress: { bg: '#DBEAFE', color: '#1D4ED8' },
  awaiting_approval: { bg: '#EDE9FE', color: '#6D28D9' },
  approved: { bg: 'var(--teal-pale)', color: 'var(--teal)' },
  completed: { bg: 'var(--teal-pale)', color: 'var(--teal)' },
};

const docStatusConfig: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'Pending', color: '#B45309', bg: '#FEF3C7' },
  uploaded: { label: 'Uploaded', color: '#1D4ED8', bg: '#DBEAFE' },
  verified: { label: 'Verified', color: 'var(--teal)', bg: 'var(--teal-pale)' },
  rejected: { label: 'Rejected', color: 'var(--danger)', bg: '#FEF2F2' },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function OrderDetailView({ order, documents, adminId: _adminId }: { order: any; documents: any[]; adminId: string }) {
  const [newStatus, setNewStatus] = useState("");
  const [caseManagerNotes, setCaseManagerNotes] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [updating, setUpdating] = useState(false);
  const [docs, _setDocs] = useState(documents);

  const sc = statusColors[order.status] || { bg: '#F3F4F6', color: '#6B7280' };

  async function handleUpdateStatus() {
    if (!newStatus) return;
    setUpdating(true);
    await fetch("/api/admin/orders/update-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: order.id, newStatus, caseManagerNotes, internalNotes }),
    });
    window.location.reload();
  }

  async function getSignedUrl(filePath: string) {
    const supabase = createClient();
    const { data } = await supabase.storage
      .from("documents")
      .createSignedUrl(filePath, 300);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  }

  return (
    <div>
      <a href="/admin/orders" style={{ fontSize: '0.8125rem', color: 'var(--teal)', textDecoration: 'none', marginBottom: '1rem', display: 'inline-block' }}>
        ← Back to orders
      </a>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* LEFT COLUMN — Order info */}
        <div>
          <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', padding: '1.25rem', marginBottom: '1.5rem' }}>
            <h2 style={{ fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', fontSize: '1rem', fontWeight: 700, color: 'var(--midnight)', marginBottom: '1rem' }}>
              Order summary
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.8125rem' }}>
              <div><span style={{ color: 'var(--text-muted)' }}>User:</span> <span style={{ fontWeight: 600, color: 'var(--midnight)' }}>{order.users?.full_name}</span></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Email:</span> <span style={{ fontWeight: 600, color: 'var(--midnight)' }}>{order.users?.email}</span></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Service:</span> <span style={{ fontWeight: 600, color: 'var(--midnight)' }}>{order.service_packages?.name}</span></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Destination:</span> <span style={{ fontWeight: 600, color: 'var(--midnight)' }}>{order.service_packages?.destination}</span></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Payment:</span> <span style={{ fontWeight: 600, color: 'var(--midnight)' }}>{order.payment_method || '-'}</span></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Amount:</span> <span style={{ fontWeight: 600, color: 'var(--midnight)' }}>{order.price_paid ? `${order.currency || 'NGN'} ${Number(order.price_paid).toLocaleString()}` : '-'}</span></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Order date:</span> <span style={{ fontWeight: 600, color: 'var(--midnight)' }}>{new Date(order.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}</span></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Status:</span> <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: '20px', background: sc.bg, color: sc.color, marginLeft: '0.25rem' }}>{order.status.replace(/_/g, ' ')}</span></div>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>User mobility score: <strong>{order.users?.mobility_score || 0}</strong></p>
          </div>

          {/* STATUS UPDATE PANEL */}
          <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', padding: '1.25rem', marginBottom: '1.5rem' }}>
            <h3 style={{ fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', fontSize: '0.9375rem', fontWeight: 700, color: 'var(--midnight)', marginBottom: '0.75rem' }}>
              Update status
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <select
                value={newStatus}
                onChange={e => setNewStatus(e.target.value)}
                style={{ padding: '0.5rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '0.8125rem', outline: 'none' }}
              >
                <option value="">Select next status...</option>
                {validTransitions[order.status]?.map(s => (
                  <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                ))}
              </select>
              <textarea
                placeholder="Case manager note (visible to user)"
                value={caseManagerNotes}
                onChange={e => setCaseManagerNotes(e.target.value)}
                rows={2}
                style={{ padding: '0.5rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '0.8125rem', outline: 'none', resize: 'vertical' }}
              />
              <textarea
                placeholder="Internal notes (admin only)"
                value={internalNotes}
                onChange={e => setInternalNotes(e.target.value)}
                rows={2}
                style={{ padding: '0.5rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '0.8125rem', outline: 'none', resize: 'vertical' }}
              />
              <button
                onClick={handleUpdateStatus}
                disabled={updating || !newStatus}
                style={{ padding: '0.5rem 1rem', background: updating ? 'var(--gray-300)' : 'var(--teal)', border: 'none', borderRadius: 'var(--radius-sm)', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--midnight)', cursor: updating ? 'not-allowed' : 'pointer', alignSelf: 'flex-start' }}
              >
                {updating ? "Updating..." : "Update status"}
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN — Documents */}
        <div>
          {/* DOCUMENT REQUEST FORM */}
          {(order.status === "payment_confirmed" || order.status === "in_progress") && (
            <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', padding: '1.25rem', marginBottom: '1.5rem' }}>
              <DocumentRequestForm
                orderId={order.id}
                existingDocs={docs}
                onSubmit={() => window.location.reload()}
              />
            </div>
          )}

          {/* DOCUMENT LIST */}
          <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', padding: '1.25rem' }}>
            <h3 style={{ fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', fontSize: '0.9375rem', fontWeight: 700, color: 'var(--midnight)', marginBottom: '0.75rem' }}>
              Documents ({docs.length})
            </h3>
            {docs.length === 0 ? (
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>No documents requested for this order yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {// eslint-disable-next-line @typescript-eslint/no-explicit-any
                docs.map((doc: any) => {
                  const dc = docStatusConfig[doc.status] || { label: doc.status, color: '#6B7280', bg: '#F3F4F6' };
                  return (
                    <div key={doc.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.625rem 0.75rem', background: 'var(--off-white)', borderRadius: 'var(--radius-sm)' }}>
                      <div>
                        <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--midnight)' }}>{doc.document_name}</p>
                        {doc.instructions && <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{doc.instructions}</p>}
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '2px 6px', borderRadius: '20px', background: dc.bg, color: dc.color }}>
                          {dc.label}
                        </span>
                        {doc.file_url && (
                          <button
                            onClick={() => getSignedUrl(doc.file_url)}
                            style={{ padding: '0.25rem 0.5rem', background: 'var(--teal)', border: 'none', borderRadius: 'var(--radius-sm)', fontSize: '0.7rem', fontWeight: 600, color: 'var(--midnight)', cursor: 'pointer' }}
                          >
                            View
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
