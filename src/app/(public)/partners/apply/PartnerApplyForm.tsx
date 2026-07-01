"use client";
import { useState } from "react";

const PARTNER_TYPES = [
  { value: "immigration_lawyer", label: "Immigration Lawyer" },
  { value: "visa_agent", label: "Visa Agent" },
  { value: "relocation_consultant", label: "Relocation Consultant" },
  { value: "trade_agent", label: "Trade Agent" },
  { value: "recruitment_agency", label: "Recruitment Agency" },
  { value: "education_consultant", label: "Education Consultant" },
];

export default function PartnerApplyForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [partnerType, setPartnerType] = useState("");
  const [cacNumber, setCacNumber] = useState("");
  const [licenceNumber, setLicenceNumber] = useState("");
  const [yearsInOperation, setYearsInOperation] = useState("");
  const [specialisations, setSpecialisations] = useState<string[]>([]);
  const [specialInput, setSpecialInput] = useState("");
  const [destinations, setDestinations] = useState<string[]>([]);
  const [destInput, setDestInput] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  function addSpecialisation() {
    const val = specialInput.trim();
    if (val && specialisations.length < 10 && !specialisations.includes(val)) {
      setSpecialisations([...specialisations, val]);
      setSpecialInput("");
    }
  }

  function removeSpecialisation(idx: number) {
    setSpecialisations(specialisations.filter((_, i) => i !== idx));
  }

  function addDestination() {
    const val = destInput.trim();
    if (val && destinations.length < 10 && !destinations.includes(val)) {
      setDestinations([...destinations, val]);
      setDestInput("");
    }
  }

  function removeDestination(idx: number) {
    setDestinations(destinations.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !email || !partnerType) return;
    setSubmitting(true);
    setResult(null);

    try {
      const form = new FormData();
      form.append("name", name);
      form.append("email", email);
      form.append("phone", phone);
      form.append("partnerType", partnerType);
      form.append("businessName", businessName);
      form.append("cacNumber", cacNumber);
      form.append("licenceNumber", licenceNumber);
      form.append("yearsInOperation", yearsInOperation);
      form.append("specialisations", JSON.stringify(specialisations));
      form.append("destinationsServed", JSON.stringify(destinations));
      for (const file of files) {
        form.append("verificationDocuments", file);
      }

      const res = await fetch("/api/partners/apply", { method: "POST", body: form });
      const data = await res.json();
      if (res.ok) {
        setResult({ success: true, message: "Application submitted! An admin will review it shortly." });
      } else {
        setResult({ success: false, message: data.error || "Submission failed" });
      }
    } catch {
      setResult({ success: false, message: "Network error" });
    }
    setSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} style={{ background: "white", borderRadius: "var(--radius-xl)", padding: "2rem", border: "1px solid var(--border)" }}>
      {result && (
        <div style={{ padding: "0.75rem", borderRadius: "var(--radius-md)", marginBottom: "1.5rem", fontSize: "0.875rem", fontWeight: 600, background: result.success ? "#D1FAE5" : "#FEE2E2", color: result.success ? "#065F46" : "#DC2626" }}>
          {result.message}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
        <div>
          <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "#374151", marginBottom: "0.375rem" }}>Full Name *</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required style={{ width: "100%", padding: "0.5rem 0.625rem", fontSize: "0.8125rem", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", outline: "none", boxSizing: "border-box" }} />
        </div>
        <div>
          <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "#374151", marginBottom: "0.375rem" }}>Email *</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ width: "100%", padding: "0.5rem 0.625rem", fontSize: "0.8125rem", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", outline: "none", boxSizing: "border-box" }} />
        </div>
        <div>
          <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "#374151", marginBottom: "0.375rem" }}>Phone</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} style={{ width: "100%", padding: "0.5rem 0.625rem", fontSize: "0.8125rem", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", outline: "none", boxSizing: "border-box" }} />
        </div>
        <div>
          <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "#374151", marginBottom: "0.375rem" }}>Partner Type *</label>
          <select value={partnerType} onChange={(e) => setPartnerType(e.target.value)} required style={{ width: "100%", padding: "0.5rem 0.625rem", fontSize: "0.8125rem", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", background: "white", outline: "none" }}>
            <option value="">Select type...</option>
            {PARTNER_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div>
          <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "#374151", marginBottom: "0.375rem" }}>Business Name</label>
          <input value={businessName} onChange={(e) => setBusinessName(e.target.value)} style={{ width: "100%", padding: "0.5rem 0.625rem", fontSize: "0.8125rem", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", outline: "none", boxSizing: "border-box" }} />
        </div>
        <div>
          <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "#374151", marginBottom: "0.375rem" }}>Years in Operation</label>
          <input type="number" min="0" value={yearsInOperation} onChange={(e) => setYearsInOperation(e.target.value)} style={{ width: "100%", padding: "0.5rem 0.625rem", fontSize: "0.8125rem", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", outline: "none", boxSizing: "border-box" }} />
        </div>
        <div>
          <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "#374151", marginBottom: "0.375rem" }}>CAC Number</label>
          <input value={cacNumber} onChange={(e) => setCacNumber(e.target.value)} style={{ width: "100%", padding: "0.5rem 0.625rem", fontSize: "0.8125rem", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", outline: "none", boxSizing: "border-box" }} />
        </div>
        <div>
          <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "#374151", marginBottom: "0.375rem" }}>Professional Licence #</label>
          <input value={licenceNumber} onChange={(e) => setLicenceNumber(e.target.value)} style={{ width: "100%", padding: "0.5rem 0.625rem", fontSize: "0.8125rem", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", outline: "none", boxSizing: "border-box" }} />
        </div>
      </div>

      {/* Specialisations */}
      <div style={{ marginBottom: "1.5rem" }}>
        <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "#374151", marginBottom: "0.375rem" }}>Specialisations</label>
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
          <input value={specialInput} onChange={(e) => setSpecialInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSpecialisation(); } }} placeholder="Type and press Enter" style={{ flex: 1, padding: "0.5rem 0.625rem", fontSize: "0.8125rem", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", outline: "none" }} />
          <button type="button" onClick={addSpecialisation} disabled={!specialInput.trim()} style={{ padding: "0.5rem 1rem", background: "var(--teal)", color: "var(--midnight)", fontWeight: 600, fontSize: "0.8125rem", border: "none", borderRadius: "var(--radius-sm)", cursor: specialInput.trim() ? "pointer" : "not-allowed", opacity: specialInput.trim() ? 1 : 0.5 }}>Add</button>
        </div>
        <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap" }}>
          {specialisations.map((s, i) => (
            <span key={i} style={{ padding: "0.25rem 0.5rem", background: "var(--teal)", color: "var(--midnight)", borderRadius: "var(--radius-sm)", fontSize: "0.75rem", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "0.375rem" }}>
              {s}
              <button type="button" onClick={() => removeSpecialisation(i)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, fontSize: "0.875rem", lineHeight: 1, color: "inherit" }}>×</button>
            </span>
          ))}
        </div>
      </div>

      {/* Destinations */}
      <div style={{ marginBottom: "1.5rem" }}>
        <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "#374151", marginBottom: "0.375rem" }}>Destinations Served</label>
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
          <input value={destInput} onChange={(e) => setDestInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addDestination(); } }} placeholder="Type country and press Enter" style={{ flex: 1, padding: "0.5rem 0.625rem", fontSize: "0.8125rem", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", outline: "none" }} />
          <button type="button" onClick={addDestination} disabled={!destInput.trim()} style={{ padding: "0.5rem 1rem", background: "var(--teal)", color: "var(--midnight)", fontWeight: 600, fontSize: "0.8125rem", border: "none", borderRadius: "var(--radius-sm)", cursor: destInput.trim() ? "pointer" : "not-allowed", opacity: destInput.trim() ? 1 : 0.5 }}>Add</button>
        </div>
        <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap" }}>
          {destinations.map((d, i) => (
            <span key={i} style={{ padding: "0.25rem 0.5rem", background: "#EFF6FF", color: "#1E40AF", borderRadius: "var(--radius-sm)", fontSize: "0.75rem", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "0.375rem" }}>
              {d}
              <button type="button" onClick={() => removeDestination(i)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, fontSize: "0.875rem", lineHeight: 1, color: "inherit" }}>×</button>
            </span>
          ))}
        </div>
      </div>

      {/* Document upload */}
      <div style={{ marginBottom: "1.5rem" }}>
        <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "#374151", marginBottom: "0.375rem" }}>Verification Documents (PDF/images)</label>
        <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setFiles(Array.from(e.target.files || []))} style={{ fontSize: "0.8125rem" }} />
        {files.length > 0 && (
          <div style={{ marginTop: "0.5rem", fontSize: "0.75rem", color: "#6B7280" }}>
            {files.length} file{files.length > 1 ? "s" : ""} selected
          </div>
        )}
      </div>

      <button type="submit" disabled={submitting} style={{ width: "100%", padding: "0.75rem", background: submitting ? "#9CA3AF" : "var(--teal)", color: "var(--midnight)", fontWeight: 700, fontSize: "0.9375rem", border: "none", borderRadius: "var(--radius-md)", cursor: submitting ? "not-allowed" : "pointer" }}>
        {submitting ? "Submitting..." : "Submit Application"}
      </button>
    </form>
  );
}
