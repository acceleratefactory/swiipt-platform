"use client";
import { useState } from "react";

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  pending: { label: 'Upload required', color: '#B45309', bg: '#FEF3C7', icon: '' },
  uploaded: { label: 'Uploaded — pending review', color: '#1D4ED8', bg: '#DBEAFE', icon: '' },
  verified: { label: 'Verified ✓', color: 'var(--teal)', bg: 'var(--teal-pale)', icon: '✓' },
  rejected: { label: 'Re-upload required', color: 'var(--danger)', bg: '#FEF2F2', icon: '⚠️' },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function DocumentUploadCard({ doc, userId: _userId, onUploaded }: { doc: any; userId: string; onUploaded: (docId: string, filePath: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  async function handleUpload(file: File) {
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("documentRequestId", doc.id);

    const res = await fetch("/api/documents/upload", { method: "POST", body: formData });
    const data = await res.json();
    if (res.ok) onUploaded(doc.id, data.filePath);
    setUploading(false);
  }

  const status = statusConfig[doc.status] || statusConfig.pending;

  return (
    <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--gray-100)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.25rem' }}>
            <span>{status.icon}</span>
            <p style={{ fontWeight: 600, color: 'var(--midnight)', fontSize: '0.9375rem' }}>
              {doc.document_name}
              {doc.is_required && <span style={{ color: 'var(--danger)', marginLeft: '4px' }}>*</span>}
            </p>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: '20px', background: status.bg, color: status.color }}>
              {status.label}
            </span>
          </div>

          {doc.instructions && (
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '0.5rem' }}>
              {doc.instructions}
            </p>
          )}

          {doc.status === "rejected" && doc.rejection_reason && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 'var(--radius-sm)', padding: '0.5rem 0.75rem', marginBottom: '0.5rem', fontSize: '0.8125rem', color: 'var(--danger)' }}>
              {doc.rejection_reason}
            </div>
          )}
        </div>

        {(doc.status === "pending" || doc.status === "rejected") && (
          <label
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); const file = e.dataTransfer.files[0]; if (file) handleUpload(file); }}
            style={{
              padding: '0.5rem 1rem',
              background: dragOver ? 'var(--teal-pale)' : 'var(--off-white)',
              border: `1px dashed ${dragOver ? 'var(--teal)' : 'var(--border)'}`,
              borderRadius: 'var(--radius-md)',
              cursor: uploading ? 'not-allowed' : 'pointer',
              fontSize: '0.8125rem',
              color: 'var(--text-secondary)',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            {uploading ? "Uploading..." : "Upload file"}
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              style={{ display: 'none' }}
              onChange={e => { const file = e.target.files?.[0]; if (file) handleUpload(file); }}
              disabled={uploading}
            />
          </label>
        )}
      </div>
    </div>
  );
}
