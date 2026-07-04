import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { redirect } from "next/navigation";
import AffiliateHub from "@/components/dashboard/affiliate/AffiliateHub";

export default async function AffiliatePage({
  searchParams,
}: {
  searchParams?: { userId?: string; adminOverride?: string };
}) {
  const isAdminPreview = searchParams?.adminOverride === "true" && searchParams?.userId;

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const targetUserId = isAdminPreview ? searchParams!.userId! : user.id;

  let previewUserName = "";
  if (isAdminPreview) {
    const adminSupabase = createServiceClient();
    const { data: previewUser } = await (adminSupabase as any)
      .from("users")
      .select("full_name")
      .eq("id", targetUserId)
      .single();
    previewUserName = previewUser?.full_name || targetUserId.slice(0, 8);
  }

  const db = isAdminPreview ? createServiceClient() : supabase;

  const [statusRes, withdrawalsRes] = await Promise.all([
    (db as any).from("affiliate_status").select("*").eq("user_id", targetUserId).single(),
    (db as any).from("affiliate_withdrawals").select("*").eq("user_id", targetUserId).order("requested_at", { ascending: false }),
  ]);

  return (
    <div>
      {isAdminPreview ? (
        <div style={{ background: '#1E3A5F', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ color: 'white', fontSize: '0.8125rem', fontWeight: 600 }}>
            🔍 Viewing as <strong>{previewUserName}</strong>
          </span>
          <a href="/admin/affiliates" style={{ color: 'var(--teal)', fontSize: '0.8125rem', fontWeight: 600, textDecoration: 'none' }}>
            Back to admin →
          </a>
        </div>
      ) : (
        <>
          <h1 style={{ fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', fontSize: '1.375rem', fontWeight: 800, color: 'var(--midnight)', marginBottom: '0.5rem' }}>
            Earn with Swiipt
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            Refer friends and earn up to 12% commission on every service order.
          </p>
        </>
      )}
      <AffiliateHub
        status={statusRes.data || {}}
        withdrawals={withdrawalsRes.data || []}
        isAdminPreview={!!isAdminPreview}
        previewUserName={previewUserName}
      />
    </div>
  );
}
