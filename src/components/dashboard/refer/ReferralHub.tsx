"use client";
import { useState } from "react";

export default function ReferralHub({ referralCode }: { referralCode: string }) {
  const [copied, setCopied] = useState(false);
  const referralUrl = `${typeof window !== 'undefined' ? window.location.origin : 'https://swiipt.com'}/signup?ref=${referralCode}`;

  return (
    <div style={{ background: 'linear-gradient(135deg, var(--midnight), var(--midnight-muted))', borderRadius: 'var(--radius-xl)', padding: '2rem', marginBottom: '1rem', textAlign: 'center' }}>
      <p style={{ fontSize: '0.75rem', color: 'var(--teal)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
        Your referral code
      </p>
      <div style={{ fontFamily: 'monospace', fontSize: '2.25rem', fontWeight: 800, color: 'var(--teal)', letterSpacing: '0.1em', marginBottom: '1.25rem' }}>
        {referralCode}
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button
          onClick={() => { window.open(`https://wa.me/?text=Join me on Swiipt — save toward your travel and relocation goals. Use my code ${referralCode}: ${referralUrl}`); }}
          style={{ padding: '0.625rem 1.25rem', background: '#25D366', color: 'white', fontWeight: 700, fontSize: '0.875rem', borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer' }}
        >
          Share on WhatsApp
        </button>
        <button
          onClick={() => { navigator.clipboard.writeText(referralUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
          style={{ padding: '0.625rem 1.25rem', background: 'rgba(255,255,255,0.15)', color: 'white', fontWeight: 600, fontSize: '0.875rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.3)', cursor: 'pointer' }}
        >
          {copied ? "Copied ✓" : "Copy link"}
        </button>
      </div>

      <p style={{ fontSize: '0.8125rem', color: 'var(--gray-300)', marginTop: '1.25rem' }}>
        Earn 10% of every service fee from people you refer. Alumni earn cash — others earn service credits.
      </p>
    </div>
  );
}
