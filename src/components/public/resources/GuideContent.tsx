"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Guide {
  slug: string;
  title: string;
  subtitle: string | null;
  destination: string | null;
  content: string;
  reading_time_minutes: number;
}

export default function GuideContent({ guide }: { guide: Guide }) {
  return (
    <div style={{ maxWidth: "760px", margin: "0 auto", padding: "2rem 1.5rem" }}>
      <a
        href="/resources"
        style={{
          color: "var(--text-muted)",
          fontSize: "0.875rem",
          textDecoration: "none",
          display: "flex",
          alignItems: "center",
          gap: "0.375rem",
          marginBottom: "2rem",
        }}
      >
        ← All guides
      </a>

      <div style={{ marginBottom: "2rem" }}>
        <p
          style={{
            fontSize: "0.75rem",
            color: "var(--teal)",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            marginBottom: "0.5rem",
          }}
        >
          {guide.destination || "Global Mobility"}
        </p>
        <h1
          style={{
            fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif",
            fontSize: "clamp(1.5rem, 3vw, 2rem)",
            fontWeight: 800,
            color: "var(--midnight)",
            lineHeight: 1.2,
            marginBottom: "0.75rem",
          }}
        >
          {guide.title}
        </h1>
        {guide.subtitle && (
          <p
            style={{
              fontSize: "1rem",
              color: "var(--text-muted)",
              lineHeight: 1.5,
              marginBottom: "1rem",
            }}
          >
            {guide.subtitle}
          </p>
        )}
        <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
          {guide.reading_time_minutes} min read
        </p>
      </div>

      <div
        style={{
          color: "var(--text-secondary)",
          lineHeight: 1.7,
          fontSize: "1rem",
        }}
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h2: ({ children }) => (
              <h2
                style={{
                  fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif",
                  fontSize: "1.375rem",
                  fontWeight: 700,
                  color: "var(--midnight)",
                  margin: "2rem 0 0.75rem",
                }}
              >
                {children}
              </h2>
            ),
            h3: ({ children }) => (
              <h3
                style={{
                  fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif",
                  fontSize: "1.125rem",
                  fontWeight: 700,
                  color: "var(--midnight)",
                  margin: "1.5rem 0 0.5rem",
                }}
              >
                {children}
              </h3>
            ),
            p: ({ children }) => (
              <p style={{ marginBottom: "1rem", lineHeight: 1.7 }}>{children}</p>
            ),
            ul: ({ children }) => (
              <ul style={{ paddingLeft: "1.5rem", marginBottom: "1rem" }}>{children}</ul>
            ),
            ol: ({ children }) => (
              <ol style={{ paddingLeft: "1.5rem", marginBottom: "1rem" }}>{children}</ol>
            ),
            li: ({ children }) => (
              <li style={{ marginBottom: "0.375rem" }}>{children}</li>
            ),
            strong: ({ children }) => (
              <strong style={{ fontWeight: 700, color: "var(--midnight)" }}>
                {children}
              </strong>
            ),
            a: ({ href, children }) => (
              <a
                href={href}
                style={{ color: "var(--teal)", textDecoration: "underline" }}
                target={href?.startsWith("http") ? "_blank" : undefined}
              >
                {children}
              </a>
            ),
            table: ({ children }) => (
              <div style={{ overflowX: "auto", marginBottom: "1rem" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  {children}
                </table>
              </div>
            ),
            thead: ({ children }) => (
              <thead style={{ background: "var(--off-white)" }}>{children}</thead>
            ),
            th: ({ children }) => (
              <th
                style={{
                  padding: "0.625rem 0.875rem",
                  textAlign: "left",
                  fontWeight: 700,
                  fontSize: "0.875rem",
                  color: "var(--midnight)",
                  borderBottom: "2px solid var(--border)",
                }}
              >
                {children}
              </th>
            ),
            td: ({ children }) => (
              <td
                style={{
                  padding: "0.625rem 0.875rem",
                  fontSize: "0.875rem",
                  borderBottom: "1px solid var(--gray-100)",
                }}
              >
                {children}
              </td>
            ),
            blockquote: ({ children }) => (
              <blockquote
                style={{
                  borderLeft: "4px solid var(--teal)",
                  paddingLeft: "1rem",
                  margin: "1rem 0",
                  color: "var(--text-muted)",
                  fontStyle: "italic",
                }}
              >
                {children}
              </blockquote>
            ),
          }}
        >
          {guide.content}
        </ReactMarkdown>
      </div>

      <div
        style={{
          background:
            "linear-gradient(135deg, var(--midnight), #1a1a2e)",
          borderRadius: "var(--radius-xl)",
          padding: "2rem",
          marginTop: "3rem",
          textAlign: "center",
        }}
      >
        <p
          style={{
            color: "var(--teal)",
            fontSize: "0.75rem",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            marginBottom: "0.5rem",
          }}
        >
          Ready to start?
        </p>
        <h3
          style={{
            fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif",
            fontSize: "1.25rem",
            fontWeight: 800,
            color: "white",
            marginBottom: "0.75rem",
          }}
        >
          Swiipt handles everything from here
        </h3>
        <p
          style={{
            color: "var(--gray-300)",
            fontSize: "0.875rem",
            marginBottom: "1.5rem",
          }}
        >
          Save toward your goal, process your visa, and book your flights — all in
          one platform.
        </p>
        <a
          href="/signup"
          style={{
            display: "inline-block",
            padding: "0.875rem 2rem",
            background: "var(--teal)",
            color: "var(--midnight)",
            fontWeight: 700,
            fontSize: "0.9375rem",
            borderRadius: "var(--radius-md)",
            textDecoration: "none",
          }}
        >
          Create free account →
        </a>
      </div>
    </div>
  );
}
