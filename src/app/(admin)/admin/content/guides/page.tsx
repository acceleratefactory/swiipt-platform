"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface Guide {
  id: string;
  title: string;
  category: string;
  published: boolean;
  view_count: number;
  updated_at: string;
}

const categoryLabels: Record<string, string> = {
  visa_residency: "Visas & Residency",
  company_registration: "Company Setup",
  study_abroad: "Study Abroad",
  work_abroad: "Work Abroad",
  holiday_travel: "Holiday Travel",
  citizenship: "Citizenship",
  remote_work: "Remote Work",
  trade_business: "Business & Trade",
  financial_planning: "Financial Planning",
};

export default function AdminGuidesPage() {
  const supabase = createClient();
  const router = useRouter();
  const [guides, setGuides] = useState<Guide[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push("/login");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: role } = await (supabase as any)
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single();
      if (!role || role.role !== "admin") return router.push("/dashboard");
      fetchGuides();
    };
    checkAuth();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchGuides = async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any)
      .from("resource_guides")
      .select("id, title, category, published, view_count, updated_at")
      .order("updated_at", { ascending: false });
    setGuides(data || []);
    setLoading(false);
  };

  const togglePublished = useCallback(async (id: string, current: boolean) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from("resource_guides")
      .update({ published: !current })
      .eq("id", id);
    setGuides(prev =>
      prev.map(g => (g.id === id ? { ...g, published: !current } : g))
    );
  }, [supabase]);

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.5rem",
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif",
              fontSize: "1.375rem",
              fontWeight: 800,
              color: "var(--midnight)",
              marginBottom: "0.5rem",
            }}
          >
            Resource Guides
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
            Manage the guides shown on the public resources pages. Create, edit,
            and toggle visibility.
          </p>
        </div>
        <a
          href="/admin/content/guides/new"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.75rem 1.5rem",
            background: "var(--teal)",
            color: "var(--midnight)",
            fontWeight: 700,
            fontSize: "0.9375rem",
            borderRadius: "var(--radius-md)",
            textDecoration: "none",
          }}
        >
          + Create new guide
        </a>
      </div>

      {guides.length === 0 ? (
        <p style={{ color: "var(--text-muted)", fontSize: "0.9375rem" }}>
          No guides yet.{" "}
          <a
            href="/admin/content/guides/new"
            style={{ color: "var(--teal)", textDecoration: "underline" }}
          >
            Create your first guide
          </a>
        </p>
      ) : (
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "0.875rem",
          }}
        >
          <thead>
            <tr style={{ textAlign: "left", color: "var(--text-muted)" }}>
              <th style={{ padding: "0.75rem 1rem", borderBottom: "2px solid var(--border)" }}>Title</th>
              <th style={{ padding: "0.75rem 1rem", borderBottom: "2px solid var(--border)" }}>Category</th>
              <th style={{ padding: "0.75rem 1rem", borderBottom: "2px solid var(--border)" }}>Views</th>
              <th style={{ padding: "0.75rem 1rem", borderBottom: "2px solid var(--border)" }}>Published</th>
              <th style={{ padding: "0.75rem 1rem", borderBottom: "2px solid var(--border)" }}>Updated</th>
              <th style={{ padding: "0.75rem 1rem", borderBottom: "2px solid var(--border)" }}></th>
            </tr>
          </thead>
          <tbody>
            {guides.map(guide => (
              <tr key={guide.id} style={{ borderBottom: "1px solid var(--gray-100)" }}>
                <td style={{ padding: "0.75rem 1rem", fontWeight: 600, color: "var(--midnight)" }}>
                  {guide.title}
                </td>
                <td style={{ padding: "0.75rem 1rem", color: "var(--text-secondary)" }}>
                  {categoryLabels[guide.category] || guide.category}
                </td>
                <td style={{ padding: "0.75rem 1rem", color: "var(--text-muted)" }}>
                  {guide.view_count}
                </td>
                <td style={{ padding: "0.75rem 1rem" }}>
                  <button
                    onClick={() => togglePublished(guide.id, guide.published)}
                    style={{
                      padding: "0.25rem 0.75rem",
                      borderRadius: "999px",
                      border: "none",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      background: guide.published ? "#d1fae5" : "#f3f4f6",
                      color: guide.published ? "#065f46" : "#6b7280",
                    }}
                  >
                    {guide.published ? "Published" : "Draft"}
                  </button>
                </td>
                <td style={{ padding: "0.75rem 1rem", color: "var(--text-muted)", fontSize: "0.8125rem" }}>
                  {new Date(guide.updated_at).toLocaleDateString()}
                </td>
                <td style={{ padding: "0.75rem 1rem" }}>
                  <a
                    href={`/admin/content/guides/${guide.id}`}
                    style={{ color: "var(--teal)", textDecoration: "none", fontWeight: 600 }}
                  >
                    Edit
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
