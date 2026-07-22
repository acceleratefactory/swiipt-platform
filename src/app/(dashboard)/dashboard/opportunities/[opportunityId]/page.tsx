import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { stripHtml, cleanDescription } from "@/lib/strip-html";

interface Props {
  params: { opportunityId: string };
}

export default async function OpportunityDetailPage({ params }: Props) {
  const { opportunityId } = params;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: opp } = await supabase
    .from("opportunities")
    .select("*")
    .eq("id", opportunityId)
    .single();

  if (!opp) notFound();

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "1.5rem 1rem" }}>
      <Link
        href="/dashboard/opportunities"
        style={{ fontSize: "0.8125rem", color: "var(--teal)", textDecoration: "none", fontWeight: 600, display: "inline-block", marginBottom: "1.5rem" }}
      >
        {"\u2190"} Back to opportunities
      </Link>

      <div style={{ background: "white", borderRadius: "var(--radius-md)", border: "1px solid #e2e8f0", padding: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
          <div style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--teal)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: "1.25rem", flexShrink: 0 }}>
            {opp.organisation.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1.375rem", fontWeight: 800, color: "var(--midnight)", margin: 0 }}>
              {opp.title}
            </h1>
            <p style={{ fontSize: "0.875rem", color: "#64748b", margin: "0.125rem 0 0 0" }}>
              {opp.organisation} &middot; {opp.location_country}{opp.location_city ? `, ${opp.location_city}` : ""}
            </p>
          </div>
        </div>

        {opp.salary_range && (
          <div style={{ fontWeight: 700, fontSize: "1.125rem", color: "var(--teal)", fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", marginBottom: "1rem" }}>
            {opp.salary_range}
          </div>
        )}

        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1.25rem" }}>
          <span style={{ fontSize: "0.75rem", fontWeight: 600, padding: "0.25rem 0.75rem", borderRadius: "999px", background: "#dbeafe", color: "#1e293b" }}>
            {opp.type}
          </span>
          {opp.deadline && (
            <span style={{ fontSize: "0.75rem", fontWeight: 600, padding: "0.25rem 0.75rem", borderRadius: "999px", background: "#fef3c7", color: "#92400e" }}>
              {"\u23F0"} Due {new Date(opp.deadline).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
            </span>
          )}
          {opp.is_featured && (
            <span style={{ fontSize: "0.75rem", fontWeight: 600, padding: "0.25rem 0.75rem", borderRadius: "999px", background: "#fef9c3", color: "#854d0e" }}>
              {"\u2B50"} Featured
            </span>
          )}
        </div>

        <section style={{ marginBottom: "1.25rem" }}>
          <h2 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1rem", fontWeight: 700, color: "var(--midnight)", margin: "0 0 0.5rem 0" }}>
            About this opportunity
          </h2>
          <p style={{ fontSize: "0.875rem", color: "#475569", lineHeight: 1.6, margin: 0, whiteSpace: "pre-wrap" }}>
            {cleanDescription(stripHtml(opp.description || ""))}
          </p>
        </section>

        {opp.requirements && (
          <section style={{ marginBottom: "1.25rem" }}>
            <h2 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1rem", fontWeight: 700, color: "var(--midnight)", margin: "0 0 0.5rem 0" }}>
              Requirements
            </h2>
            <p style={{ fontSize: "0.875rem", color: "#475569", lineHeight: 1.6, margin: 0, whiteSpace: "pre-wrap" }}>
              {cleanDescription(stripHtml(opp.requirements || ""))}
            </p>
          </section>
        )}

        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginTop: "1.5rem" }}>
          <a
            href={opp.application_url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ padding: "0.75rem 1.5rem", borderRadius: "var(--radius-md)", border: "none", background: "var(--teal)", color: "white", fontWeight: 700, fontSize: "0.875rem", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.375rem" }}
          >
            Apply now {"\u2192"}
          </a>
          {opp.related_service_slug && (
            <a
              href={`/services/${opp.related_service_slug}`}
              style={{ padding: "0.75rem 1.5rem", borderRadius: "var(--radius-md)", border: "1px solid #e2e8f0", background: "white", color: "var(--midnight)", fontWeight: 600, fontSize: "0.875rem", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.375rem" }}
            >
              {"\uD83D\uDEE2\uFE0F"} Need a visa?
            </a>
          )}
        </div>

        {opp.source_name && (() => {
          const sourceUrl = opp.application_url || opp.source_url || "";
          const validSourceUrl = /^https?:\/\//i.test(sourceUrl);
          return (
            <div style={{ marginTop: "1.5rem", padding: "1rem", background: "#f8fafc", borderRadius: "var(--radius-sm)", fontSize: "0.8125rem", color: "#64748b" }}>
              Source:{" "}
              {validSourceUrl ? (
                <a href={sourceUrl} target="_blank" rel="noopener noreferrer" style={{ color: "var(--teal)", fontWeight: 600, textDecoration: "none" }}>
                  {opp.source_name}
                </a>
              ) : (
                <span style={{ color: "var(--midnight)", fontWeight: 600 }}>{opp.source_name}</span>
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );
}
