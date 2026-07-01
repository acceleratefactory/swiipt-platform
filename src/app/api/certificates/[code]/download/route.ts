import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import React from "react";

export async function GET(_request: NextRequest, { params }: { params: { code: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: certificate } = await supabase
    .from("platform_certificates")
    .select("*")
    .eq("certificate_number", params.code)
    .eq("user_id", user.id)
    .single();

  if (!certificate) {
    return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
  }

  const { renderToStream } = await import("@react-pdf/renderer");

  const DocumentComponent = certificate.certificate_type === "trust_certificate"
    ? (await import("@/lib/pdf/TrustCertificateDocument")).default
    : (await import("@/lib/pdf/ProofOfFundsDocument")).default;

  const element = React.createElement(DocumentComponent, {
    certificate: {
      certificate_number: certificate.certificate_number,
      certificate_type: certificate.certificate_type,
      issued_at: certificate.issued_at,
      expires_at: certificate.expires_at,
      is_valid: certificate.is_valid,
      verification_url: certificate.verification_url,
      data_snapshot: certificate.data_snapshot as Record<string, unknown>,
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stream = await (renderToStream as any)(element);

  const chunks: Uint8Array[] = [];
  for await (const chunk of stream) {
    chunks.push(chunk as Uint8Array);
  }
  const buffer = Buffer.concat(chunks);

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${certificate.certificate_number}.pdf"`,
      "Content-Length": buffer.length.toString(),
    },
  });
}
