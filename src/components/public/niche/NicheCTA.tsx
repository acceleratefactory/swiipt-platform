export default function NicheCTA({ page }: { page: any }) {
  const returnPath = page.recommended_goal_template_id
    ? `/dashboard/goals/new?template=${page.recommended_goal_template_id}`
    : "/dashboard/goals/new";
  return (
    <section style={{ padding: "4rem 0", background: "var(--teal)" }}>
      <div style={{ maxWidth: "760px", margin: "0 auto", padding: "0 2rem", textAlign: "center" }}>
        <h2 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1.75rem", fontWeight: 800, color: "var(--midnight)", marginBottom: "0.75rem" }}>
          Ready to start?
        </h2>
        <p style={{ fontSize: "1rem", color: "rgba(6,17,43,0.7)", marginBottom: "1.75rem" }}>
          Create a free account. Start your savings goal. Order when you are ready.
          No KYC required at signup.
        </p>
        <a href={`/signup?return=${encodeURIComponent(returnPath)}`} style={{ display: "inline-block", padding: "1rem 2.5rem", background: "var(--midnight)", color: "white", fontWeight: 700, fontSize: "1rem", borderRadius: "var(--radius-md)", textDecoration: "none" }}>
          {page.hero_cta_label} &rarr;
        </a>
        <p style={{ marginTop: "1rem", fontSize: "0.8125rem", color: "rgba(6,17,43,0.6)" }}>
          Free to sign up &middot; No credit card required
        </p>
      </div>
    </section>
  );
}
