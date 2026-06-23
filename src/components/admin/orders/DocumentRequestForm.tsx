"use client";
import { useState } from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function DocumentRequestForm({ orderId, existingDocs, onSubmit }: { orderId: string; existingDocs: any[]; onSubmit: () => void }) {
  const [rows, setRows] = useState([{ document_name: "", instructions: "" }]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function addRow() {
    setRows(prev => [...prev, { document_name: "", instructions: "" }]);
  }

  function removeRow(index: number) {
    setRows(prev => prev.filter((_, i) => i !== index));
  }

  function updateRow(index: number, field: "document_name" | "instructions", value: string) {
    setRows(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }

  async function handleSubmit() {
    const valid = rows.filter(r => r.document_name.trim());
    if (valid.length === 0) return;
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/admin/orders/request-documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, documents: valid }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setError(err.error || "Failed to request documents");
        setSubmitting(false);
        return;
      }

      setRows([{ document_name: "", instructions: "" }]);
      setSubmitting(false);
      onSubmit();
    } catch {
      setError("Network error — please try again");
      setSubmitting(false);
    }
  }

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      {error && (
        <div style={{ padding: '0.625rem 0.875rem', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 'var(--radius-sm)', color: '#B91C1C', fontSize: '0.8125rem', marginBottom: '0.75rem' }}>
          {error}
        </div>
      )}
      <h3 style={{ fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', fontSize: '0.9375rem', fontWeight: 700, color: 'var(--midnight)', marginBottom: '0.75rem' }}>
        Request documents
      </h3>

      {existingDocs.length > 0 && (
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
          {existingDocs.length} document(s) already requested for this order.
        </p>
      )}

      {rows.map((row, index) => (
        <div key={index} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <input
              type="text"
              placeholder="Document name (required)"
              value={row.document_name}
              onChange={e => updateRow(index, "document_name", e.target.value)}
              style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '0.8125rem', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <input
              type="text"
              placeholder="Instructions (optional)"
              value={row.instructions}
              onChange={e => updateRow(index, "instructions", e.target.value)}
              style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '0.8125rem', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          {rows.length > 1 && (
            <button onClick={() => removeRow(index)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '1rem', padding: '0.375rem' }}>
              ×
            </button>
          )}
        </div>
      ))}

      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
        <button onClick={addRow} style={{ padding: '0.5rem 1rem', background: 'var(--off-white)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', cursor: 'pointer' }}>
          + Add another
        </button>
        <button onClick={handleSubmit} disabled={submitting || rows.every(r => !r.document_name.trim())} style={{ padding: '0.5rem 1rem', background: submitting ? 'var(--gray-300)' : 'var(--teal)', border: 'none', borderRadius: 'var(--radius-sm)', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--midnight)', cursor: submitting ? 'not-allowed' : 'pointer' }}>
          {submitting ? "Sending..." : "Send request"}
        </button>
      </div>
    </div>
  );
}
