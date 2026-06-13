import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — Swiipt",
  description: "How Swiipt collects, uses, and protects your personal data.",
};

export default function PrivacyPage() {
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
        Privacy Policy
      </h1>
      <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginBottom: "2rem" }}>
        Last updated: June 2026
      </p>

      <section style={sectionStyle}>
        <h2 style={headingStyle}>What Data We Collect</h2>
        <p style={bodyStyle}>
          When you create an account, we collect your name, email address, phone
          number, and login credentials. As you use the platform, we collect
          information about your savings activity, transactions, document uploads,
          visa applications, and booking history. We also collect device
          information and usage data to improve our service.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={headingStyle}>How We Use Your Data</h2>
        <p style={bodyStyle}>
          We use your data to operate the platform: process deposits and
          withdrawals, submit visa applications on your behalf, send transaction
          confirmations, and provide customer support. With your consent, we may
          send you emails about relevant visa programs, destination guides, or
          promotional offers. You can opt out of marketing at any time.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={headingStyle}>Third Parties We Share Data With</h2>
        <p style={bodyStyle}>
          We use Supabase for database and authentication, Resend for transactional
          emails, and Meta for limited advertising measurement. When you apply for
          a visa or residency program, we share the required information with the
          relevant government authorities or authorised processing partners. We
          never sell your personal data to third parties.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={headingStyle}>Data Retention</h2>
        <p style={bodyStyle}>
          We retain your account data for as long as your account is active. If
          you close your account, we delete your personal data within 90 days,
          except where we are required by law to retain certain records (for
          example, transaction records for regulatory compliance).
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={headingStyle}>Your Rights</h2>
        <p style={bodyStyle}>
          You have the right to access, correct, or delete your personal data at
          any time through your account settings. You can also request a copy of
          your data by contacting us. We will respond to all legitimate requests
          within 30 days.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={headingStyle}>Contact</h2>
        <p style={bodyStyle}>
          If you have questions about this policy, email us at{" "}
          <a href="mailto:support@swiipt.com" style={{ color: "var(--teal)", textDecoration: "underline" }}>
            support@swiipt.com
          </a>
          .
        </p>
      </section>
    </div>
  );
}
