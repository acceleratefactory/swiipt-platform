"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";

const groupLabels: Record<string, string> = {
  Financial: "Financial Settings",
  "Welcome Reward": "Welcome Reward",
  Referral: "Referral & Commission",
  "Mobility Score": "Mobility Score",
  Streaks: "Saving Streaks",
  Milestones: "Goal Milestones",
  "Bank Details": "Bank Account Details",
};

const groupIcons: Record<string, string> = {
  Financial: "💰",
  "Welcome Reward": "🎁",
  Referral: "👥",
  "Mobility Score": "📊",
  Streaks: "🔥",
  Milestones: "🎯",
  "Bank Details": "🏦",
};

function formatSettingLabel(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, c => c.toUpperCase())
    .replace(/Pct/g, "%")
    .replace(/Ngn/g, "NGN");
}

export default function PlatformSettingsForm({ groupedSettings, auditLog: initialAuditLog }: { groupedSettings: Record<string, any[]>; auditLog: any[] }) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [localSettings, setLocalSettings] = useState<Record<string, any>>({});
  const [auditLog, setAuditLog] = useState(initialAuditLog);
  const [saveMessage, setSaveMessage] = useState<{ key: string; type: "success" | "error" } | null>(null);

  function toggleGroup(group: string) {
    setExpanded(prev => ({ ...prev, [group]: !prev[group] }));
  }

  function getValue(setting: any): string {
    if (localSettings[setting.key] !== undefined) return localSettings[setting.key];
    return setting.value || "";
  }

  async function handleSave(setting: any) {
    const value = getValue(setting);
    if (value === setting.value) return; // No change
    setSavingKey(setting.key);
    setSaveMessage(null);
    try {
      const res = await fetch("/api/admin/settings/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: setting.key, value }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setSaveMessage({ key: setting.key, type: "success" });
      setLocalSettings(prev => ({ ...prev, [setting.key]: value }));
      setAuditLog(prev => [
        { id: Date.now().toString(), key: setting.key, old_value: setting.value, new_value: value, created_at: new Date().toISOString() },
        ...prev.slice(0, 9),
      ]);
      setTimeout(() => setSaveMessage(null), 2000);
    } catch {
      setSaveMessage({ key: setting.key, type: "error" });
      setTimeout(() => setSaveMessage(null), 2000);
    } finally {
      setSavingKey(null);
    }
  }

  const groupOrder = ["Financial", "Welcome Reward", "Referral", "Mobility Score", "Streaks", "Milestones", "Bank Details"];

  return (
    <div>
      {groupOrder.map(group => {
        const settings = groupedSettings[group] || [];
        if (settings.length === 0) return null;
        const isExpanded = expanded[group] !== false; // Default expanded
        return (
          <div key={group} style={{ background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', overflow: 'hidden', marginBottom: '1rem' }}>
            <button
              onClick={() => toggleGroup(group)}
              style={{ width: '100%', padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--off-white)', border: 'none', cursor: 'pointer', borderBottom: isExpanded ? '1px solid var(--border)' : 'none' }}
            >
              <span style={{ fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', fontSize: '0.9375rem', fontWeight: 700, color: 'var(--midnight)' }}>
                {groupIcons[group] || "⚙️"} {groupLabels[group] || group}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {settings.length} setting{settings.length !== 1 ? 's' : ''} {isExpanded ? "▲" : "▼"}
              </span>
            </button>

            {isExpanded && (
              <div style={{ padding: '0.25rem 1.25rem' }}>
                {settings.map(setting => (
                  <div key={setting.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: '1px solid var(--gray-100)' }}>
                    <div style={{ flex: 1, marginRight: '1rem' }}>
                      <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--midnight)' }}>
                        {formatSettingLabel(setting.key)}
                      </p>
                      {setting.description && (
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>{setting.description}</p>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input
                        type="text"
                        value={getValue(setting)}
                        onChange={e => setLocalSettings(prev => ({ ...prev, [setting.key]: e.target.value }))}
                        onBlur={() => handleSave(setting)}
                        style={{ width: '160px', padding: '0.5rem 0.75rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', textAlign: 'right' }}
                      />
                      {savingKey === setting.key && (
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>...</span>
                      )}
                      {saveMessage !== null && saveMessage.key === setting.key && saveMessage.type === "success" && (
                        <span style={{ fontSize: '0.7rem', color: 'var(--teal)' }}>✓</span>
                      )}
                      {saveMessage !== null && saveMessage.key === setting.key && saveMessage.type === "error" && (
                        <span style={{ fontSize: '0.7rem', color: '#EF4444' }}>✗</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Change history */}
      {auditLog.length > 0 && (
        <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', overflow: 'hidden' }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
            <h2 style={{ fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', fontSize: '0.9375rem', fontWeight: 700, color: 'var(--midnight)' }}>
              Change History
            </h2>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--off-white)' }}>
                <th style={{ textAlign: 'left', padding: '0.5rem 1rem', fontWeight: 700, color: 'var(--midnight)' }}>Setting</th>
                <th style={{ textAlign: 'left', padding: '0.5rem 1rem', fontWeight: 700, color: 'var(--midnight)' }}>Old value</th>
                <th style={{ textAlign: 'left', padding: '0.5rem 1rem', fontWeight: 700, color: 'var(--midnight)' }}>New value</th>
                <th style={{ textAlign: 'right', padding: '0.5rem 1rem', fontWeight: 700, color: 'var(--midnight)' }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {auditLog.map((log: any) => (
                <tr key={log.id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                  <td style={{ padding: '0.5rem 1rem', fontWeight: 600, color: 'var(--midnight)' }}>{formatSettingLabel(log.key)}</td>
                  <td style={{ padding: '0.5rem 1rem', color: 'var(--text-muted)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{log.old_value}</td>
                  <td style={{ padding: '0.5rem 1rem', color: 'var(--teal)', fontWeight: 600, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{log.new_value}</td>
                  <td style={{ padding: '0.5rem 1rem', textAlign: 'right', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {new Date(log.created_at).toLocaleDateString("en-NG", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
/* eslint-enable @typescript-eslint/no-explicit-any */
