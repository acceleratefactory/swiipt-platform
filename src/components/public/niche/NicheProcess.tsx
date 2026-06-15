export default function NicheProcess({ steps }: { steps: any[] }) {
  return (
    <section id="process" style={{ padding: "4rem 0", background: "white" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "0 2rem" }}>
        <h2 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1.625rem", fontWeight: 800, color: "var(--midnight)", marginBottom: "2.5rem", textAlign: "center" }}>
          How it works
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {steps.map((step: any, i: number) => (
            <div key={i} style={{ display: "flex", gap: "1.25rem", alignItems: "flex-start" }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--midnight)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "0.9375rem", flexShrink: 0 }}>
                {step.step}
              </div>
              <div>
                <h3 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1rem", fontWeight: 700, color: "var(--midnight)", marginBottom: "0.375rem" }}>
                  {step.title}
                </h3>
                <p style={{ fontSize: "0.9375rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                  {step.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
