"use client";
import { useState } from "react";
import PrizeConvertModal from "./PrizeConvertModal";

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
export default function RewardsList({ rewards, userId, activeGoals }: { rewards: any[]; userId: string; activeGoals: any[] }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [convertModal, setConvertModal] = useState<any>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const unredeemedRewards = rewards.filter((r: any) => !r.redeemed && (!r.expires_at || new Date(r.expires_at) > new Date()));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const redeemedRewards = rewards.filter((r: any) => r.redeemed);

  if (unredeemedRewards.length === 0 && redeemedRewards.length === 0) {
    return (
      <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: '2rem', border: '1px solid var(--border)', marginBottom: '1rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          No rewards yet. Save consistently and refer friends to unlock rewards.
        </p>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: '1rem' }}>
      <h2 style={{ fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', fontSize: '1rem', fontWeight: 700, color: 'var(--midnight)', marginBottom: '1rem' }}>
        Your rewards
      </h2>

      {// eslint-disable-next-line @typescript-eslint/no-explicit-any
        unredeemedRewards.map((reward: any) => (
        <div key={reward.id} style={{ background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', padding: '1.25rem', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.625rem' }}>
            <div>
              <p style={{ fontWeight: 700, color: 'var(--midnight)', fontSize: '0.9375rem' }}>{reward.reward_label}</p>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.25rem', lineHeight: 1.4 }}>
                {reward.reward_value_description}
              </p>
            </div>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '3px 8px', borderRadius: '20px', background: 'var(--teal-pale)', color: 'var(--teal)', whiteSpace: 'nowrap', marginLeft: '0.75rem' }}>
              Available
            </span>
          </div>

          {reward.expires_at && (
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
              Expires {new Date(reward.expires_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          )}

          {reward.reward_type !== "service_discount" && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <a
                href="/dashboard/services"
                style={{ padding: '0.625rem', background: 'var(--teal)', color: 'var(--midnight)', fontWeight: 700, fontSize: '0.8125rem', borderRadius: 'var(--radius-sm)', textAlign: 'center', textDecoration: 'none' }}
              >
                Redeem
              </a>
              <button
                onClick={() => setConvertModal(reward)}
                style={{ padding: '0.625rem', background: 'var(--off-white)', color: 'var(--midnight)', fontWeight: 600, fontSize: '0.8125rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', cursor: 'pointer' }}
              >
                Convert to credit
              </button>
            </div>
          )}

          {reward.reward_type === "service_discount" && (
            <div style={{ padding: '0.625rem', background: 'var(--teal-pale)', color: 'var(--teal)', fontWeight: 600, fontSize: '0.8125rem', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
              ✓ Applied automatically when ordering a service
            </div>
          )}
        </div>
      ))}

      {redeemedRewards.length > 0 && (
        <details style={{ marginTop: '0.5rem' }}>
          <summary style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.5rem 0' }}>
            {redeemedRewards.length} redeemed reward{redeemedRewards.length > 1 ? 's' : ''}
          </summary>
          {// eslint-disable-next-line @typescript-eslint/no-explicit-any
            redeemedRewards.map((r: any) => (
            <div key={r.id} style={{ padding: '0.75rem', background: 'var(--gray-100)', borderRadius: 'var(--radius-md)', marginTop: '0.375rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{r.reward_label}</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Redeemed {new Date(r.redeemed_at).toLocaleDateString('en-NG')}</span>
            </div>
          ))}
        </details>
      )}

      {convertModal && (
        <PrizeConvertModal
          reward={convertModal}
          activeGoals={activeGoals}
          onClose={() => setConvertModal(null)}
          onConverted={() => {
            setConvertModal(null);
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}
/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
