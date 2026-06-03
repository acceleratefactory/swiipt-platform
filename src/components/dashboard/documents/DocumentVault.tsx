"use client";
import { useState } from "react";

const vaultDocTypes = [
  { value: "passport", label: "International Passport" },
  { value: "birth_certificate", label: "Birth Certificate" },
  { value: "bank_statement", label: "Bank Statement" },
  { value: "educational_certificate", label: "Educational Certificate" },
  { value: "police_clearance", label: "Police Clearance Certificate" },
  { value: "medical_certificate", label: "Medical Certificate" },
  { value: "employment_letter", label: "Employment Letter" },
  { value: "other", label: "Other Document" },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function DocumentVault({ vaultDocs, userId: _userId }: { vaultDocs: any[]; userId: string }) {
  const [uploading, setUploading] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [docName, setDocName] = useState("");
  const [docType, setDocType] = useState("passport");
  const [expiryDate, setExpiryDate] = useState("");
  const [docs, setDocs] = useState(vaultDocs);

  async function handleVaultUpload(file: File) {
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("documentName", docName);
    formData.append("documentType", docType);
    formData.append("expiryDate", expiryDate);

    const res = await fetch("/api/documents/vault-upload", { method: "POST", body: formData });
    if (res.ok) {
      setDocs(prev => [...prev, { document_name: docName, document_type: docType, expiry_date: expiryDate }]);
      setShowUploadForm(false);
      setDocName("");
    }
    setUploading(false);
  }

  return (
    <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', overflow: 'hidden' }}>
      <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', fontSize: '1rem', fontWeight: 700, color: 'var(--midnight)' }}>
            Document vault
          </h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>
            Store your documents securely. Available for any future service application.
          </p>
        </div>
        <button
          onClick={() => setShowUploadForm(!showUploadForm)}
          style={{ padding: '0.5rem 1rem', background: 'var(--teal)', color: 'var(--midnight)', fontWeight: 700, fontSize: '0.8125rem', borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer' }}
        >
          + Upload
        </button>
      </div>

      {showUploadForm && (
        <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)', background: 'var(--off-white)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div>
              <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--midnight)', display: 'block', marginBottom: '0.375rem' }}>Document type</label>
              <select
                value={docType}
                onChange={e => setDocType(e.target.value)}
                style={{ width: '100%', padding: '0.625rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', outline: 'none' }}
              >
                {vaultDocTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--midnight)', display: 'block', marginBottom: '0.375rem' }}>Expiry date (optional)</label>
              <input
                type="date"
                value={expiryDate}
                onChange={e => setExpiryDate(e.target.value)}
                style={{ width: '100%', padding: '0.625rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', outline: 'none' }}
              />
            </div>
          </div>
          <div style={{ marginBottom: '0.75rem' }}>
            <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--midnight)', display: 'block', marginBottom: '0.375rem' }}>Label</label>
            <input
              type="text"
              value={docName}
              onChange={e => setDocName(e.target.value)}
              placeholder="e.g. International Passport — expires 2028"
              style={{ width: '100%', padding: '0.625rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', outline: 'none' }}
            />
          </div>
          <label style={{
            display: 'block', padding: '1.25rem', border: '2px dashed var(--border)',
            borderRadius: 'var(--radius-md)', textAlign: 'center', cursor: 'pointer',
            fontSize: '0.875rem', color: 'var(--text-muted)',
          }}>
            {uploading ? "Uploading..." : "Click to select file (PDF, JPG, PNG — max 10MB)"}
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              style={{ display: 'none' }}
              onChange={e => { const f = e.target.files?.[0]; if (f && docName && docType) handleVaultUpload(f); }}
              disabled={!docName || uploading}
            />
          </label>
        </div>
      )}

      {docs.length === 0 && !showUploadForm ? (
        <p style={{ padding: '1.5rem', fontSize: '0.875rem', color: 'var(--text-muted)', textAlign: 'center' }}>
          No documents in your vault. Upload documents to make future applications faster.
        </p>
      ) : (
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        docs.map((doc: any, index: number) => {
          const isExpiringSoon = doc.expiry_date &&
            new Date(doc.expiry_date) < new Date(Date.now() + 180 * 24 * 60 * 60 * 1000);
          return (
            <div key={index} style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid var(--gray-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--midnight)' }}>{doc.document_name}</p>
                {doc.expiry_date && (
                  <p style={{ fontSize: '0.75rem', color: isExpiringSoon ? 'var(--warning)' : 'var(--text-muted)', marginTop: '0.125rem' }}>
                    {isExpiringSoon ? '⚠️ Expires soon: ' : 'Expires: '}
                    {new Date(doc.expiry_date).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                )}
              </div>
              <span style={{ fontSize: '0.7rem', fontWeight: 600, padding: '2px 8px', borderRadius: '20px', background: 'var(--teal-pale)', color: 'var(--teal)' }}>
                Stored
              </span>
            </div>
          );
        })
      )}
    </div>
  );
}
