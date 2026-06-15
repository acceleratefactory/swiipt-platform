"use client";

import { useState } from "react";

export default function NicheFAQ({ faqs }: { faqs: any[] }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <section style={{ padding: "4rem 0", background: "white" }}>
      <div style={{ maxWidth: "760px", margin: "0 auto", padding: "0 2rem" }}>
        <h2 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1.625rem", fontWeight: 800, color: "var(--midnight)", marginBottom: "2rem", textAlign: "center" }}>
          Frequently asked questions
        </h2>
        {faqs.map((faq: any, i: number) => (
          <div key={i} style={{ borderBottom: "1px solid var(--border)" }}>
            <button onClick={() => setOpen(open === i ? null : i)} style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.125rem 0", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
              <span style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--midnight)", paddingRight: "1rem" }}>{faq.q}</span>
              <span style={{ color: "var(--teal)", fontSize: "1.25rem", flexShrink: 0 }}>{open === i ? "\u2212" : "+"}</span>
            </button>
            {open === i && (
              <p style={{ fontSize: "0.9375rem", color: "var(--text-secondary)", lineHeight: 1.6, paddingBottom: "1.125rem" }}>
                {faq.a}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
