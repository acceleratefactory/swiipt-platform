"use client";

import { useEffect, useState } from "react";

interface ServicePackage {
  id: string;
  name: string;
  destination: string;
  price_ngn: number;
  price_usd: number;
  price_aed: number;
  price_qar: number;
  price_gbp: number;
}

interface DirectPaymentFlowProps {
  pkg: ServicePackage;
  preferredCurrency: string;
  onComplete: (result: { orderId: string; orderReference: string; finalPrice: number; paymentMethod: string }) => void;
}

export default function DirectPaymentFlow({ pkg, preferredCurrency, onComplete }: DirectPaymentFlowProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [orderData, setOrderData] = useState<any>(null);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    async function initiate() {
      const res = await fetch("/api/services/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageId: pkg.id,
          paymentMethod: "direct_payment",
          currency: preferredCurrency,
        }),
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data: any = await res.json();
      if (res.ok) setOrderData(data);
    }
    initiate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!orderData) return <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Generating payment details...</div>;

  return (
    <div>
      <h3 style={{ fontWeight: 700, color: 'var(--midnight)', marginBottom: '1rem' }}>Transfer details</h3>

      <div style={{ background: 'var(--off-white)', borderRadius: 'var(--radius-md)', padding: '1.25rem', marginBottom: '1rem' }}>
        {[
          { label: 'Amount', value: `${preferredCurrency} ${orderData.finalPrice.toLocaleString()}` },
          { label: 'Bank', value: orderData.bankDetails?.bank_name || '—' },
          { label: 'Account number', value: orderData.bankDetails?.bank_account_number || '—' },
          { label: 'Account name', value: orderData.bankDetails?.bank_account_name || '—' },
        ].map(item => (
          <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--gray-100)', fontSize: '0.875rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>{item.label}</span>
            <span style={{ fontWeight: 600, color: 'var(--midnight)' }}>{item.value}</span>
          </div>
        ))}
      </div>

      <div style={{ background: 'var(--midnight)', borderRadius: 'var(--radius-md)', padding: '1rem', marginBottom: '1rem' }}>
        <p style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginBottom: '0.25rem' }}>Order reference</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--teal)', fontFamily: 'monospace' }}>
            {orderData.orderReference}
          </span>
          <button onClick={() => navigator.clipboard.writeText(orderData.orderReference)} style={{ fontSize: '0.75rem', padding: '0.25rem 0.625rem', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}>
            Copy
          </button>
        </div>
      </div>

      <div style={{ background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 'var(--radius-md)', padding: '0.875rem', marginBottom: '1.25rem', fontSize: '0.8125rem', color: '#92400E' }}>
        ⚠️ Include reference <strong>{orderData.orderReference}</strong> in your transfer narration.
      </div>

      <button
        onClick={async () => {
          setConfirming(true);
          await fetch("/api/services/direct-payment/confirm", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId: orderData.orderId }),
          });
          onComplete(orderData);
          setConfirming(false);
        }}
        disabled={confirming}
        style={{ width: '100%', padding: '0.875rem', background: 'var(--teal)', color: 'var(--midnight)', fontWeight: 700, borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer' }}
      >
        {confirming ? "Submitting..." : "I Have Transferred the Payment ✓"}
      </button>
    </div>
  );
}
