"use client";
import { useState } from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function CorporateClientForm({ client, onClose, onSaved }: { client: any | null; onClose: () => void; onSaved: (client: any) => void }) {
  const [companyName, setCompanyName] = useState(client?.company_name || "");
  const [contactName, setContactName] = useState(client?.contact_name || "");
  const [contactEmail, setContactEmail] = useState(client?.contact_email || "");
  const [contactPhone, setContactPhone] = useState(client?.contact_phone || "");
  const [retainerCurrency, setRetainerCurrency] = useState(client?.retainer_currency || "NGN");
  const [retainerAmount, setRetainerAmount] = useState(client?.retainer_amount?.toString() || "");
  const [status, setStatus] = useState(client?.status || "prospect");
  const [notes, setNotes] = useState(client?.notes || "");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!companyName.trim() || !contactName.trim() || !contactEmail.trim()) return;
    setSubmitting(true);
    const res = await fetch("/api/admin/corporate/upsert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: client?.id || null,
        company_name: companyName,
        contact_name: contactName,
        contact_email: contactEmail,
        contact_phone: contactPhone,
        retainer_currency: retainerCurrency,
        retainer_amount: retainerAmount ? Number(retainerAmount) : null,
        status,
        notes,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      onSaved({ ...client, id: data.clientId || client?.id, company_name: companyName, contact_name: contactName, contact_email: contactEmail, contact_phone: contactPhone, retainer_currency: retainerCurrency, retainer_amount: retainerAmount ? Number(retainerAmount) : null, status, notes });
    }
    setSubmitting(false);
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "1rem" }} onClick={onClose}>
      <div style={{ background: "white", borderRadius: "var(--radius-lg)", padding: "1.5rem", width: "100%", maxWidth: 480, maxHeight: "80vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
        <h2 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1.125rem", fontWeight: 700, color: "var(--midnight)", marginBottom: "1.25rem" }}>
          {client ? "Edit client" : "Add new client"}
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.25rem" }}>Company name *</label>
            <input value={companyName} onChange={e => setCompanyName(e.target.value)} style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", fontSize: "0.8125rem" }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.25rem" }}>Contact name *</label>
            <input value={contactName} onChange={e => setContactName(e.target.value)} style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", fontSize: "0.8125rem" }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.25rem" }}>Contact email *</label>
            <input value={contactEmail} onChange={e => setContactEmail(e.target.value)} style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", fontSize: "0.8125rem" }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.25rem" }}>Contact phone</label>
            <input value={contactPhone} onChange={e => setContactPhone(e.target.value)} style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", fontSize: "0.8125rem" }} />
          </div>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.25rem" }}>Retainer currency</label>
              <select value={retainerCurrency} onChange={e => setRetainerCurrency(e.target.value)} style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", fontSize: "0.8125rem" }}>
                {["NGN", "USD", "EUR", "GBP", "AED", "CAD", "QAR"].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.25rem" }}>Retainer amount</label>
              <input type="number" value={retainerAmount} onChange={e => setRetainerAmount(e.target.value)} style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", fontSize: "0.8125rem" }} />
            </div>
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.25rem" }}>Status</label>
            <select value={status} onChange={e => setStatus(e.target.value)} style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", fontSize: "0.8125rem" }}>
              <option value="prospect">Prospect</option>
              <option value="active">Active</option>
              <option value="lapsed">Lapsed</option>
            </select>
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.25rem" }}>Notes (internal)</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", fontSize: "0.8125rem", resize: "vertical" }} />
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", marginTop: "1.25rem" }}>
          <button onClick={onClose} style={{ padding: "0.5rem 1rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", background: "white", fontSize: "0.8125rem", cursor: "pointer" }}>
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !companyName.trim() || !contactName.trim() || !contactEmail.trim()}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "var(--radius-md)",
              border: "none",
              background: "var(--midnight)",
              color: "white",
              fontSize: "0.8125rem",
              fontWeight: 600,
              cursor: submitting || !companyName.trim() || !contactName.trim() || !contactEmail.trim() ? "not-allowed" : "pointer",
              opacity: submitting || !companyName.trim() || !contactName.trim() || !contactEmail.trim() ? 0.6 : 1,
            }}
          >
            {submitting ? "Saving…" : client ? "Save changes" : "Add client"}
          </button>
        </div>
      </div>
    </div>
  );
}
