"use client";
import { useState } from "react";

const groupStatusColors: Record<string, { bg: string; color: string }> = {
  open: { bg: 'var(--teal-pale)', color: 'var(--teal)' },
  filled: { bg: '#DBEAFE', color: '#1D4ED8' },
  expired: { bg: '#F3F4F6', color: '#6B7280' },
  completed: { bg: 'var(--teal-pale)', color: 'var(--teal)' },
  cancelled: { bg: '#FEF2F2', color: '#EF4444' },
};

const memberStatusColors: Record<string, { bg: string; color: string }> = {
  committed: { bg: '#F3F4F6', color: '#6B7280' },
  pending_payment: { bg: '#FEF3C7', color: '#B45309' },
  paid: { bg: 'var(--teal-pale)', color: 'var(--teal)' },
  withdrawn: { bg: '#FEF2F2', color: '#EF4444' },
};

const validAdminTransitions: Record<string, string[]> = {
  open: ["expired", "cancelled"],
  filled: ["completed", "cancelled"],
  expired: [],
  completed: [],
  cancelled: [],
};

const memberStatusTransitions: Record<string, string[]> = {
  committed: ["withdrawn"],
  pending_payment: ["paid", "committed", "withdrawn"],
  paid: [],
  withdrawn: [],
};

const itemTypeLabels: Record<string, string> = {
  holiday_package: "Holiday package",
  service: "Service",
};

