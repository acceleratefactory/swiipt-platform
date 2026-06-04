"use client";
import { useState } from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function GiftToFriendFlow({ goal, onClose }: { goal: any; onClose: () => void }) {
  const [step, setStep] = useState(1);
  const [amount, setAmount] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientGoalId, setRecipientGoalId] = useState("");
  const [recipientGoalName, setRecipientGoalName] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<{ amount: number; recipientName: string } | null>(null);

  const max30Pct = Math.floor(goal.current_balance * 0.3);

  async function handleSearchRecipient() {
    setError("");
    try {
      const res = await fetch("/api/gifts/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          giverGoalId: goal.id,
          recipientEmail,
          recipientGoalId: "placeholder",
          amount: 0,
          message: "",
          _validateOnly: true,
        }),
      });
      if (res.ok) {
        // If it succeeds (which it won't since validation will fail on amount > 0 check)
        // This means the user exists - but the API doesn't have a lookup endpoint
        // Fall back to just moving to step 2 for now
      }
    } catch {}
    // For now, move to amount step after entering email
    setStep(2);
  }

  async function handleFindGoals() {
    setError("");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await import("@/lib/supabase/client")).createClient() as any;
    const { data: user } = await supabase.from("users").select("id, full_name").eq("email", recipientEmail).single();
    if (!user) { setError("Recipient not found. They must be a registered Swiipt user."); return; }
    setRecipientName(user.full_name);

    const { data: goals } = await supabase.from("savings_goals").select("id, goal_name").eq("user_id", user.id).eq("status", "active");
    if (!goals || goals.length === 0) { setError("Recipient has no active goals."); return; }
    if (goals.length === 1) {
      setRecipientGoalId(goals[0].id);
      setRecipientGoalName(goals[0].goal_name);
      setStep(3);
    } else {
      setStep(4); // goal selection step
    }
  }

  async function handleSend() {
    setSending(true);
    setError("");
    const res = await fetch("/api/gifts/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        giverGoalId: goal.id,
        recipientEmail,
        recipientGoalId,
        amount: Number(amount),
        message,
      }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); setSending(false); return; }
    setSuccess({ amount: Number(amount), recipientName: data.recipientName });
    setSending(false);
  }

  if (success) {
    const referralUrl = typeof window !== 'undefined'
      ? `${window.location.origin}/signup?ref=${(goal as any).referral_code || ''}`
      : 'https://swiipt.com/signup';
    return (
      <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', padding: '2rem', marginBottom: '1rem', textAlign: 'center' }}>
        <p style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🎁</p>
        <h3 style={{ fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', fontWeight: 700, color: 'var(--midnight)', marginBottom: '0.5rem' }}>
          Gift sent successfully!
        </h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          {goal.currency} {success.amount.toLocaleString()} sent to {success.recipientName}&apos;s goal.
        </p>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          Share your referral link so they can start saving too!
        </p>
        <button
          onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`${success.recipientName} just helped me save toward my goal on Swiipt! Start your own journey: ${referralUrl}`)}`)}
          style={{ padding: '0.625rem 1.25rem', background: '#25D366', color: 'white', fontWeight: 700, fontSize: '0.875rem', borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer', marginRight: '0.75rem' }}
        >
          Share on WhatsApp
        </button>
        <button onClick={onClose} style={{ padding: '0.625rem 1.25rem', background: 'var(--gray-100)', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.875rem', borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer' }}>
          Close
        </button>
      </div>
    );
  }

  return (
    <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', padding: '2rem', marginBottom: '1rem' }}>
      <h3 style={{ fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', fontWeight: 700, color: 'var(--midnight)', marginBottom: '0.5rem' }}>
        🎁 Gift to a friend
      </h3>
      <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
        Send funds from this goal to a friend&apos;s goal. Max {max30Pct.toLocaleString()} {goal.currency} per 30 days.
      </p>

      {step === 1 && (
        <div>
          <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--midnight)', display: 'block', marginBottom: '0.375rem' }}>
            Recipient email
          </label>
          <input
            type="email"
            value={recipientEmail}
            onChange={e => setRecipientEmail(e.target.value)}
            placeholder="friend@example.com"
            style={{ width: '100%', padding: '0.625rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', outline: 'none', marginBottom: '1rem', boxSizing: 'border-box' }}
          />
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={onClose} style={{ padding: '0.625rem 1.25rem', background: 'var(--gray-100)', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.875rem', borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer' }}>
              Cancel
            </button>
            <button onClick={handleFindGoals} disabled={!recipientEmail.includes('@')} style={{ padding: '0.625rem 1.25rem', background: !recipientEmail.includes('@') ? 'var(--gray-200)' : 'var(--teal)', color: !recipientEmail.includes('@') ? 'var(--text-muted)' : 'var(--midnight)', fontWeight: 700, fontSize: '0.875rem', borderRadius: 'var(--radius-md)', border: 'none', cursor: !recipientEmail.includes('@') ? 'not-allowed' : 'pointer' }}>
              Find recipient →
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Recipient: <strong>{recipientName || recipientEmail}</strong>
          </p>
          <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--midnight)', display: 'block', marginBottom: '0.375rem' }}>
            Amount ({goal.currency})
          </label>
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="0"
            min="1"
            max={max30Pct}
            style={{ width: '100%', padding: '0.625rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', outline: 'none', marginBottom: '0.5rem', boxSizing: 'border-box' }}
          />
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Max: {goal.currency} {max30Pct.toLocaleString()} (30% of balance)
          </p>
          <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--midnight)', display: 'block', marginBottom: '0.375rem' }}>
            Message (optional)
          </label>
          <input
            type="text"
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="A note for your friend..."
            style={{ width: '100%', padding: '0.625rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', outline: 'none', marginBottom: '1rem', boxSizing: 'border-box' }}
          />
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={() => setStep(1)} style={{ padding: '0.625rem 1.25rem', background: 'var(--gray-100)', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.875rem', borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer' }}>
              Back
            </button>
            <button
              onClick={() => { if (!recipientGoalId) { setStep(4); return; } setStep(5); }}
              disabled={!amount || Number(amount) < 1 || Number(amount) > max30Pct}
              style={{ padding: '0.625rem 1.25rem', background: (!amount || Number(amount) < 1 || Number(amount) > max30Pct) ? 'var(--gray-200)' : 'var(--teal)', color: (!amount || Number(amount) < 1 || Number(amount) > max30Pct) ? 'var(--text-muted)' : 'var(--midnight)', fontWeight: 700, fontSize: '0.875rem', borderRadius: 'var(--radius-md)', border: 'none', cursor: (!amount || Number(amount) < 1 || Number(amount) > max30Pct) ? 'not-allowed' : 'pointer' }}
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Select a goal for {recipientName}:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
            {/* Goals would be fetched and rendered here */}
          </div>
          <button onClick={() => setStep(2)} style={{ padding: '0.625rem 1.25rem', background: 'var(--gray-100)', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.875rem', borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer' }}>
            Back
          </button>
        </div>
      )}

      {step === 5 && (
        <div>
          <div style={{ background: 'var(--off-white)', borderRadius: 'var(--radius-md)', padding: '1rem', marginBottom: '1rem' }}>
            <p style={{ fontSize: '0.875rem', color: 'var(--midnight)', marginBottom: '0.5rem' }}>
              <strong>Recipient:</strong> {recipientName}
            </p>
            <p style={{ fontSize: '0.875rem', color: 'var(--midnight)', marginBottom: '0.5rem' }}>
              <strong>Amount:</strong> {goal.currency} {Number(amount).toLocaleString()}
            </p>
            <p style={{ fontSize: '0.875rem', color: 'var(--midnight)', marginBottom: '0.5rem' }}>
              <strong>Goal:</strong> {recipientGoalName}
            </p>
            {message && <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>"{message}"</p>}
          </div>
          {error && (
            <p style={{ fontSize: '0.8125rem', color: 'var(--danger)', marginBottom: '1rem', padding: '0.5rem 0.75rem', background: '#FEF2F2', borderRadius: 'var(--radius-sm)' }}>{error}</p>
          )}
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={() => setStep(2)} style={{ padding: '0.625rem 1.25rem', background: 'var(--gray-100)', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.875rem', borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer' }}>
              Back
            </button>
            <button onClick={handleSend} disabled={sending} style={{ padding: '0.625rem 1.25rem', background: sending ? 'var(--gray-200)' : 'var(--teal)', color: sending ? 'var(--text-muted)' : 'var(--midnight)', fontWeight: 700, fontSize: '0.875rem', borderRadius: 'var(--radius-md)', border: 'none', cursor: sending ? 'not-allowed' : 'pointer' }}>
              {sending ? "Sending..." : "Send gift ✓"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
