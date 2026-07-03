"use client";
import { useState } from "react";

const certificateTypeNames: Record<string, string> = {
  proof_of_funds: "Proof of Funds",
  trust: "Trust",
};

const statusConfig: Record<string, { bg: string; color: string; label: string }> = {
  valid: { bg: 'var(--teal-pale)', color: 'var(--teal)', label: 'Valid' },
  revoked: { bg: '#FEF2F2', color: '#EF4444', label: 'Revoked' },
  expired: { bg: '#F3F4F6', color: '#6B7280', label: 'Expired' },
};

function getStatus(cert: any): string {
  if (!cert.is_valid) return "revoked";
  if (cert.expires_at && new Date(cert.expires_at) < new Date()) return "expired";
  return "valid";
}

export default function CertificatesTable({ certificates }: { certificates: any[] }) {
  const [statusFilter, setStatusFilter] = useState("all");
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const filtered = statusFilter === "all"
    ? certificates
    : certificates.filter(c => getStatus(c) === statusFilter);

  const uniqueStatuses = ["all", "valid", "revoked", "expired"];

  async function handleRevoke(certId: string) {
    setRevokingId(certId);
    try {
      const res = await fetch("/api/admin/certificates/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ certificateId: certId }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Failed to revoke certificate");
      } else {
        window.location.reload();
      }
    } catch {
      alert("Network error");
    } finally {
      setRevokingId(null);
    }
  }

  return (
    <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', overflow: 'hidden' }}>
      <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {uniqueStatuses.map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            style={{
              padding: '0.375rem 0.75rem',
              borderRadius: '20px',
              border: '1px solid var(--border)',
              background: statusFilter === s ? 'var(--midnight)' : 'transparent',
              color: statusFilter === s ? 'white' : 'var(--text-secondary)',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              textTransform: 'capitalize',
            }}
          >
            {s === "all" ? "All" : s}
          </button>
        ))}
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--off-white)' }}>
              <th style={{ textAlign: 'left', padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--midnight)' }}>Certificate</th>
              <th style={{ textAlign: 'left', padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--midnight)' }}>Type</th>
              <th style={{ textAlign: 'left', padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--midnight)' }}>User</th>
              <th style={{ textAlign: 'left', padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--midnight)' }}>Issued</th>
              <th style={{ textAlign: 'left', padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--midnight)' }}>Expires</th>
              <th style={{ textAlign: 'left', padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--midnight)' }}>Status</th>
              <th style={{ textAlign: 'right', padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--midnight)' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(cert => {
              const status = getStatus(cert);
              const sc = statusConfig[status] || statusConfig.expired;
              const isRevoking = revokingId === cert.id;
              return (
                <tr key={cert.id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <p style={{ fontWeight: 600, color: 'var(--midnight)', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                      {cert.certificate_number}
                    </p>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: 'var(--midnight)' }}>
                    {certificateTypeNames[cert.certificate_type] || cert.certificate_type.replace(/_/g, ' ')}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <p style={{ color: 'var(--midnight)' }}>{cert.user?.full_name || 'N/A'}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{cert.user?.email}</p>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                    {new Date(cert.issued_at || cert.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                    {cert.expires_at
                      ? new Date(cert.expires_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
                      : '—'}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: '20px', background: sc.bg, color: sc.color }}>
                      {sc.label}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                    {status === "valid" ? (
                      <button
                        onClick={() => handleRevoke(cert.id)}
                        disabled={isRevoking}
                        style={{
                          padding: '0.375rem 0.75rem',
                          borderRadius: 'var(--radius-sm)',
                          background: isRevoking ? '#F3F4F6' : '#FEF2F2',
                          color: isRevoking ? '#9CA3AF' : '#EF4444',
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          border: 'none',
                          cursor: isRevoking ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {isRevoking ? 'Revoking...' : 'Revoke'}
                      </button>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          No certificates found.
        </p>
      )}
    </div>
  );
}
