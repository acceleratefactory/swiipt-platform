import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main style={{ padding: "2rem", fontFamily: "Plus Jakarta Sans, sans-serif" }}>
      <h1 style={{ fontFamily: "Cabinet Grotesk, sans-serif" }}>
        Dashboard — Sprint 4
      </h1>
      <p style={{ color: "#7A8599", marginTop: "0.5rem" }}>
        Logged in as: {user.email}
      </p>
      <p style={{ marginTop: "1rem" }}>
        Auth is working. Database is live. Deployment pipeline is active.
      </p>
    </main>
  );
}
