"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import AffiliateTierBadge from "./AffiliateTierBadge";

export default function AffiliateHub({ status, withdrawals }: { status: any; withdrawals: any[] }) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const initialized = useRef(false);

  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);
  const [withdrawError, setWithdrawError] = useState("");

  useEffect(() => {
    if (status.id || initialized.current) return;
    initialized.current = true;
    fetch("/api/affiliate/init", { method: "POST" }).then(res => { if (res.ok) router.refresh(); }).catch(() => {});
  }, [status.id, router]);

  const referralLink = `${window.location.origin}/signup?ref=${status.custom_affiliate_code || ""}`;

  function handleCopy() {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleWithdraw() {
    setWithdrawing(true);
    setWithdrawError("");
    try {
      const res = await fetch("/api/affiliate/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: status.pending_earnings_ngn }),
      });
      if (res.ok) {
        setWithdrawSuccess(true);
        router.refresh();
      } else {
        const data = await res.json();
        setWithdrawError(data.error || "Withdrawal failed");
      }
    } catch {
      setWithdrawError("Network error — please try again");
    }
    setWithdrawing(false);
  }

  function formatNgn(n: number | string | null | undefined) {
    return `₦${(Number(n) || 0).toLocaleString()}`;
  }

  function fmtDate(dateStr: string | null | undefined) {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
  }

  return (
    <div>
      {/* Section 1: Affiliate Status */}
      <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', padding: '1.5rem', marginBottom: '1.5rem' }}>
        <h2 style={{ fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', fontSize: '1.125rem', fontWeight: 700, color: 'var(--midnight)', marginBottom: '1rem' }}>
          Your Affiliate Status
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Total Earned</p>
            <p style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--teal)' }}>{formatNgn(status.total_earned_ngn)}</p>
          </div>
          <div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Pending</p>
            <p style={{ fontSize: '1.25rem', fontWeight: 800, color: '#D97706' }}>{formatNgn(status.pending_earnings_ngn)}</p>
          </div>
          <div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Conversion Rate</p>
            <p style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--midnight)' }}>{status.conversion_rate_pct || 0}%</p>
          </div>
          <div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Monthly Rank</p>
            <p style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--midnight)' }}>#{status.monthly_rank || "—"}</p>
          </div>
        </div>
        <AffiliateTierBadge tier={status.tier || "starter"} referrals={status.total_referrals || 0} />
      </div>

      {/* Section 2: Links and Tools */}
      <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', padding: '1.5rem', marginBottom: '1.5rem' }}>
        <h2 style={{ fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', fontSize: '1.125rem', fontWeight: 700, color: 'var(--midnight)', marginBottom: '1rem' }}>
          Your Affiliate Link
        </h2>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          <input readOnly value={referralLink} style={{ flex: 1, padding: '0.625rem 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontSize: '0.8125rem', background: 'var(--off-white)' }} />
          <button onClick={handleCopy} style={{ padding: '0.625rem 1.25rem', background: copied ? 'var(--teal)' : 'var(--midnight)', color: 'white', fontWeight: 600, fontSize: '0.8125rem', borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer' }}>
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <a href={`https://wa.me/?text=${encodeURIComponent(`Join me on Swiipt and start planning your move abroad: ${referralLink}`)}`} target="_blank" rel="noopener noreferrer" style={{ padding: '0.5rem 1rem', background: '#25D366', color: 'white', fontWeight: 600, fontSize: '0.8125rem', borderRadius: 'var(--radius-md)', textDecoration: 'none' }}>
            Share on WhatsApp
          </a>
          <a href="/dashboard/affiliate/tools" style={{ padding: '0.5rem 1rem', color: 'var(--teal)', fontWeight: 600, fontSize: '0.8125rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', textDecoration: 'none' }}>
            More tools →
          </a>
        </div>
      </div>

      {/* Section 3: Pending Earnings */}
      <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', fontSize: '1.125rem', fontWeight: 700, color: 'var(--midnight)' }}>
            Pending Earnings
          </h2>
          <a href="/dashboard/affiliate/earnings" style={{ fontSize: '0.8125rem', color: 'var(--teal)', fontWeight: 600, textDecoration: 'none' }}>
            View all →
          </a>
        </div>

        {withdrawSuccess ? (
          <div style={{ padding: '1rem', borderRadius: 'var(--radius-md)', background: '#FEF3C7', border: '1px solid #F59E0B', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.25rem' }}>⏱</span>
            <div>
              <p style={{ fontWeight: 700, fontSize: '0.875rem', color: '#B45309' }}>Withdrawal requested — pending admin approval</p>
              <p style={{ fontSize: '0.75rem', color: '#B45309', marginTop: '0.125rem' }}>
                Your request has been submitted and is awaiting admin processing.
              </p>
            </div>
          </div>
        ) : (
          <>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              {status.pending_earnings_ngn > 0
                ? `You have ${formatNgn(status.pending_earnings_ngn)} in pending earnings.`
                : "No pending earnings yet. Share your link to start earning."}
            </p>
            {status.pending_earnings_ngn >= 1000 && status.tier !== "starter" && (
              <div style={{ marginTop: '0.75rem' }}>
                <button
                  onClick={handleWithdraw}
                  disabled={withdrawing}
                  style={{ padding: '0.5rem 1.25rem', background: withdrawing ? 'var(--text-muted)' : 'var(--teal)', color: 'white', fontWeight: 600, fontSize: '0.8125rem', borderRadius: 'var(--radius-md)', border: 'none', cursor: withdrawing ? 'not-allowed' : 'pointer' }}
                >
                  {withdrawing ? "Requesting..." : `Withdraw ${formatNgn(status.pending_earnings_ngn)}`}
                </button>
                {withdrawError && (
                  <p style={{ fontSize: '0.75rem', color: 'var(--danger)', marginTop: '0.5rem' }}>{withdrawError}</p>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Section 4: Withdrawal History */}
      {withdrawals.length > 0 && (
        <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', padding: '1.5rem', marginBottom: '1.5rem' }}>
          <h2 style={{ fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', fontSize: '1.125rem', fontWeight: 700, color: 'var(--midnight)', marginBottom: '1rem' }}>
            Withdrawal History
          </h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--off-white)' }}>
                  <th style={{ textAlign: 'left', padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--midnight)' }}>Date</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--midnight)' }}>Amount</th>
                  <th style={{ textAlign: 'center', padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--midnight)' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {withdrawals.map((w: any) => (
                  <tr key={w.id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)' }}>{fmtDate(w.requested_at)}</td>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--midnight)' }}>{formatNgn(w.amount_ngn)}</td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                      <span style={{
                        fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: '20px',
                        background: w.status === 'approved' ? 'var(--teal-pale)' : w.status === 'rejected' ? '#FEF2F2' : '#FEF3C7',
                        color: w.status === 'approved' ? 'var(--teal)' : w.status === 'rejected' ? 'var(--danger)' : '#B45309',
                      }}>
                        {w.status === 'approved' ? 'Approved' : w.status === 'rejected' ? 'Rejected' : 'Pending'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Section 5: Quick Stats */}
      <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', padding: '1.5rem' }}>
        <h2 style={{ fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', fontSize: '1.125rem', fontWeight: 700, color: 'var(--midnight)', marginBottom: '1rem' }}>
          Quick Stats
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1rem' }}>
          <div>
            <p style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--midnight)' }}>{status.total_referrals || 0}</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Referrals</p>
          </div>
          <div>
            <p style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--midnight)' }}>{status.converting_referrals || 0}</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Converted</p>
          </div>
          <div>
            <p style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--midnight)' }}>{status.modules_completed || 0}</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Modules Done</p>
          </div>
          <div>
            <p style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--midnight)' }}>{formatNgn(status.withdrawn_earnings_ngn)}</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Withdrawn</p>
          </div>
        </div>
      </div>
    </div>
  );
}
