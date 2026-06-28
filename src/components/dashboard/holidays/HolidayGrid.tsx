"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import HolidayBookingFlow from "./HolidayBookingFlow";
import CreateGroupBuyModal from "@/components/dashboard/groups/CreateGroupBuyModal";

function getGradient(destination: string): string {
  const gradients: Record<string, string> = {
    "Maldives": "linear-gradient(135deg, #00b4d8, #0077b6)",
    "Dubai, UAE": "linear-gradient(135deg, #f7971e, #ffd200)",
    "Cape Town, South Africa": "linear-gradient(135deg, #27ae60, #2980b9)",
    "UK & France": "linear-gradient(135deg, #2c3e50, #4ca1af)",
    "Qatar": "linear-gradient(135deg, #8B4513, #D4A017)",
    "Turkey": "linear-gradient(135deg, #e74c3c, #f39c12)",
    "Kenya": "linear-gradient(135deg, #2ecc71, #e67e22)",
    "Portugal": "linear-gradient(135deg, #e74c3c, #3498db)",
  };
  return gradients[destination] || "linear-gradient(135deg, var(--midnight), var(--midnight-muted))";
}

const selectStyle: Record<string, string> = {
  padding: '0.625rem 1rem',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-md)',
  fontSize: '0.875rem',
  background: 'white',
  color: 'var(--midnight)',
  minWidth: '180px',
};

export default function HolidayGrid({ packages, preferredCurrency, activeGoals, userId }: { packages: any[]; preferredCurrency: string; activeGoals: any[]; userId: string }) {
  const [destination, setDestination] = useState("all");
  const [duration, setDuration] = useState("all");
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [groupBuyPackage, setGroupBuyPackage] = useState<any>(null);

  const destinationSet = Array.from(new Set(packages.map(p => p.destination)));
  const destinations = ["all", ...destinationSet];

  const filtered = packages
    .filter(p => destination === "all" || p.destination === destination)
    .filter(p => {
      if (duration === "all") return true;
      if (duration === "short") return p.duration_nights <= 4;
      if (duration === "medium") return p.duration_nights >= 5 && p.duration_nights <= 7;
      if (duration === "long") return p.duration_nights >= 8;
      return true;
    });

  const linkedGoal = selectedPackage
    ? activeGoals.find((g: any) => g.linked_holiday_package_id === selectedPackage.id)
    : null;

  return (
    <>
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div>
          <select value={destination} onChange={e => setDestination(e.target.value)} style={selectStyle}>
            {destinations.map(d => <option key={d} value={d}>{d === "all" ? "All destinations" : d}</option>)}
          </select>
        </div>
        <div>
          <select value={duration} onChange={e => setDuration(e.target.value)} style={selectStyle}>
            <option value="all">Any duration</option>
            <option value="short">Short (1–4 nights)</option>
            <option value="medium">Medium (5–7 nights)</option>
            <option value="long">Long (8+ nights)</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
        {filtered.map(pkg => (
          <div key={pkg.id} style={{ background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s' }}
            onClick={() => setSelectedPackage(pkg)}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-md)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'none'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
          >
            <div style={{ height: '180px', background: getGradient(pkg.destination), position: 'relative' }}>
              {pkg.is_featured && (
                <span style={{ position: 'absolute', top: '0.75rem', left: '0.75rem', background: 'var(--teal)', color: 'var(--midnight)', fontSize: '0.7rem', fontWeight: 700, padding: '3px 10px', borderRadius: '20px' }}>
                  Featured
                </span>
              )}
              {pkg.slots_available <= 6 && (
                <span style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', background: 'rgba(239,68,68,0.9)', color: 'white', fontSize: '0.7rem', fontWeight: 700, padding: '3px 10px', borderRadius: '20px' }}>
                  {pkg.slots_available} spots left
                </span>
              )}
              <div style={{ position: 'absolute', bottom: '0.75rem', left: '0.75rem', display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                {(pkg.inclusions || []).slice(0, 3).map((inc: string) => (
                  <span key={inc} style={{ fontSize: '0.65rem', background: 'rgba(255,255,255,0.2)', color: 'white', padding: '2px 7px', borderRadius: '20px', backdropFilter: 'blur(4px)' }}>
                    {inc}
                  </span>
                ))}
              </div>
            </div>

            <div style={{ padding: '1rem' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                🌍 {pkg.destination} · {pkg.duration_nights} nights
              </p>
              <h3 style={{ fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', fontSize: '1rem', fontWeight: 700, color: 'var(--midnight)', marginBottom: '0.625rem', lineHeight: 1.3 }}>
                {pkg.title}
              </h3>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.75rem' }}>
                {pkg.original_price_ngn && (
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                    ₦{pkg.original_price_ngn.toLocaleString()}
                  </span>
                )}
                <span style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--midnight)' }}>
                  From ₦{pkg.price_per_person_ngn.toLocaleString()}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>/person</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <button
                  onClick={e => { e.stopPropagation(); setSelectedPackage(pkg); }}
                  style={{ padding: '0.625rem', background: 'var(--teal-pale)', color: 'var(--teal)', fontWeight: 700, fontSize: '0.8125rem', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer' }}
                >
                  Save toward this
                </button>
                <button
                  onClick={e => { e.stopPropagation(); setSelectedPackage(pkg); }}
                  style={{ padding: '0.625rem', background: 'var(--midnight)', color: 'white', fontWeight: 700, fontSize: '0.8125rem', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer' }}
                >
                  Book directly
                </button>
              </div>

              <button
                onClick={e => { e.stopPropagation(); setGroupBuyPackage(pkg); }}
                style={{ width: '100%', padding: '0.625rem', background: 'var(--off-white)', color: 'var(--midnight)', fontWeight: 600, fontSize: '0.8125rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', cursor: 'pointer', marginTop: '0.5rem' }}
              >
                👥 Create group — save up to 30%
              </button>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={{ padding: '3rem', textAlign: 'center', background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem' }}>No packages match your filters. Try adjusting your criteria.</p>
        </div>
      )}

      {selectedPackage && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}
          onClick={() => setSelectedPackage(null)}>
          <div style={{ background: 'white', borderRadius: 'var(--radius-xl)', maxWidth: '600px', width: '100%', maxHeight: '90vh', overflow: 'auto' }}
            onClick={e => e.stopPropagation()}>
            <HolidayBookingFlow
              pkg={selectedPackage}
              preferredCurrency={preferredCurrency}
              activeGoals={activeGoals}
              userId={userId}
              existingGoal={linkedGoal}
              initialAction={linkedGoal?.current_balance >= selectedPackage.price_per_person_ngn ? "book" : undefined}
              onClose={() => setSelectedPackage(null)}
            />
          </div>
        </div>
      )}

      {groupBuyPackage && (
        <CreateGroupBuyModal
          itemType="holiday_package"
          itemId={groupBuyPackage.id}
          itemTitle={groupBuyPackage.title}
          originalPrice={groupBuyPackage.price_per_person_ngn}
          onClose={() => setGroupBuyPackage(null)}
        />
      )}
    </>
  );
}
/* eslint-enable @typescript-eslint/no-explicit-any */
