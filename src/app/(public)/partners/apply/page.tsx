import PartnerApplyForm from "./PartnerApplyForm";

export default function PartnerApplyPage() {
  return (
    <div style={{ maxWidth: "640px", margin: "4rem auto", padding: "0 1rem" }}>
      <div style={{ marginBottom: "2rem", textAlign: "center" }}>
        <h1 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1.75rem", fontWeight: 800, color: "var(--midnight)", margin: "0 0 0.5rem 0" }}>
          Become a Swiipt Partner
        </h1>
        <p style={{ fontSize: "0.875rem", color: "#6B7280", margin: 0 }}>
          Offer your services to our global community of movers and earn via our escrow platform
        </p>
      </div>
      <PartnerApplyForm />
    </div>
  );
}