export default function GroupDetailView({ group, members, adminId: _adminId }: { group: any; members: any[]; adminId: string }) {
  const [newStatus, setNewStatus] = useState("");
  const [updating, setUpdating] = useState(false);

  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [memberNewStatus, setMemberNewStatus] = useState("");
  const [updatingMember, setUpdatingMember] = useState(false);

  const sc = groupStatusColors[group.status] || { bg: '#F3F4F6', color: '#6B7280' };

  async function handleUpdateStatus() {
    if (!newStatus) return;
    setUpdating(true);
    await fetch("/api/admin/groups/update-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groupId: group.id, newStatus }),
    });
    window.location.reload();
  }

  async function handleUpdateMemberStatus() {
    if (!selectedMemberId || !memberNewStatus) return;
    setUpdatingMember(true);
    const res = await fetch("/api/admin/groups/update-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groupId: group.id, memberId: selectedMemberId, newMemberStatus: memberNewStatus }),
    });
    if (res.ok) window.location.reload();
    setUpdatingMember(false);
  }

  return (
    <div>
      <a href="/admin/groups" style={{ fontSize: '0.8125rem', color: 'var(--teal)', textDecoration: 'none', marginBottom: '1rem', display: 'inline-block' }}>
        ← Back to groups
      </a>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* LEFT COLUMN — Group info + status actions */}
        <div>
          <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', padding: '1.25rem', marginBottom: '1.5rem' }}>
            <h2 style={{ fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', fontSize: '1rem', fontWeight: 700, color: 'var(--midnight)', marginBottom: '1rem' }}>
              Group summary
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.8125rem' }}>
              <div><span style={{ color: 'var(--text-muted)' }}>Title:</span> <span style={{ fontWeight: 600, color: 'var(--midnight)' }}>{group.title}</span></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Type:</span> <span style={{ fontWeight: 600, color: 'var(--midnight)' }}>{itemTypeLabels[group.item_type] || group.item_type}</span></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Creator:</span> <span style={{ fontWeight: 600, color: 'var(--midnight)' }}>{group.creator?.full_name}</span></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Email:</span> <span style={{ fontWeight: 600, color: 'var(--midnight)' }}>{group.creator?.email}</span></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Original price:</span> <span style={{ fontWeight: 600, color: 'var(--midnight)' }}>₦{Number(group.original_price_ngn).toLocaleString()}</span></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Group price:</span> <span style={{ fontWeight: 600, color: 'var(--teal)' }}>₦{Number(group.group_price_ngn).toLocaleString()}</span></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Discount:</span> <span style={{ fontWeight: 600, color: 'var(--teal)' }}>{group.group_discount_pct}%</span></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Members:</span> <span style={{ fontWeight: 600, color: 'var(--midnight)' }}>{group.current_size} / {group.target_size}</span></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Status:</span> <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: '20px', background: sc.bg, color: sc.color, marginLeft: '0.25rem' }}>{group.status.replace(/_/g, ' ')}</span></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Created:</span> <span style={{ fontWeight: 600, color: 'var(--midnight)' }}>{new Date(group.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}</span></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Expires:</span> <span style={{ fontWeight: 600, color: 'var(--midnight)' }}>{group.expires_at ? new Date(group.expires_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</span></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Filled at:</span> <span style={{ fontWeight: 600, color: 'var(--midnight)' }}>{group.filled_at ? new Date(group.filled_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}</span></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Invite code:</span> <span style={{ fontWeight: 600, fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--midnight)' }}>{group.invite_code}</span></div>
            </div>
          </div>

          {/* GROUP STATUS UPDATE */}
          {(validAdminTransitions[group.status]?.length > 0) && (
            <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', padding: '1.25rem', marginBottom: '1.5rem' }}>
              <h3 style={{ fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', fontSize: '0.9375rem', fontWeight: 700, color: 'var(--midnight)', marginBottom: '0.75rem' }}>
                Update group status
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <select
                  value={newStatus}
                  onChange={e => setNewStatus(e.target.value)}
                  style={{ padding: '0.5rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '0.8125rem', outline: 'none' }}
                >
                  <option value="">Select action...</option>
                  {validAdminTransitions[group.status].map(s => (
                    <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                  ))}
                </select>
                <button
                  onClick={handleUpdateStatus}
                  disabled={updating || !newStatus}
                  style={{ padding: '0.5rem 1rem', background: updating ? 'var(--gray-300)' : 'var(--teal)', border: 'none', borderRadius: 'var(--radius-sm)', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--midnight)', cursor: updating ? 'not-allowed' : 'pointer', alignSelf: 'flex-start' }}
                >
                  {updating ? "Updating..." : "Update status"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN — Members */}
        <div>
          <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', padding: '1.25rem' }}>
            <h3 style={{ fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', fontSize: '0.9375rem', fontWeight: 700, color: 'var(--midnight)', marginBottom: '0.75rem' }}>
              Members ({members.length})
            </h3>
            {members.length === 0 ? (
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>No members in this group.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {members.map((member: any) => {
                  const mc = memberStatusColors[member.status] || { bg: '#F3F4F6', color: '#6B7280' };
                  const isSelected = selectedMemberId === member.id;
                  return (
                    <div
                      key={member.id}
                      onClick={() => { setSelectedMemberId(member.id); setMemberNewStatus(""); }}
                      style={{
                        padding: '0.75rem',
                        background: isSelected ? 'var(--off-white)' : 'white',
                        borderRadius: 'var(--radius-sm)',
                        border: isSelected ? '1px solid var(--teal)' : '1px solid var(--gray-100)',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isSelected ? '0.5rem' : 0 }}>
                        <div>
                          <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--midnight)' }}>
                            {member.user?.full_name || 'Unknown'}
                            {member.role === "creator" && <span style={{ fontSize: '0.65rem', color: 'var(--teal)', fontWeight: 700, marginLeft: '0.375rem' }}>Creator</span>}
                          </p>
                          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{member.user?.email}</p>
                        </div>
                        <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '2px 6px', borderRadius: '20px', background: mc.bg, color: mc.color }}>
                          {member.status.replace(/_/g, ' ')}
                        </span>
                      </div>

                      {isSelected && (
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border)' }}>
                          <select
                            value={memberNewStatus}
                            onChange={e => setMemberNewStatus(e.target.value)}
                            onClick={e => e.stopPropagation()}
                            style={{ flex: 1, padding: '0.375rem 0.5rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', outline: 'none' }}
                          >
                            <option value="">Change status...</option>
                            {(memberStatusTransitions[member.status] || []).map(s => (
                              <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                            ))}
                          </select>
                          <button
                            onClick={e => { e.stopPropagation(); handleUpdateMemberStatus(); }}
                            disabled={updatingMember || !memberNewStatus}
                            style={{ padding: '0.375rem 0.75rem', background: updatingMember ? 'var(--gray-300)' : 'var(--teal)', border: 'none', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', fontWeight: 600, color: 'var(--midnight)', cursor: updatingMember ? 'not-allowed' : 'pointer' }}
                          >
                            {updatingMember ? "..." : "Update"}
                          </button>
                        </div>
                      )}

                      {member.booking_id && (
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                          Booking: <a href={`/admin/holidays/bookings/${member.booking_id}`} style={{ color: 'var(--teal)', textDecoration: 'none' }}>View →</a>
                        </p>
                      )}
                      {member.order_id && (
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                          Order: <a href={`/admin/orders/${member.order_id}`} style={{ color: 'var(--teal)', textDecoration: 'none' }}>View →</a>
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
