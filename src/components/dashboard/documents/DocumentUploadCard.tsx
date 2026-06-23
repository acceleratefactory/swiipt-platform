"use client";
import { useState } from "react";

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  pending: { label: 'Upload required', color: '#B45309', bg: '#FEF3C7', icon: '📄' },
  uploaded: { label: 'Uploaded — pending review', color: '#1D4ED8', bg: '#DBEAFE', icon: '⏳' },
  verified: { label: 'Verified ✓', color: 'var(--teal)', bg: 'var(--teal-pale)', icon: '✓' },
  rejected: { label: 'Re-upload required', color: 'var(--danger)', bg: '#FEF2F2', icon: '⚠️' },
};

function getExpiryStatus(expiryDate: string | null): { level: "none" | "expired" | "soon"; label: string } | null {
  if (!expiryDate) return null;
  const expiry = new Date(expiryDate);
  const now = new Date();
  const sixMonths = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000);
  if (expiry < now) return { level: "expired", label: `Expired ${expiry.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}` };
  if (expiry < sixMonths) return { level: "soon", label: `Expires ${expiry.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })} (within 6 months)` };
  return { level: "none", label: `Expires ${expiry.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}` };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function DocumentUploadCard({ doc, userId: _userId, onUploaded, vaultDocs }: { doc: any; userId: string; onUploaded: (docId: string, filePath: string) => void; vaultDocs: any[] }) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [showVaultPicker, setShowVaultPicker] = useState(false);
  const [vaultLoading, setVaultLoading] = useState(false);

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

  async function handleUseVaultDoc(vaultDoc: any) {
    setVaultLoading(true);
    setShowVaultPicker(false);
    const res = await fetch("/api/documents/use-vault-doc", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ documentRequestId: doc.id, filePath: vaultDoc.file_path }),
    });
    const data = await res.json();
    if (res.ok) onUploaded(doc.id, data.filePath);
    setVaultLoading(false);
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
          <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
            <label
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); const file = e.dataTransfer.files[0]; if (file) handleUpload(file); }}
              style={{
                padding: '0.5rem 1rem',
                background: dragOver ? 'var(--teal-pale)' : 'var(--off-white)',
                border: `1px dashed ${dragOver ? 'var(--teal)' : 'var(--border)'}`,
                borderRadius: 'var(--radius-md)',
                cursor: uploading || vaultLoading ? 'not-allowed' : 'pointer',
                fontSize: '0.8125rem',
                color: 'var(--text-secondary)',
                fontWeight: 600,
                whiteSpace: 'nowrap',
              }}
            >
              {uploading ? "Uploading..." : "📎 Upload file"}
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                style={{ display: 'none' }}
                onChange={e => { const file = e.target.files?.[0]; if (file) handleUpload(file); }}
                disabled={uploading || vaultLoading}
              />
            </label>
            {vaultDocs.length > 0 && (
              <button
                onClick={() => setShowVaultPicker(!showVaultPicker)}
                disabled={vaultLoading}
                style={{
                  padding: '0.5rem 0.75rem',
                  background: showVaultPicker ? 'var(--teal-pale)' : 'var(--off-white)',
                  border: `1px solid ${showVaultPicker ? 'var(--teal)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius-md)',
                  cursor: vaultLoading ? 'not-allowed' : 'pointer',
                  fontSize: '0.8125rem',
                  color: 'var(--text-secondary)',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                }}
              >
                {vaultLoading ? "Selecting..." : "📂 Use from vault"}
              </button>
            )}
          </div>
        )}
      </div>

      {showVaultPicker && (
        <div style={{ marginTop: '0.75rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
          <div style={{ padding: '0.625rem 0.75rem', background: 'var(--off-white)', borderBottom: '1px solid var(--border)', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--midnight)' }}>
            Select a document from your vault
          </div>
          {vaultDocs.length === 0 ? (
            <p style={{ padding: '1rem', fontSize: '0.8125rem', color: 'var(--text-muted)', textAlign: 'center' }}>
              No documents in vault. Upload documents first.
            </p>
          ) : (
            vaultDocs.map((vd: any, i: number) => {
              const expiryInfo = getExpiryStatus(vd.expiry_date);
              const isExpiredOrSoon = expiryInfo && expiryInfo.level !== "none";
              return (
                <div key={i} style={{ padding: '0.75rem', borderBottom: i < vaultDocs.length - 1 ? '1px solid var(--gray-100)' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}>
                  <div>
                    <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--midnight)' }}>{vd.document_name}</p>
                    {expiryInfo ? (
                      <p style={{
                        fontSize: '0.75rem',
                        marginTop: '0.125rem',
                        color: expiryInfo.level === "expired" ? 'var(--danger)'
                             : expiryInfo.level === "soon" ? '#B45309'
                             : 'var(--text-muted)',
                        fontWeight: isExpiredOrSoon ? 600 : 400,
                      }}>
                        {expiryInfo.level === "expired" ? `⛔ ${expiryInfo.label}` : expiryInfo.label}
                      </p>
                    ) : (
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>No expiry date</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleUseVaultDoc(vd)}
                    disabled={vaultLoading}
                    style={{
                      padding: '0.375rem 0.75rem',
                      background: vaultLoading ? 'var(--gray-300)' : 'var(--teal)',
                      border: 'none',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: 'var(--midnight)',
                      cursor: vaultLoading ? 'not-allowed' : 'pointer',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                    }}
                  >
                    Use this document
                  </button>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
