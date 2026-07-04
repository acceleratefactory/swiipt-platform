"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function EditAiProviderForm({ provider }: { provider: any }) {
  const router = useRouter();
  const [name, setName] = useState(provider.name);
  const [baseUrl, setBaseUrl] = useState(provider.base_url);
  const [apiKey, setApiKey] = useState(provider.api_key);
  const [model, setModel] = useState(provider.model);
  const [priority, setPriority] = useState(String(provider.priority));
  const [isActive, setIsActive] = useState(provider.is_active);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name || !baseUrl || !apiKey || !model) {
      setError("Name, base URL, API key, and model are required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/ai-providers/${provider.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, baseUrl, apiKey, model, priority: parseInt(priority) || 0, is_active: isActive }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      router.push("/admin/ai-providers");
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Delete "${provider.name}"? This cannot be undone.`)) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/ai-providers/${provider.id}`, { method: "DELETE" });
      if (!res.ok) { const d = await res.json(); setError(d.error); return; }
      router.push("/admin/ai-providers");
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '600px' }}>
      {error && (
        <div style={{ padding: '0.75rem 1rem', background: '#FEF2F2', color: '#DC2626', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', marginBottom: '1rem' }}>{error}</div>
      )}

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', fontWeight: 600, color: 'var(--midnight)', fontSize: '0.875rem', marginBottom: '0.375rem' }}>Name</label>
        <input value={name} onChange={e => setName(e.target.value)} style={{ width: '100%', padding: '0.625rem 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontSize: '0.875rem' }} />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', fontWeight: 600, color: 'var(--midnight)', fontSize: '0.875rem', marginBottom: '0.375rem' }}>Base URL</label>
        <input value={baseUrl} onChange={e => setBaseUrl(e.target.value)} style={{ width: '100%', padding: '0.625rem 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontSize: '0.875rem', fontFamily: 'monospace' }} />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', fontWeight: 600, color: 'var(--midnight)', fontSize: '0.875rem', marginBottom: '0.375rem' }}>API Key</label>
        <input value={apiKey} onChange={e => setApiKey(e.target.value)} type="password" style={{ width: '100%', padding: '0.625rem 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontSize: '0.875rem', fontFamily: 'monospace' }} />
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Use <code style={{ background: 'var(--gray-100)', padding: '1px 4px', borderRadius: '3px' }}>$ENV_VAR_NAME</code> to reference an environment variable.</p>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', fontWeight: 600, color: 'var(--midnight)', fontSize: '0.875rem', marginBottom: '0.375rem' }}>Model</label>
        <input value={model} onChange={e => setModel(e.target.value)} style={{ width: '100%', padding: '0.625rem 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontSize: '0.875rem', fontFamily: 'monospace' }} />
      </div>

      <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <input id="isActive" type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} style={{ width: '16px', height: '16px' }} />
        <label htmlFor="isActive" style={{ fontWeight: 600, color: 'var(--midnight)', fontSize: '0.875rem' }}>Active</label>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', fontWeight: 600, color: 'var(--midnight)', fontSize: '0.875rem', marginBottom: '0.375rem' }}>Priority</label>
        <input value={priority} onChange={e => setPriority(e.target.value)} type="number" min="0" style={{ width: '100px', padding: '0.625rem 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontSize: '0.875rem' }} />
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
        <button type="submit" disabled={saving} style={{ padding: '0.75rem 2rem', background: saving ? 'var(--text-muted)' : 'var(--midnight)', color: 'white', fontWeight: 700, fontSize: '0.875rem', borderRadius: 'var(--radius-md)', border: 'none', cursor: saving ? 'not-allowed' : 'pointer' }}>
          {saving ? "Saving..." : "Save Changes"}
        </button>
        <button type="button" onClick={handleDelete} disabled={saving} style={{ padding: '0.75rem 1.25rem', background: 'transparent', color: '#DC2626', fontWeight: 600, fontSize: '0.875rem', borderRadius: 'var(--radius-md)', border: '1px solid #FECACA', cursor: saving ? 'not-allowed' : 'pointer' }}>
          Delete Provider
        </button>
      </div>
    </form>
  );
}
