export default function NicheSuccessStory({ page }: { page: any }) {
  return (
    <section style={{ background: "linear-gradient(135deg, #06112B, #1A3560)", padding: "4rem 0" }}>
      <div style={{ maxWidth: "760px", margin: "0 auto", padding: "0 2rem", textAlign: "center" }}>
        <p style={{ fontSize: "0.75rem", color: "var(--teal)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "1.5rem" }}>
          Success story
        </p>
        <blockquote style={{ fontSize: "1.25rem", color: "white", lineHeight: 1.6, fontStyle: "italic", marginBottom: "1.5rem", maxWidth: "600px", margin: "0 auto 1.5rem" }}>
          &ldquo;{page.success_story_quote}&rdquo;
        </blockquote>
        <p style={{ color: "var(--teal)", fontWeight: 700, fontSize: "0.9375rem" }}>
          {page.success_story_name}
        </p>
        <p style={{ color: "#B8C0CF", fontSize: "0.875rem" }}>
          {page.success_story_role} &middot; {page.success_story_destination}
        </p>
      </div>
    </section>
  );
}
