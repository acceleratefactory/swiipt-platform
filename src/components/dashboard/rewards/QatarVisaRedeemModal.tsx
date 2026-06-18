"use client";
import { useState, useRef } from "react";
import { X } from "lucide-react";

type Step = "info" | "payment" | "payment_pending" | "upload" | "complete";

export default function QatarVisaRedeemModal({
  rewardId,
  onClose,
}: {
  rewardId: string;
  onClose: () => void;
}) {
  const [step, setStep] = useState<Step>("info");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [redemptionData, setRedemptionData] = useState<any>(null);
  const [nights, setNights] = useState(3);
  const [passportPhoto, setPassportPhoto] = useState<File | null>(null);
  const [passportDataPage, setPassportDataPage] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const photoRef = useRef<HTMLInputElement>(null);
  const passportRef = useRef<HTMLInputElement>(null);

  async function handleInitiate() {
    setLoading(true);
    setError("");

      const res = await fetch("/api/rewards/redeem-visa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rewardId, nights }),
      });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Failed to initiate. Please try again.");
      return;
    }

    setRedemptionData(data);
    setStep("payment");
  }

  async function handlePaymentConfirmed() {
    setLoading(true);
    setError("");

    const res = await fetch("/api/rewards/redeem-visa/confirm-payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ redemptionId: redemptionData?.redemptionId, reference: redemptionData?.reference }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to confirm payment. Please try again.");
      return;
    }

    setStep("payment_pending");
  }

  async function handleUpload() {
    if (!passportPhoto || !passportDataPage) {
      setError("Both documents are required.");
      return;
    }

    setUploading(true);
    setError("");

    const formData = new FormData();
    formData.append("passportPhoto", passportPhoto);
    formData.append("passportDataPage", passportDataPage);
    formData.append("redemptionId", redemptionData.redemptionId);

    const res = await fetch("/api/rewards/redeem-visa/upload-documents", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    setUploading(false);

    if (!res.ok) {
      setError(data.error || "Upload failed. Please try again.");
      return;
    }

    setStep("complete");
  }

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 50 }} />
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", background: "white", borderRadius: "var(--radius-xl)", padding: "2rem", width: "500px", maxWidth: "95vw", zIndex: 51, boxShadow: "var(--shadow-lg)", maxHeight: "90vh", overflowY: "auto" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <div>
            <p style={{ fontSize: "0.75rem", color: "var(--teal)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Welcome reward</p>
            <h3 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontWeight: 700, color: "var(--midnight)", fontSize: "1.125rem" }}>
              Free Qatar Tourist Visa
            </h3>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
            <X size={20} />
          </button>
        </div>

        {/* Step: Info */}
        {step === "info" && (
          <div>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9375rem", lineHeight: 1.6, marginBottom: "1.25rem" }}>
              To redeem it, you need to pay the <strong>hotel booking fee</strong>. The base fee of <strong>$150 USD</strong> covers <strong>3 nights</strong>. You can extend your stay by adding extra nights.
            </p>

            <div style={{ background: "var(--off-white)", borderRadius: "var(--radius-md)", padding: "1rem", marginBottom: "1.25rem" }}>
              <p style={{ fontWeight: 700, color: "var(--midnight)", marginBottom: "0.5rem", fontSize: "0.9375rem" }}>What you get:</p>
              <ul style={{ margin: 0, paddingLeft: "1.25rem", color: "var(--text-secondary)", fontSize: "0.875rem", lineHeight: 1.7 }}>
                <li>30-day Qatar Tourist Visa</li>
                <li>Full application processing by Swiipt team</li>
                <li>Status updates via notifications</li>
                <li>Visa delivered digitally</li>
              </ul>
            </div>

            <div style={{ background: "var(--off-white)", borderRadius: "var(--radius-md)", padding: "1rem", marginBottom: "1rem" }}>
              <p style={{ fontWeight: 700, color: "var(--midnight)", marginBottom: "0.75rem", fontSize: "0.9375rem" }}>
                Number of nights
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <button
                  onClick={() => setNights(n => Math.max(3, n - 1))}
                  disabled={nights <= 3}
                  style={{ width: "2.25rem", height: "2.25rem", borderRadius: "50%", border: "1px solid var(--gray-200)", background: nights <= 3 ? "var(--gray-100)" : "white", cursor: nights <= 3 ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "1.25rem", color: nights <= 3 ? "var(--text-muted)" : "var(--midnight)" }}
                >
                  −
                </button>
                <span style={{ minWidth: "2rem", textAlign: "center", fontWeight: 700, fontSize: "1.125rem", color: "var(--midnight)" }}>{nights}</span>
                <button
                  onClick={() => setNights(n => Math.min(30, n + 1))}
                  disabled={nights >= 30}
                  style={{ width: "2.25rem", height: "2.25rem", borderRadius: "50%", border: "1px solid var(--gray-200)", background: nights >= 30 ? "var(--gray-100)" : "white", cursor: nights >= 30 ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "1.25rem", color: nights >= 30 ? "var(--text-muted)" : "var(--midnight)" }}
                >
                  +
                </button>
                <span style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>nights</span>
              </div>
              <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginTop: "0.75rem" }}>
                🛏️ 3 nights (base) + $50 per extra night
              </p>
            </div>

            <div style={{ background: "var(--off-white)", borderRadius: "var(--radius-md)", padding: "1rem", marginBottom: "1.5rem" }}>
              <p style={{ fontWeight: 700, color: "var(--midnight)", marginBottom: "0.5rem", fontSize: "0.9375rem" }}>You will need to provide:</p>
              <ul style={{ margin: 0, paddingLeft: "1.25rem", color: "var(--text-secondary)", fontSize: "0.875rem", lineHeight: 1.7 }}>
                <li>Passport photograph (white background, recent)</li>
                <li>International passport data page (clear scan)</li>
              </ul>
            </div>

            {error && <p style={{ color: "var(--danger)", fontSize: "0.875rem", marginBottom: "1rem" }}>{error}</p>}

            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                onClick={handleInitiate}
                disabled={loading}
                style={{ flex: 1, padding: "0.875rem", background: loading ? "var(--gray-300)" : "var(--teal)", color: loading ? "var(--text-muted)" : "var(--midnight)", fontWeight: 700, fontSize: "0.9375rem", borderRadius: "var(--radius-md)", border: "none", cursor: loading ? "not-allowed" : "pointer" }}
              >
                {loading ? "Please wait..." : "Continue — Pay hotel booking →"}
              </button>
              <button onClick={onClose} style={{ padding: "0.875rem 1rem", background: "var(--gray-100)", color: "var(--text-secondary)", fontWeight: 600, borderRadius: "var(--radius-md)", border: "none", cursor: "pointer" }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Step: Payment */}
        {step === "payment" && redemptionData && (
          <div>
            <p style={{ fontWeight: 700, color: "var(--midnight)", marginBottom: "1.25rem" }}>
              Transfer the hotel booking fee to confirm your visa application:
            </p>

            <div style={{ background: "var(--off-white)", borderRadius: "var(--radius-md)", padding: "1.25rem", marginBottom: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0", borderBottom: "1px solid var(--gray-100)", fontSize: "0.875rem" }}>
                <span style={{ color: "var(--text-muted)" }}>Base fee ({redemptionData?.minNights || 3} nights)</span>
                <span style={{ fontWeight: 600, color: "var(--midnight)" }}>₦{Number(redemptionData?.baseFeeNgn || 0).toLocaleString()} (~${redemptionData?.baseFeeUsd || 0})</span>
              </div>
              {redemptionData?.extraFeeNgn && Number(redemptionData.extraFeeNgn) > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0", borderBottom: "1px solid var(--gray-100)", fontSize: "0.875rem" }}>
                  <span style={{ color: "var(--text-muted)" }}>Extra nights ({(redemptionData?.nights || 3) - (redemptionData?.minNights || 3)})</span>
                  <span style={{ fontWeight: 600, color: "var(--midnight)" }}>₦{Number(redemptionData.extraFeeNgn).toLocaleString()} (~${redemptionData.extraFeeUsd})</span>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "0.75rem 0 0.5rem", borderTop: "2px solid var(--gray-200)", fontSize: "0.9375rem" }}>
                <span style={{ fontWeight: 700, color: "var(--midnight)" }}>Total</span>
                <span style={{ fontWeight: 700, color: "var(--midnight)" }}>₦{Number(redemptionData?.totalNgn || redemptionData?.bookingFeeNgn || 0).toLocaleString()} (~${redemptionData?.totalUsd || redemptionData?.bookingFeeUsd || 0})</span>
              </div>
              {[
                { label: "Bank", value: redemptionData.bankDetails?.bank_name || "Swiipt Account" },
                { label: "Account number", value: redemptionData.bankDetails?.bank_account_number || "—" },
                { label: "Account name", value: redemptionData.bankDetails?.bank_account_name || "—" },
              ].map(item => (
                <div key={item.label} style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0", borderBottom: "1px solid var(--gray-100)", fontSize: "0.875rem" }}>
                  <span style={{ color: "var(--text-muted)" }}>{item.label}</span>
                  <span style={{ fontWeight: 600, color: "var(--midnight)" }}>{item.value}</span>
                </div>
              ))}
            </div>

            <div style={{ background: "var(--midnight)", borderRadius: "var(--radius-md)", padding: "1rem", marginBottom: "1rem" }}>
              <p style={{ fontSize: "0.75rem", color: "var(--gray-500)", marginBottom: "0.25rem" }}>Payment reference (include in transfer narration)</p>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "1.125rem", fontWeight: 800, color: "var(--teal)", fontFamily: "monospace", letterSpacing: "0.05em" }}>
                  {redemptionData.reference}
                </span>
                <button
                  onClick={() => navigator.clipboard.writeText(redemptionData.reference)}
                  style={{ fontSize: "0.75rem", padding: "0.25rem 0.625rem", background: "rgba(255,255,255,0.1)", color: "white", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "var(--radius-sm)", cursor: "pointer" }}
                >
                  Copy
                </button>
              </div>
            </div>

            <div style={{ background: "#FEF3C7", border: "1px solid #FDE68A", borderRadius: "var(--radius-md)", padding: "0.875rem", marginBottom: "1.25rem", fontSize: "0.8125rem", color: "#92400E" }}>
              ⚠️ You <strong>must</strong> include the reference <strong>{redemptionData.reference}</strong> in your bank transfer narration.
            </div>

            {error && <p style={{ color: "var(--danger)", fontSize: "0.875rem", marginBottom: "1rem" }}>{error}</p>}

            <button
              onClick={handlePaymentConfirmed}
              disabled={loading}
              style={{ width: "100%", padding: "0.875rem", background: loading ? "var(--gray-300)" : "var(--teal)", color: loading ? "var(--text-muted)" : "var(--midnight)", fontWeight: 700, fontSize: "0.9375rem", borderRadius: "var(--radius-md)", border: "none", cursor: loading ? "not-allowed" : "pointer" }}
            >
              {loading ? "Please wait..." : "I Have Sent the Payment ✓"}
            </button>
          </div>
        )}

        {/* Step: Payment Pending */}
        {step === "payment_pending" && (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>⏱</div>
            <h3 style={{ fontWeight: 700, color: "var(--midnight)", marginBottom: "0.5rem" }}>
              Payment pending confirmation
            </h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", lineHeight: 1.6, marginBottom: "1.5rem" }}>
              Once your payment is confirmed (1–4 hours during business hours), you will receive a notification to upload your documents. You can close this now.
            </p>
            <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", background: "var(--off-white)", borderRadius: "var(--radius-md)", padding: "0.625rem 1rem", display: "inline-block", marginBottom: "1.5rem" }}>
              Reference: <strong style={{ color: "var(--midnight)", fontFamily: "monospace" }}>{redemptionData?.reference}</strong>
            </p>
            <button onClick={onClose} style={{ width: "100%", padding: "0.875rem", background: "var(--midnight)", color: "white", fontWeight: 700, borderRadius: "var(--radius-md)", border: "none", cursor: "pointer" }}>
              Close &mdash; I&apos;ll wait for confirmation
            </button>
          </div>
        )}

        {/* Step: Upload Documents */}
        {step === "upload" && (
          <div>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", lineHeight: 1.6, marginBottom: "1.5rem" }}>
              Payment confirmed ✓ Now upload your documents to start processing your Qatar Tourist Visa.
            </p>

            <div style={{ marginBottom: "1rem" }}>
              <label style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--midnight)", display: "block", marginBottom: "0.375rem" }}>
                Passport photograph *
              </label>
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
                White background. Recent photo. Face clearly visible. JPG or PNG.
              </p>
              <label style={{ display: "block", padding: "1rem", border: `2px dashed ${passportPhoto ? "var(--teal)" : "var(--border)"}`, borderRadius: "var(--radius-md)", textAlign: "center", cursor: "pointer", background: passportPhoto ? "var(--teal-pale)" : "white" }}>
                {passportPhoto ? (
                  <span style={{ color: "var(--teal)", fontWeight: 600, fontSize: "0.875rem" }}>✓ {passportPhoto.name}</span>
                ) : (
                  <span style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>Click to upload passport photo</span>
                )}
                <input ref={photoRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: "none" }}
                  onChange={e => setPassportPhoto(e.target.files?.[0] || null)} />
              </label>
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--midnight)", display: "block", marginBottom: "0.375rem" }}>
                Passport data page *
              </label>
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
                The page with your photo, name, and passport number. Clear scan or photo. JPG, PNG, or PDF.
              </p>
              <label style={{ display: "block", padding: "1rem", border: `2px dashed ${passportDataPage ? "var(--teal)" : "var(--border)"}`, borderRadius: "var(--radius-md)", textAlign: "center", cursor: "pointer", background: passportDataPage ? "var(--teal-pale)" : "white" }}>
                {passportDataPage ? (
                  <span style={{ color: "var(--teal)", fontWeight: 600, fontSize: "0.875rem" }}>✓ {passportDataPage.name}</span>
                ) : (
                  <span style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>Click to upload passport data page</span>
                )}
                <input ref={passportRef} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" style={{ display: "none" }}
                  onChange={e => setPassportDataPage(e.target.files?.[0] || null)} />
              </label>
            </div>

            {error && <p style={{ color: "var(--danger)", fontSize: "0.875rem", marginBottom: "1rem" }}>{error}</p>}

            <button
              onClick={handleUpload}
              disabled={uploading || !passportPhoto || !passportDataPage}
              style={{ width: "100%", padding: "0.875rem", background: uploading || !passportPhoto || !passportDataPage ? "var(--gray-300)" : "var(--teal)", color: uploading || !passportPhoto || !passportDataPage ? "var(--text-muted)" : "var(--midnight)", fontWeight: 700, borderRadius: "var(--radius-md)", border: "none", cursor: uploading || !passportPhoto || !passportDataPage ? "not-allowed" : "pointer" }}
            >
              {uploading ? "Uploading..." : "Submit documents →"}
            </button>
          </div>
        )}

        {/* Step: Complete */}
        {step === "complete" && (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🎉</div>
            <h3 style={{ fontWeight: 700, color: "var(--midnight)", marginBottom: "0.5rem" }}>
              Application started!
            </h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", lineHeight: 1.6, marginBottom: "1.5rem" }}>
              Your Qatar Tourist Visa application has been submitted. Our team will process it within 2–5 business days and send your visa digitally.
            </p>
            <button onClick={onClose} style={{ width: "100%", padding: "0.875rem", background: "var(--midnight)", color: "white", fontWeight: 700, borderRadius: "var(--radius-md)", border: "none", cursor: "pointer" }}>
              Close
            </button>
          </div>
        )}
      </div>
    </>
  );
}
