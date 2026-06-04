"use client";

export default function SpinWheelConfig({ slots, onChange }: { slots: { label: string; value_ngn: number; probability: number }[]; onChange: (slots: { label: string; value_ngn: number; probability: number }[]) => void }) {
  function updateSlot(index: number, field: string, value: string | number) {
    const updated = slots.map((slot, i) => i === index ? { ...slot, [field]: value } : slot);
    onChange(updated);
  }

  function addSlot() {
    onChange([...slots, { label: "", value_ngn: 0, probability: 0 }]);
  }

  function removeSlot(index: number) {
    if (slots.length <= 1) return;
    onChange(slots.filter((_, i) => i !== index));
  }

  return (
    <div style={{ background: 'white', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--off-white)' }}>
            <th style={{ textAlign: 'left', padding: '0.5rem 0.75rem', fontWeight: 700, color: 'var(--midnight)' }}>Label</th>
            <th style={{ textAlign: 'left', padding: '0.5rem 0.75rem', fontWeight: 700, color: 'var(--midnight)' }}>Value (NGN)</th>
            <th style={{ textAlign: 'left', padding: '0.5rem 0.75rem', fontWeight: 700, color: 'var(--midnight)' }}>Probability %</th>
            <th style={{ padding: '0.5rem 0.75rem', width: 40 }}></th>
          </tr>
        </thead>
        <tbody>
          {slots.map((slot, index) => (
            <tr key={index} style={{ borderBottom: '1px solid var(--gray-100)' }}>
              <td style={{ padding: '0.375rem 0.5rem' }}>
                <input value={slot.label} onChange={e => updateSlot(index, "label", e.target.value)} placeholder="Slot label" style={{ width: '100%', padding: '0.375rem 0.5rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '0.8125rem' }} />
              </td>
              <td style={{ padding: '0.375rem 0.5rem' }}>
                <input value={slot.value_ngn} onChange={e => updateSlot(index, "value_ngn", Number(e.target.value))} type="number" style={{ width: '100%', padding: '0.375rem 0.5rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '0.8125rem' }} />
              </td>
              <td style={{ padding: '0.375rem 0.5rem' }}>
                <input value={slot.probability} onChange={e => updateSlot(index, "probability", Number(e.target.value))} type="number" min={0} max={100} style={{ width: '100%', padding: '0.375rem 0.5rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '0.8125rem' }} />
              </td>
              <td style={{ padding: '0.375rem 0.5rem' }}>
                <button onClick={() => removeSlot(index)} disabled={slots.length <= 1} style={{ padding: '0.25rem 0.5rem', background: 'transparent', color: slots.length <= 1 ? 'var(--gray-200)' : '#EF4444', border: 'none', cursor: slots.length <= 1 ? 'not-allowed' : 'pointer', fontSize: '0.8125rem' }}>
                  ✕
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ padding: '0.5rem 0.75rem', borderTop: '1px solid var(--border)' }}>
        <button onClick={addSlot} style={{ padding: '0.375rem 0.75rem', background: 'var(--off-white)', color: 'var(--midnight)', fontWeight: 600, fontSize: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', cursor: 'pointer' }}>
          + Add slot
        </button>
      </div>
    </div>
  );
}
