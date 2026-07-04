"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import AffiliateTierBadge from "./AffiliateTierBadge";

export default function AffiliateHub({ status }: { status: any }) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const initialized = useRef(false);

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
            <p style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--teal)' }}>₦{(status.total_earned_ngn || 0).toLocaleString()}</p>
          </div>
          <div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Pending</p>
            <p style={{ fontSize: '1.25rem', fontWeight: 800, color: '#D97706' }}>₦{(status.pending_earnings_ngn || 0).toLocaleString()}</p>
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
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          {status.pending_earnings_ngn > 0
            ? `You have ₦${(status.pending_earnings_ngn || 0).toLocaleString()} in pending earnings.`
            : "No pending earnings yet. Share your link to start earning."}
        </p>
        {status.pending_earnings_ngn >= 1000 && status.tier !== "starter" && (
          <form action="/api/affiliate/withdraw" method="POST" style={{ marginTop: '0.75rem' }}>
            <input type="hidden" name="amount" value={status.pending_earnings_ngn} />
            <button type="submit" style={{ padding: '0.5rem 1.25rem', background: 'var(--teal)', color: 'white', fontWeight: 600, fontSize: '0.8125rem', borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer' }}>
              Withdraw ₦{(status.pending_earnings_ngn || 0).toLocaleString()}
            </button>
          </form>
        )}
      </div>

      {/* Section 4: Quick Stats */}
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
            <p style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--midnight)' }}>₦{(status.withdrawn_earnings_ngn || 0).toLocaleString()}</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Withdrawn</p>
          </div>
        </div>
      </div>
    </div>
  );
}
