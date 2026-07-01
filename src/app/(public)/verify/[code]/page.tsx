import { createServiceClient } from "@/lib/supabase/service";
import { notFound } from "next/navigation";
import VerificationPage from "@/components/public/certificates/VerificationPage";

export const dynamic = "force-dynamic";

export default async function CertificateVerifyPage({ params }: { params: { code: string } }) {
  const serviceClient = createServiceClient();

  const { data: certificate } = await (serviceClient as any)
    .from("platform_certificates")
    .select("*")
    .eq("certificate_number", params.code)
    .single();

  if (!certificate) notFound();

  return (
    <div style={{ minHeight: "100vh", background: "var(--off-white)", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
      <VerificationPage certificate={certificate} />
    </div>
  );
}
