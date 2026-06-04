"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import DocumentReviewCard from "./DocumentReviewCard";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function DocumentVerificationQueue({ initialDocs }: { initialDocs: any[] }) {
  const [docs, setDocs] = useState(initialDocs);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  async function handleVerify(documentRequestId: string, action: "approve" | "reject", reason?: string) {
    setActionLoading(documentRequestId);
    await fetch("/api/admin/documents/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ documentRequestId, action, rejectionReason: reason }),
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setDocs(prev => prev.filter((d: any) => d.id !== documentRequestId));
    setActionLoading(null);
  }

  async function getSignedUrl(filePath: string) {
    const supabase = createClient();
    const { data } = await supabase.storage
      .from("documents")
      .createSignedUrl(filePath, 300);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  }

  if (docs.length === 0) {
    return (
      <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', padding: '2.5rem', textAlign: 'center' }}>
        <p style={{ fontSize: '1rem', color: 'var(--teal)', fontWeight: 700 }}>All documents reviewed. No pending reviews. ✓</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {// eslint-disable-next-line @typescript-eslint/no-explicit-any
        docs.map((doc: any) => (
        <DocumentReviewCard
          key={doc.id}
          doc={doc}
          actionLoading={actionLoading}
          onVerify={handleVerify}
          onViewDocument={getSignedUrl}
        />
      ))}
    </div>
  );
}
