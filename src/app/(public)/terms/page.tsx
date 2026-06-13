import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — Swiipt",
  description: "The terms governing your use of the Swiipt platform.",
};

export default function TermsPage() {
  const sectionStyle: React.CSSProperties = {
    marginBottom: "1.75rem",
  };

  const headingStyle: React.CSSProperties = {
    fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif",
    fontSize: "1.125rem",
    fontWeight: 700,
    color: "var(--midnight)",
    marginBottom: "0.75rem",
  };

  const bodyStyle: React.CSSProperties = {
    fontSize: "0.9375rem",
    color: "var(--text-secondary)",
    lineHeight: 1.7,
    marginBottom: "0.75rem",
  };

  return (
    <div style={{ maxWidth: "760px", margin: "0 auto", padding: "3rem 1.5rem" }}>
      <h1
        style={{
          fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif",
          fontSize: "1.75rem",
          fontWeight: 800,
          color: "var(--midnight)",
          marginBottom: "0.25rem",
        }}
      >
        Terms of Service
      </h1>
      <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginBottom: "2rem" }}>
        Last updated: June 2026
      </p>

      <section style={sectionStyle}>
        <h2 style={headingStyle}>Using the Platform</h2>
        <p style={bodyStyle}>
          By creating an account, you agree to provide accurate information and
          keep your login credentials secure. You must be at least 18 years old
          to use Swiipt. You are responsible for all activity on your account.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={headingStyle}>Services</h2>
        <p style={bodyStyle}>
          Swiipt provides a platform for goal-based savings, visa and residency
          application processing, and flight and holiday booking. We act as an
          intermediary and technology provider. Visa and residency applications
          are subject to approval by the relevant government authorities, and we
          cannot guarantee outcomes.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={headingStyle}>Payments</h2>
        <p style={bodyStyle}>
          Deposits are made via manual bank transfer to Swiipt&apos;s Nigerian
          bank account. Funds are credited to your Swiipt wallet once confirmed.
          Withdrawals are processed within 1–3 business days. All transactions
          are in Nigerian Naira unless otherwise stated. Exchange rates for
          foreign currency savings are displayed at the time of deposit.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={headingStyle}>Refund Policy</h2>
        <p style={bodyStyle}>
          Savings held in your Swiipt wallet can be withdrawn at any time, minus
          any applicable transaction fees. Visa and residency application fees
          paid to third parties or government authorities are non-refundable once
          submitted. Service fees for application processing are refundable only
          if Swiipt fails to submit the application within the stated timeline.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={headingStyle}>Limitations of Liability</h2>
        <p style={bodyStyle}>
          Swiipt provides the platform &ldquo;as is&rdquo; and makes no guarantees
          regarding visa approval, processing times, or flight availability. We are
          not liable for delays or rejections by government authorities, airlines,
          or third-party service providers. Our total liability is limited to the
          amount of service fees paid by you in the relevant transaction.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={headingStyle}>Changes to These Terms</h2>
        <p style={bodyStyle}>
          We may update these terms from time to time. We will notify you of
          material changes by email or through the platform. Continued use of
          Swiipt after changes take effect means you accept the updated terms.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={headingStyle}>Contact</h2>
        <p style={bodyStyle}>
          Questions about these terms? Email{" "}
          <a href="mailto:support@swiipt.com" style={{ color: "var(--teal)", textDecoration: "underline" }}>
            support@swiipt.com
          </a>
          .
        </p>
      </section>
    </div>
  );
}
