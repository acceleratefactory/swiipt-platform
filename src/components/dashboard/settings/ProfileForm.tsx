"use client";
import { useState } from "react";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function ProfileForm({ profile, userId: _userId, userEmail }: { profile: any; userId: string; userEmail: string }) {
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [country, setCountry] = useState(profile?.country_of_residence || "Nigeria");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    if (!fullName.trim()) {
      setError("Full name cannot be empty.");
      return;
    }
    setSaving(true);
    setError("");
    setSaved(false);

    try {
      const res = await fetch("/api/settings/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: fullName.trim(), phone: phone.trim(), country }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to save. Please try again.");
        return;
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  function copyReferral() {
    if (profile?.referral_code) {
      navigator.clipboard.writeText(profile.referral_code);
    }
  }

  return (
    <div style={{ background: "white", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", padding: "1.5rem", marginBottom: "1.25rem" }}>
      <h2 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1rem", fontWeight: 700, color: "var(--midnight)", marginBottom: "1rem" }}>
        Personal Information
      </h2>

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div>
          <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.25rem" }}>Full name</label>
          <input value={fullName} onChange={e => setFullName(e.target.value)} style={{ width: "100%", padding: "0.625rem 0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", fontSize: "0.875rem" }} />
        </div>

        <div>
          <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.25rem" }}>Phone</label>
          <input value={phone} onChange={e => setPhone(e.target.value)} style={{ width: "100%", padding: "0.625rem 0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", fontSize: "0.875rem" }} />
        </div>

        <div>
          <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.25rem" }}>Country of residence</label>
          <input value={country} onChange={e => setCountry(e.target.value)} style={{ width: "100%", padding: "0.625rem 0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", fontSize: "0.875rem" }} />
        </div>

        <div>
          <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.25rem" }}>Email (read-only)</label>
          <input value={userEmail} disabled style={{ width: "100%", padding: "0.625rem 0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", fontSize: "0.875rem", background: "var(--gray-100)", color: "var(--text-muted)" }} />
        </div>

        <div>
          <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.25rem" }}>Referral code</label>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <input value={profile?.referral_code || "—"} disabled style={{ flex: 1, padding: "0.625rem 0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", fontSize: "0.875rem", fontFamily: "monospace", background: "var(--gray-100)", color: "var(--text-secondary)" }} />
            <button onClick={copyReferral} style={{ padding: "0.5rem 0.875rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", background: "white", fontSize: "0.75rem", cursor: "pointer", color: "var(--text-secondary)" }}>
              Copy
            </button>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            alignSelf: "flex-start",
            padding: "0.625rem 1.5rem",
            borderRadius: "var(--radius-md)",
            border: "none",
            background: saved ? "var(--teal)" : "var(--midnight)",
            color: "white",
            fontWeight: 600,
            fontSize: "0.875rem",
            cursor: "pointer",
          }}
        >
          {saving ? "Saving…" : saved ? "Saved ✓" : "Save changes"}
        </button>

        {error && (
          <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "var(--radius-md)", padding: "0.75rem 1rem", fontSize: "0.875rem", color: "var(--danger)", marginBottom: "1rem" }}>
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
