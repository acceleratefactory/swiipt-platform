"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface OrderRecord {
  id: string;
  status: string;
  case_manager_notes: string | null;
}

interface ActiveOrderTrackerProps {
  order: OrderRecord;
}

const statusSteps = [
  { key: "initiated", label: "Order placed" },
  { key: "payment_pending", label: "Payment submitted" },
  { key: "payment_confirmed", label: "Payment confirmed" },
  { key: "documents_requested", label: "Documents requested" },
  { key: "documents_received", label: "Documents received" },
  { key: "in_progress", label: "Application in progress" },
  { key: "awaiting_approval", label: "Awaiting approval" },
  { key: "approved", label: "Approved ✓" },
  { key: "completed", label: "Completed 🎉" },
];

export default function ActiveOrderTracker({ order }: ActiveOrderTrackerProps) {
  const router = useRouter();
  const currentIndex = statusSteps.findIndex(s => s.key === order.status);

  // Realtime: auto-refresh when admin confirms payment or updates status
  useEffect(() => {
    if (!order.id) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`service_order:${order.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "service_orders",
          filter: `id=eq.${order.id}`,
        },
        () => { router.refresh(); }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [order.id, router]);

  return (
    <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: '1.5rem', border: '1px solid var(--border)' }}>
      <h3 style={{ fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', fontWeight: 700, color: 'var(--midnight)', marginBottom: '1.25rem' }}>
        Application status
      </h3>

      <div style={{ position: 'relative' }}>
        {statusSteps.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          return (
            <div key={step.key} style={{ display: 'flex', gap: '1rem', marginBottom: '0.875rem', alignItems: 'flex-start' }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                background: isCompleted ? 'var(--teal)' : isCurrent ? 'var(--midnight)' : 'var(--gray-100)',
                border: isCurrent ? '2px solid var(--midnight)' : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.75rem', fontWeight: 700,
                color: isCompleted || isCurrent ? 'white' : 'var(--gray-500)',
              }}>
                {isCompleted ? '✓' : index + 1}
              </div>
              <div style={{ paddingTop: '0.25rem' }}>
                <p style={{ fontSize: '0.875rem', fontWeight: isCurrent ? 700 : 400, color: isCurrent ? 'var(--midnight)' : isCompleted ? 'var(--text-secondary)' : 'var(--gray-500)' }}>
                  {step.label}
                </p>
                {isCurrent && order.case_manager_notes && (
                  <p style={{ fontSize: '0.8125rem', color: 'var(--teal)', marginTop: '0.25rem', fontStyle: 'italic' }}>
                    &ldquo;{order.case_manager_notes}&rdquo;
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
