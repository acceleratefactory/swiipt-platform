"use client";

interface CertificateData {
  id: string;
  certificate_type: string;
  certificate_number: string;
  data_snapshot: Record<string, unknown>;
  is_valid: boolean;
  expires_at: string;
  issued_at: string;
  verification_url: string;
}

export default function VerificationPage({ certificate }: { certificate: CertificateData }) {
  const isExpired = !certificate.is_valid || new Date(certificate.expires_at) < new Date();
  const isValid = certificate.is_valid && !isExpired;
  const data = certificate.data_snapshot;

  return (
    <div style={{ background: "white", borderRadius: "var(--radius-xl)", padding: "2.5rem", maxWidth: "560px", width: "100%", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <div style={{ fontSize: "3rem", marginBottom: "0.75rem" }}>
          {isValid ? "✓" : "✕"}
        </div>
        <h1 style={{
          fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif",
          fontSize: "1.25rem", fontWeight: 800,
          color: isValid ? "var(--teal)" : "#DC2626",
          margin: "0 0 0.5rem 0",
        }}>
          {isValid ? "Certificate Verified" : "Certificate Invalid / Expired"}
        </h1>
        <p style={{ fontSize: "0.8125rem", color: "#6B7280", margin: 0 }}>
          {isValid
            ? "This certificate was issued by Swiipt Technologies Limited and is currently valid."
            : isExpired
              ? "This certificate has expired and is no longer valid."
              : "This certificate number could not be verified."}
        </p>
      </div>

      {/* Certificate details */}
      <div style={{ background: "var(--off-white)", borderRadius: "var(--radius-lg)", padding: "1.25rem", marginBottom: "1.25rem" }}>
        <h2 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "0.9375rem", fontWeight: 700, color: "var(--midnight)", margin: "0 0 1rem 0" }}>
          Certificate Details
        </h2>

        <DetailRow label="Certificate Number" value={certificate.certificate_number} mono />
        <DetailRow label="Type" value={certificate.certificate_type === "proof_of_funds" ? "Proof of Funds" : "Trust Certificate"} />
        <DetailRow label="Holder Name" value={(data.holder_name as string) || "—"} />
        <DetailRow label="Holder Email" value={(data.holder_email as string) || "—"} />
        <DetailRow label="Issue Date" value={new Date(certificate.issued_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })} />
        <DetailRow
          label={isExpired ? "Expired Date" : "Expiry Date"}
          value={new Date(certificate.expires_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
          color={isExpired ? "#DC2626" : undefined}
        />
        <DetailRow label="Status" value={isValid ? "✓ Valid" : "✕ Invalid / Expired"} color={isValid ? "var(--teal)" : "#DC2626"} />
      </div>

      {/* Certificate-specific data */}
      {certificate.certificate_type === "proof_of_funds" && (
        <div style={{ background: "var(--off-white)", borderRadius: "var(--radius-lg)", padding: "1.25rem", marginBottom: "1.25rem" }}>
          <h2 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "0.9375rem", fontWeight: 700, color: "var(--midnight)", margin: "0 0 1rem 0" }}>
            Financial Data
          </h2>
          <DetailRow label="Goal" value={(data.goal_name as string) || "—"} />
          <DetailRow label="Destination" value={(data.goal_destination as string) || "—"} />
          <DetailRow label="Current Balance" value={`₦${(data.current_balance_ngn as number || 0).toLocaleString()}`} />
          <DetailRow label="28-Day Min. Balance" value={`₦${(data.twenty_eight_day_min_balance_ngn as number || 0).toLocaleString()}`} />
          {Array.isArray(data.deposit_history_90_days) && (
            <div style={{ marginTop: "0.75rem" }}>
              <div style={{ fontSize: "0.6875rem", color: "#6B7280", marginBottom: "0.375rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Deposit History (90 days)
              </div>
              {(data.deposit_history_90_days as Array<{ amount: number; created_at: string }>).slice(0, 10).map((dep, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "#374151", padding: "0.25rem 0", borderBottom: "1px solid #E5E7EB" }}>
                  <span>{new Date(dep.created_at).toLocaleDateString()}</span>
                  <span style={{ fontWeight: 600 }}>₦{dep.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {certificate.certificate_type === "trust_certificate" && (
        <div style={{ background: "var(--off-white)", borderRadius: "var(--radius-lg)", padding: "1.25rem", marginBottom: "1.25rem" }}>
          <h2 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "0.9375rem", fontWeight: 700, color: "var(--midnight)", margin: "0 0 1rem 0" }}>
            Behavioral Data
          </h2>
          <DetailRow label="Platform Tenure" value={(data.platform_tenure_days as string) || "—"} />
          <DetailRow label="Deposit Consistency" value={`${(data.deposit_consistency_score as number || 0)}%`} />
          <DetailRow label="Services Completed" value={`${(data.services_completed as number || 0)}`} />
          <DetailRow label="Trust Score" value={`${(data.trust_score as number || 0)}/100`} />
        </div>
      )}

      {/* Footer */}
      <div style={{ textAlign: "center", paddingTop: "1rem", borderTop: "1px solid var(--border)" }}>
        <p style={{ fontSize: "0.75rem", color: "#9CA3AF", margin: "0 0 0.25rem 0" }}>
          Issued by Swiipt Technologies Limited, Lagos Nigeria
        </p>
        <p style={{ fontSize: "0.6875rem", color: "#9CA3AF", margin: 0 }}>
          Certificate #{certificate.certificate_number} · {new Date(certificate.issued_at).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}

function DetailRow({ label, value, mono, color }: { label: string; value: string; mono?: boolean; color?: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.375rem 0", borderBottom: "1px solid #E5E7EB", fontSize: "0.8125rem" }}>
      <span style={{ color: "#6B7280" }}>{label}</span>
      <span style={{ fontWeight: 600, color: color || "#374151", fontFamily: mono ? "monospace" : undefined, fontSize: mono ? "0.75rem" : undefined }}>
        {value}
      </span>
    </div>
  );
}
