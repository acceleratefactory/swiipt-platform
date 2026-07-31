"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const validTransitions: Record<string, string[]> = {
  payment_pending: ["payment_submitted", "cancelled"],
  payment_submitted: ["payment_confirmed", "cancelled"],
  payment_confirmed: ["documents_requested", "in_progress", "completed", "cancelled"],
  documents_requested: ["documents_received", "in_progress"],
  documents_received: ["in_progress"],
  in_progress: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

const statusColors: Record<string, { bg: string; color: string }> = {
  payment_pending: { bg: '#FEF3C7', color: '#B45309' },
  payment_submitted: { bg: '#FFFBEB', color: '#D97706' },
  payment_confirmed: { bg: 'var(--teal-pale)', color: 'var(--teal)' },
  documents_requested: { bg: '#FEF3C7', color: '#B45309' },
  documents_received: { bg: '#DBEAFE', color: '#1D4ED8' },
  in_progress: { bg: '#DBEAFE', color: '#1D4ED8' },
  completed: { bg: 'var(--teal-pale)', color: 'var(--teal)' },
  cancelled: { bg: '#F3F4F6', color: '#6B7280' },
};

const docStatusConfig: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'Pending', color: '#B45309', bg: '#FEF3C7' },
  uploaded: { label: 'Uploaded', color: '#1D4ED8', bg: '#DBEAFE' },
  verified: { label: 'Verified', color: 'var(--teal)', bg: 'var(--teal-pale)' },
  rejected: { label: 'Rejected', color: 'var(--danger)', bg: '#FEF2F2' },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function HolidayBookingDetail({ booking, documents, adminId: _adminId }: { booking: any; documents: any[]; adminId: string }) {
  const [newStatus, setNewStatus] = useState("");
  const [caseManagerNotes, setCaseManagerNotes] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [updating, setUpdating] = useState(false);

  const [docRows, setDocRows] = useState([{ document_name: "", instructions: "" }]);
  const [requesting, setRequesting] = useState(false);
  const [requestError, setRequestError] = useState("");

  const [docs, _setDocs] = useState(documents);

  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const sc = statusColors[booking.status] || { bg: '#F3F4F6', color: '#6B7280' };

  async function handleDelete() {
    if (!window.confirm(`Delete booking "${booking.reference}" for ${booking.user?.full_name || "this user"}? This cannot be undone.`)) return;
    setDeleting(true);
    setDeleteError("");
    const res = await fetch("/api/admin/holidays/delete-booking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId: booking.id }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      setDeleteError(err.error || "Failed to delete booking");
      setDeleting(false);
      return;
    }
    window.location.href = "/admin/holidays";
  }

  async function handleUpdateStatus() {
    if (!newStatus) return;
    setUpdating(true);
    await fetch("/api/admin/holidays/update-booking-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId: booking.id, newStatus, caseManagerNotes, internalNotes }),
    });
    window.location.reload();
  }

  function addDocRow() {
    setDocRows(prev => [...prev, { document_name: "", instructions: "" }]);
  }

  function removeDocRow(index: number) {
    setDocRows(prev => prev.filter((_, i) => i !== index));
  }

  function updateDocRow(index: number, field: "document_name" | "instructions", value: string) {
    setDocRows(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }

  async function handleRequestDocuments() {
    const valid = docRows.filter(r => r.document_name.trim());
    if (valid.length === 0) return;
    setRequesting(true);
    setRequestError("");

    try {
      const res = await fetch("/api/admin/holidays/request-documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: booking.id, documents: valid }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setRequestError(err.error || "Failed to request documents");
        setRequesting(false);
        return;
      }

      setDocRows([{ document_name: "", instructions: "" }]);
      setRequesting(false);
      window.location.reload();
    } catch {
      setRequestError("Network error — please try again");
      setRequesting(false);
    }
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
      <a href="/admin/holidays" style={{ fontSize: '0.8125rem', color: 'var(--teal)', textDecoration: 'none', marginBottom: '1rem', display: 'inline-block' }}>
        ← Back to bookings
      </a>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* LEFT COLUMN — Booking info */}
        <div>
          <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', padding: '1.25rem', marginBottom: '1.5rem' }}>
            <h2 style={{ fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', fontSize: '1rem', fontWeight: 700, color: 'var(--midnight)', marginBottom: '1rem' }}>
              Booking summary
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.8125rem' }}>
              <div><span style={{ color: 'var(--text-muted)' }}>User:</span> <span style={{ fontWeight: 600, color: 'var(--midnight)' }}>{booking.user?.full_name}</span></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Email:</span> <span style={{ fontWeight: 600, color: 'var(--midnight)' }}>{booking.user?.email}</span></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Package:</span> <span style={{ fontWeight: 600, color: 'var(--midnight)' }}>{booking.package?.title}</span></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Destination:</span> <span style={{ fontWeight: 600, color: 'var(--midnight)' }}>{booking.package?.destination}</span></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Reference:</span> <span style={{ fontWeight: 600, fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--midnight)' }}>{booking.reference}</span></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Total:</span> <span style={{ fontWeight: 600, color: 'var(--midnight)' }}>{booking.currency} {Number(booking.total_price).toLocaleString()}</span></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Travellers:</span> <span style={{ fontWeight: 600, color: 'var(--midnight)' }}>{booking.travellers}</span></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Status:</span> <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: '20px', background: sc.bg, color: sc.color, marginLeft: '0.25rem' }}>{booking.status.replace(/_/g, ' ')}</span></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Created:</span> <span style={{ fontWeight: 600, color: 'var(--midnight)' }}>{new Date(booking.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}</span></div>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>User mobility score: <strong>{booking.user?.mobility_score || 0}</strong></p>
            {deleteError && (
              <div style={{ padding: '0.625rem 0.875rem', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 'var(--radius-sm)', color: '#B91C1C', fontSize: '0.8125rem', marginTop: '0.75rem' }}>
                {deleteError}
              </div>
            )}
            <button
              onClick={handleDelete}
              disabled={deleting}
              style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: 'none', border: '1px solid var(--danger)', borderRadius: 'var(--radius-sm)', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--danger)', cursor: deleting ? 'not-allowed' : 'pointer' }}
            >
              {deleting ? "Deleting..." : "Delete booking"}
            </button>
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
                {validTransitions[booking.status]?.map(s => (
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
          {(booking.status === "payment_confirmed" || booking.status === "in_progress") && (
            <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', padding: '1.25rem', marginBottom: '1.5rem' }}>
              {requestError && (
                <div style={{ padding: '0.625rem 0.875rem', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 'var(--radius-sm)', color: '#B91C1C', fontSize: '0.8125rem', marginBottom: '0.75rem' }}>
                  {requestError}
                </div>
              )}
              <h3 style={{ fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', fontSize: '0.9375rem', fontWeight: 700, color: 'var(--midnight)', marginBottom: '0.75rem' }}>
                Request documents
              </h3>
              {docs.length > 0 && (
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                  {docs.length} document(s) already requested for this booking.
                </p>
              )}
              {docRows.map((row, index) => (
                <div key={index} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <input
                      type="text"
                      placeholder="Document name (required)"
                      value={row.document_name}
                      onChange={e => updateDocRow(index, "document_name", e.target.value)}
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '0.8125rem', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <input
                      type="text"
                      placeholder="Instructions (optional)"
                      value={row.instructions}
                      onChange={e => updateDocRow(index, "instructions", e.target.value)}
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '0.8125rem', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                  {docRows.length > 1 && (
                    <button onClick={() => removeDocRow(index)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '1rem', padding: '0.375rem' }}>
                      ×
                    </button>
                  )}
                </div>
              ))}
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button onClick={addDocRow} style={{ padding: '0.5rem 1rem', background: 'var(--off-white)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  + Add another
                </button>
                <button onClick={handleRequestDocuments} disabled={requesting || docRows.every(r => !r.document_name.trim())} style={{ padding: '0.5rem 1rem', background: requesting ? 'var(--gray-300)' : 'var(--teal)', border: 'none', borderRadius: 'var(--radius-sm)', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--midnight)', cursor: requesting ? 'not-allowed' : 'pointer' }}>
                  {requesting ? "Sending..." : "Send request"}
                </button>
              </div>
            </div>
          )}

          {/* DOCUMENT LIST */}
          <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', padding: '1.25rem' }}>
            <h3 style={{ fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', fontSize: '0.9375rem', fontWeight: 700, color: 'var(--midnight)', marginBottom: '0.75rem' }}>
              Documents ({docs.length})
            </h3>
            {docs.length === 0 ? (
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>No documents requested for this booking yet.</p>
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
