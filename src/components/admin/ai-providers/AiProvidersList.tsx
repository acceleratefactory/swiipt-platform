"use client";
import { useState } from "react";

export default function AiProvidersList({ providers: initial }: { providers: any[] }) {
  const [providers, setProviders] = useState(initial);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; text: string; ok: boolean } | null>(null);

  async function handleToggle(id: string) {
    setTogglingId(id);
    try {
      const res = await fetch("/api/admin/ai-providers/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (res.ok) {
        setProviders(prev => prev.map(p => p.id === id ? { ...p, is_active: data.is_active } : p));
      }
    } finally {
      setTogglingId(null);
    }
  }

  async function handleTest(id: string) {
    setTestingId(id);
    setTestResult(null);
    try {
      const res = await fetch("/api/admin/ai-providers/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      setTestResult({ id, text: data.success ? `✓ ${data.reply}` : `✗ ${data.error}`, ok: data.success });
    } finally {
      setTestingId(null);
    }
  }

  function maskKey(key: string) {
    if (key.startsWith("$")) return key;
    if (key.length <= 8) return "••••••••";
    return key.slice(0, 4) + "••••" + key.slice(-4);
  }

  return (
    <div>
      <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', overflow: 'hidden' }}>
        {providers.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No AI providers configured. Add one to enable opportunity refresh.</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--off-white)' }}>
                <th style={{ textAlign: 'left', padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--midnight)' }}>Name</th>
                <th style={{ textAlign: 'left', padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--midnight)' }}>Base URL</th>
                <th style={{ textAlign: 'left', padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--midnight)' }}>Model</th>
                <th style={{ textAlign: 'left', padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--midnight)' }}>API Key</th>
                <th style={{ textAlign: 'center', padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--midnight)' }}>Priority</th>
                <th style={{ textAlign: 'center', padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--midnight)' }}>Status</th>
                <th style={{ textAlign: 'right', padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--midnight)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {providers.map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: 'var(--midnight)' }}>{p.name}
                    <span style={{ display: 'block', fontSize: '0.6875rem', color: 'var(--text-muted)' }}>{p.provider_slug}</span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)', fontSize: '0.75rem', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.base_url}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: 'var(--teal)', fontWeight: 600, fontSize: '0.75rem' }}>{p.model}</td>
                  <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: '0.75rem' }}>{maskKey(p.api_key)}</td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 600 }}>{p.priority}</td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '3px 10px', borderRadius: '20px', background: p.is_active ? 'var(--teal-pale)' : '#FEF3C7', color: p.is_active ? 'var(--teal)' : '#D97706' }}>
                      {p.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.375rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                      <button
                        onClick={() => handleTest(p.id)}
                        disabled={testingId === p.id}
                        style={{ padding: '0.375rem 0.5rem', background: 'transparent', color: 'var(--teal)', fontWeight: 600, fontSize: '0.7rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', cursor: testingId === p.id ? 'not-allowed' : 'pointer' }}
                      >
                        {testingId === p.id ? "..." : "Test"}
                      </button>
                      <button
                        onClick={() => handleToggle(p.id)}
                        disabled={togglingId === p.id}
                        style={{ padding: '0.375rem 0.625rem', background: p.is_active ? '#FEF3C7' : 'var(--teal-pale)', color: p.is_active ? '#D97706' : 'var(--teal)', fontWeight: 600, fontSize: '0.7rem', borderRadius: 'var(--radius-sm)', border: 'none', cursor: togglingId === p.id ? 'not-allowed' : 'pointer' }}
                      >
                        {togglingId === p.id ? "..." : p.is_active ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                    {testResult && testResult.id === p.id && (
                      <div style={{ marginTop: '0.375rem', fontSize: '0.6875rem', color: testResult.ok ? 'var(--teal)' : '#DC2626' }}>
                        {testResult.text}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <p style={{ marginTop: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
        Providers are tried in priority order (lowest first) during opportunity refresh.
        API keys in <code style={{ background: 'var(--gray-100)', padding: '1px 4px', borderRadius: '3px' }}>$ENV_VAR_NAME</code> format are resolved from server environment variables.
      </p>
    </div>
  );
}
