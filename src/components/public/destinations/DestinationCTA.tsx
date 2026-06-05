import Link from "next/link";

export default function DestinationCTA({
  slug,
  destName,
  packages,
}: {
  slug: string;
  destName: string;
  packages: Array<{ id: string; name: string; price_ngn: number | null; processing_weeks_min: number | null; processing_weeks_max: number | null; badge_text: string | null }>;
}) {
  return (
    <section style={{ padding: "0 0 4rem" }}>
      <div
        style={{
          background: "var(--midnight)",
          borderRadius: "var(--radius-xl)",
          padding: "2.5rem",
          textAlign: "center",
          color: "white",
        }}
      >
        <h2
          style={{
            fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif",
            fontSize: "1.5rem",
            fontWeight: 800,
            color: "white",
            marginBottom: "0.75rem",
          }}
        >
          Ready to start your {destName} journey?
        </h2>
        <p style={{ color: "var(--gray-300)", fontSize: "0.9375rem", marginBottom: "1.5rem", maxWidth: "500px", margin: "0 auto 1.5rem" }}>
          Create a free account, set a savings goal, and let us handle the rest.
        </p>
        <Link
          href={`/signup?destination=${slug}`}
          style={{
            padding: "0.875rem 2rem",
            background: "var(--teal)",
            color: "var(--midnight)",
            fontWeight: 700,
            borderRadius: "var(--radius-md)",
            textDecoration: "none",
            display: "inline-block",
          }}
        >
          Get started
        </Link>

        {packages.length > 0 && (
          <div style={{ marginTop: "2rem", textAlign: "left" }}>
            <p style={{ fontSize: "0.8125rem", color: "var(--gray-300)", marginBottom: "0.75rem", textAlign: "center" }}>
              Available service packages
            </p>
            <div style={{ display: "grid", gap: "0.75rem" }}>
              {packages.map((pkg) => (
                <div
                  key={pkg.id}
                  style={{
                    background: "rgba(255,255,255,0.08)",
                    borderRadius: "var(--radius-md)",
                    padding: "1rem 1.25rem",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "0.75rem",
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 600, fontSize: "0.9375rem" }}>{pkg.name}</span>
                    {pkg.badge_text && (
                      <span
                        style={{
                          marginLeft: "0.5rem",
                          fontSize: "0.6875rem",
                          background: "var(--teal)",
                          color: "var(--midnight)",
                          padding: "2px 8px",
                          borderRadius: "20px",
                          fontWeight: 600,
                        }}
                      >
                        {pkg.badge_text}
                      </span>
                    )}
                    {pkg.processing_weeks_min && (
                      <p style={{ fontSize: "0.75rem", color: "var(--gray-300)", marginTop: "0.25rem" }}>
                        {pkg.processing_weeks_min}–{pkg.processing_weeks_max} weeks
                      </p>
                    )}
                  </div>
                  {pkg.price_ngn && (
                    <span style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontWeight: 800, fontSize: "1.125rem" }}>
                      ₦{pkg.price_ngn.toLocaleString()}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
