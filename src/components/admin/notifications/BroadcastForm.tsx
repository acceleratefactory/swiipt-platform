"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";

const targetOptions = [
  { value: "all", label: "All users" },
  { value: "destination", label: "By destination" },
  { value: "category", label: "By goal category" },
  { value: "score_range", label: "By Mobility Score" },
  { value: "individual", label: "Individual user" },
];

export default function BroadcastForm({ onSent: _onSent }: { onSent?: () => void }) {
  const [target, setTarget] = useState<string>("all");
  const [targetValue, setTargetValue] = useState("");
  const [scoreMin, setScoreMin] = useState("");
  const [scoreMax, setScoreMax] = useState("");
  const [channel, setChannel] = useState<string>("both");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [actionUrl, setActionUrl] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [preview, setPreview] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function resetForm() {
    setTarget("all");
    setTargetValue("");
    setScoreMin("");
    setScoreMax("");
    setChannel("both");
    setTitle("");
    setBody("");
    setActionUrl("");
    setScheduleTime("");
    setPreview(false);
  }

  async function handleSend() {
    setError("");
    setSuccess("");
    if (!title.trim()) { setError("Title is required"); return; }
    if (!body.trim()) { setError("Body is required"); return; }
    if (body.length > 140) { setError("Body must be 140 characters or fewer"); return; }

    setSending(true);
    try {
      const payload: any = {
        target,
        channel,
        title: title.trim(),
        body: body.trim(),
        actionUrl: actionUrl.trim() || null,
        scheduleTime: scheduleTime || null,
      };

      if (target === "destination") payload.destination = targetValue;
      else if (target === "category") payload.category = targetValue;
      else if (target === "score_range") {
        payload.scoreMin = scoreMin ? Number(scoreMin) : null;
        payload.scoreMax = scoreMax ? Number(scoreMax) : null;
      } else if (target === "individual") payload.email = targetValue;

      const res = await fetch("/api/admin/notifications/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send");
      setSuccess(`Notification sent to ${data.recipientCount || 0} user(s)!`);
      resetForm();
      _onSent?.();
    } catch (err: any) {
      setError(err.message || "Failed to send notification");
    } finally {
      setSending(false);
    }
  }

  return (
    <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', padding: '1.5rem' }}>
      <h2 style={{ fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', fontSize: '1rem', fontWeight: 700, color: 'var(--midnight)', marginBottom: '1.25rem' }}>
        Compose Broadcast
      </h2>

      {error && (
        <p style={{ fontSize: '0.8125rem', color: '#EF4444', marginBottom: '1rem', padding: '0.625rem 0.875rem', background: '#FEF2F2', borderRadius: 'var(--radius-sm)' }}>{error}</p>
      )}
      {success && (
        <p style={{ fontSize: '0.8125rem', color: 'var(--teal)', marginBottom: '1rem', padding: '0.625rem 0.875rem', background: 'var(--teal-pale)', borderRadius: 'var(--radius-sm)' }}>{success}</p>
      )}

      {/* Target selector */}
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--midnight)', display: 'block', marginBottom: '0.5rem' }}>Send to:</label>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {targetOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => setTarget(opt.value)}
              style={{ padding: '0.5rem 0.875rem', borderRadius: '20px', border: target === opt.value ? '2px solid var(--teal)' : '1px solid var(--border)', background: target === opt.value ? 'var(--teal-pale)' : 'white', color: target === opt.value ? 'var(--teal)' : 'var(--text-secondary)', fontSize: '0.8125rem', cursor: 'pointer', fontWeight: target === opt.value ? 600 : 400 }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Conditional target value fields */}
      {target === "destination" && (
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Destination name</label>
          <input value={targetValue} onChange={e => setTargetValue(e.target.value)} placeholder="e.g. UAE" style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem' }} />
        </div>
      )}

      {target === "category" && (
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Goal category</label>
          <select value={targetValue} onChange={e => setTargetValue(e.target.value)} style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', background: 'white' }}>
            <option value="">Select category</option>
            <option value="work_visa">Work Visa</option>
            <option value="residency_permit">Residency Permit</option>
            <option value="remote_work_visa">Remote Work Visa</option>
            <option value="holiday_package">Holiday Package</option>
            <option value="second_citizenship">Second Citizenship</option>
            <option value="company_registration">Company Registration</option>
            <option value="relocation_concierge">Relocation Concierge</option>
          </select>
        </div>
      )}

      {target === "score_range" && (
        <div style={{ marginBottom: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Min score</label>
            <input value={scoreMin} onChange={e => setScoreMin(e.target.value)} type="number" placeholder="0" style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem' }} />
          </div>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Max score</label>
            <input value={scoreMax} onChange={e => setScoreMax(e.target.value)} type="number" placeholder="1000" style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem' }} />
          </div>
        </div>
      )}

      {target === "individual" && (
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>User email</label>
          <input value={targetValue} onChange={e => setTargetValue(e.target.value)} type="email" placeholder="user@example.com" style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem' }} />
        </div>
      )}

      {/* Message */}
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--midnight)', display: 'block', marginBottom: '0.5rem' }}>Message</label>
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Notification title" style={{ width: '100%', padding: '0.625rem 0.875rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem' }} />
          <div>
            <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Notification body..." rows={3} maxLength={140} style={{ width: '100%', padding: '0.625rem 0.875rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', resize: 'vertical', fontFamily: 'inherit' }} />
            <p style={{ fontSize: '0.7rem', color: body.length > 140 ? '#EF4444' : 'var(--text-muted)', textAlign: 'right', marginTop: '0.25rem' }}>
              {body.length}/140
            </p>
          </div>
          <input value={actionUrl} onChange={e => setActionUrl(e.target.value)} placeholder="Action URL (optional, e.g. /dashboard/rewards)" style={{ width: '100%', padding: '0.625rem 0.875rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem' }} />
        </div>
      </div>

      {/* Channel */}
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--midnight)', display: 'block', marginBottom: '0.5rem' }}>Channel</label>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {[
            { value: "both", label: "Both" },
            { value: "in_app", label: "In-app only" },
            { value: "email", label: "Email only" },
          ].map(opt => (
            <button
              key={opt.value}
              onClick={() => setChannel(opt.value)}
              style={{ padding: '0.5rem 1rem', borderRadius: '20px', border: channel === opt.value ? '2px solid var(--teal)' : '1px solid var(--border)', background: channel === opt.value ? 'var(--teal-pale)' : 'white', color: channel === opt.value ? 'var(--teal)' : 'var(--text-secondary)', fontSize: '0.8125rem', cursor: 'pointer', fontWeight: channel === opt.value ? 600 : 400 }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Schedule */}
      <div style={{ marginBottom: '1.25rem' }}>
        <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Schedule (optional)</label>
        <input value={scheduleTime} onChange={e => setScheduleTime(e.target.value)} type="datetime-local" style={{ padding: '0.5rem 0.75rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem' }} />
      </div>

      {/* Preview */}
      <div style={{ marginBottom: '1.25rem' }}>
        <button
          onClick={() => setPreview(!preview)}
          style={{ padding: '0.5rem 1rem', background: 'var(--off-white)', color: 'var(--midnight)', fontWeight: 600, fontSize: '0.8125rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', cursor: 'pointer' }}
        >
          {preview ? "Hide preview" : "Show preview"}
        </button>

        {preview && (
          <div style={{ marginTop: '0.75rem', padding: '1rem', background: 'var(--off-white)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--teal-pale)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.875rem', flexShrink: 0 }}>
                📬
              </div>
              <div>
                <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--midnight)' }}>{title || "Notification title"}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{body || "Notification body"}</p>
                {actionUrl && <p style={{ fontSize: '0.7rem', color: 'var(--teal)', marginTop: '0.25rem' }}>→ {actionUrl}</p>}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Send */}
      <button
        onClick={handleSend}
        disabled={sending}
        style={{ padding: '0.75rem 1.5rem', background: 'var(--midnight)', color: 'white', fontWeight: 700, fontSize: '0.875rem', borderRadius: 'var(--radius-md)', border: 'none', cursor: sending ? 'not-allowed' : 'pointer', opacity: sending ? 0.6 : 1 }}
      >
        {sending ? "Sending..." : "Send notification"}
      </button>
    </div>
  );
}
/* eslint-enable @typescript-eslint/no-explicit-any */
