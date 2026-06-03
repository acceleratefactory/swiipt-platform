"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import ConfirmDepositModal from "./ConfirmDepositModal";

interface DepositWithUser {
  id: string;
  status: string;
  payment_reference: string;
  currency: string;
  amount: number;
  user_confirmed_at: string;
  users?: { full_name: string; email: string } | null;
  savings_goals?: { goal_name: string; destination: string } | null;
}

interface PendingDepositsTableProps {
  initialDeposits: DepositWithUser[];
}

export default function PendingDepositsTable({ initialDeposits }: PendingDepositsTableProps) {
  const [deposits, setDeposits] = useState<DepositWithUser[]>(initialDeposits);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [modalDeposit, setModalDeposit] = useState<DepositWithUser | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase
      .channel("admin:pending_deposits")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "deposits",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }, async (payload: any) => {
        if (payload.new.status === "pending" && payload.new.user_confirmed_at) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data } = await (supabase as any)
            .from("deposits")
            .select("*, users(full_name, email), savings_goals(goal_name, destination)")
            .eq("id", payload.new.id)
            .single();
          if (data) setDeposits(prev => [data, ...prev]);
        }
      })
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "deposits",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }, (payload: any) => {
        if (payload.new.status !== "pending") {
          setDeposits(prev => prev.filter(d => d.id !== payload.new.id));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [supabase]);

  async function handleReject(depositId: string) {
    if (!confirm("Reject this deposit? The user will be notified.")) return;
    await fetch("/api/admin/deposits/reject", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ depositId, reason: "Payment not received in account" }),
    });
  }

  return (
    <div style={{ background: 'white', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', marginBottom: '1.5rem', overflow: 'hidden' }}>
      <div style={{ padding: '0.875rem 1rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <h2 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--midnight)' }}>
          Pending confirmation
        </h2>
        {deposits.length > 0 && (
          <span style={{ background: 'var(--danger)', color: 'white', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px' }}>
            {deposits.length}
          </span>
        )}
        <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--teal)', fontWeight: 600 }}>
          ● Live
        </span>
      </div>

      {deposits.length === 0 ? (
        <p style={{ padding: '1.5rem', fontSize: '0.875rem', color: 'var(--text-muted)', textAlign: 'center' }}>
          No pending deposits. All clear ✓
        </p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
          <thead>
            <tr style={{ background: 'var(--gray-100)' }}>
              {["User", "Amount", "Reference", "Goal", "Submitted", "Elapsed", "Action"].map(h => (
                <th key={h} style={{ padding: '0.625rem 1rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {deposits.map(d => {
              const elapsed = Math.floor((Date.now() - new Date(d.user_confirmed_at).getTime()) / 60000);
              const isOld = elapsed > 60;
              return (
                <tr key={d.id} style={{ borderBottom: '1px solid var(--gray-100)', background: isOld ? '#FFFBEB' : 'white' }}>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <p style={{ fontWeight: 600, color: 'var(--midnight)' }}>{d.users?.full_name}</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{d.users?.email}</p>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--midnight)', whiteSpace: 'nowrap' }}>
                    {d.currency} {d.amount.toLocaleString()}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', color: 'var(--teal)', fontWeight: 600, fontSize: '0.8125rem' }}>
                    {d.payment_reference}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>
                    {d.savings_goals?.goal_name || <span style={{ color: 'var(--text-muted)' }}>Free wallet</span>}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {new Date(d.user_confirmed_at).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap' }}>
                    <span style={{ color: isOld ? 'var(--danger)' : 'var(--text-muted)', fontWeight: isOld ? 600 : 400 }}>
                      {elapsed < 60 ? `${elapsed}m` : `${Math.floor(elapsed / 60)}h ${elapsed % 60}m`}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => setModalDeposit(d)}
                        style={{ padding: '0.375rem 0.75rem', background: 'var(--teal)', color: 'var(--midnight)', fontWeight: 700, fontSize: '0.75rem', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer' }}
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => handleReject(d.id)}
                        style={{ padding: '0.375rem 0.75rem', background: 'var(--gray-100)', color: 'var(--danger)', fontWeight: 600, fontSize: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', cursor: 'pointer' }}
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {modalDeposit && (
        <ConfirmDepositModal
          deposit={modalDeposit}
          onConfirm={async (notes) => {
            setConfirmingId(modalDeposit.id);
            const res = await fetch("/api/admin/deposits/confirm", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ depositId: modalDeposit.id, notes }),
            });
            if (res.ok) {
              setDeposits(prev => prev.filter(d => d.id !== modalDeposit.id));
              setModalDeposit(null);
            }
            setConfirmingId(null);
          }}
          onClose={() => setModalDeposit(null)}
          loading={confirmingId === modalDeposit?.id}
        />
      )}
    </div>
  );
}
