"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateAiProviderForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [providerSlug, setProviderSlug] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("");
  const [priority, setPriority] = useState("0");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name || !providerSlug || !baseUrl || !apiKey || !model) {
      setError("All fields except priority are required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/ai-providers/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, providerSlug, baseUrl, apiKey, model, priority: parseInt(priority) || 0 }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      router.push("/admin/ai-providers");
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  function handleNameChange(v: string) {
    setName(v);
    setProviderSlug(v.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/_+$/, ""));
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '600px' }}>
      {error && (
        <div style={{ padding: '0.75rem 1rem', background: '#FEF2F2', color: '#DC2626', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', fontWeight: 600, color: 'var(--midnight)', fontSize: '0.875rem', marginBottom: '0.375rem' }}>Name</label>
        <input value={name} onChange={e => handleNameChange(e.target.value)} placeholder="e.g. OpenAI GPT-4o" style={{ width: '100%', padding: '0.625rem 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontSize: '0.875rem' }} />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', fontWeight: 600, color: 'var(--midnight)', fontSize: '0.875rem', marginBottom: '0.375rem' }}>Provider Slug</label>
        <input value={providerSlug} onChange={e => setProviderSlug(e.target.value)} placeholder="e.g. openai" style={{ width: '100%', padding: '0.625rem 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontSize: '0.875rem', fontFamily: 'monospace' }} />
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Unique identifier. Auto-generated from name; edit if needed.</p>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', fontWeight: 600, color: 'var(--midnight)', fontSize: '0.875rem', marginBottom: '0.375rem' }}>Base URL</label>
        <input value={baseUrl} onChange={e => setBaseUrl(e.target.value)} placeholder="e.g. https://api.openai.com/v1" style={{ width: '100%', padding: '0.625rem 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontSize: '0.875rem', fontFamily: 'monospace' }} />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', fontWeight: 600, color: 'var(--midnight)', fontSize: '0.875rem', marginBottom: '0.375rem' }}>API Key</label>
        <input value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="sk-... or $OPENAI_API_KEY" type="password" style={{ width: '100%', padding: '0.625rem 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontSize: '0.875rem', fontFamily: 'monospace' }} />
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Use <code style={{ background: 'var(--gray-100)', padding: '1px 4px', borderRadius: '3px' }}>$ENV_VAR_NAME</code> to reference an environment variable.</p>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', fontWeight: 600, color: 'var(--midnight)', fontSize: '0.875rem', marginBottom: '0.375rem' }}>Model</label>
        <input value={model} onChange={e => setModel(e.target.value)} placeholder="e.g. gpt-4o" style={{ width: '100%', padding: '0.625rem 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontSize: '0.875rem', fontFamily: 'monospace' }} />
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', fontWeight: 600, color: 'var(--midnight)', fontSize: '0.875rem', marginBottom: '0.375rem' }}>Priority</label>
        <input value={priority} onChange={e => setPriority(e.target.value)} type="number" min="0" style={{ width: '100px', padding: '0.625rem 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontSize: '0.875rem' }} />
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Lower values are tried first during refresh. Fallback order = priority ascending.</p>
      </div>

      <button type="submit" disabled={saving} style={{ padding: '0.75rem 2rem', background: saving ? 'var(--text-muted)' : 'var(--midnight)', color: 'white', fontWeight: 700, fontSize: '0.875rem', borderRadius: 'var(--radius-md)', border: 'none', cursor: saving ? 'not-allowed' : 'pointer' }}>
        {saving ? "Saving..." : "Add Provider"}
      </button>
    </form>
  );
}
