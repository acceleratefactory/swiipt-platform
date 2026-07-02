import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica", color: "#1F2937" },
  header: { marginBottom: 24, borderBottom: "2 solid #06112B", paddingBottom: 12 },
  title: { fontSize: 18, fontWeight: "bold", color: "#06112B", marginBottom: 4 },
  subtitle: { fontSize: 9, color: "#6B7280" },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 12, fontWeight: "bold", color: "#06112B", marginBottom: 8, borderBottom: "1 solid #E5E7EB", paddingBottom: 4 },
  row: { flexDirection: "row", marginBottom: 4 },
  label: { width: 180, color: "#6B7280", fontSize: 9 },
  value: { flex: 1, fontWeight: "bold", fontSize: 9 },
  badgeRow: { flexDirection: "row", gap: 8, marginTop: 8, flexWrap: "wrap" },
  badge: { padding: "4 8", backgroundColor: "#D1FAE5", borderRadius: 4, fontSize: 8, color: "#065F46", fontWeight: "bold" },
  footer: { position: "absolute", bottom: 40, left: 40, right: 40, borderTop: "1 solid #E5E7EB", paddingTop: 8, fontSize: 7, color: "#9CA3AF", textAlign: "center" },
  qrBox: { marginTop: 16, padding: 12, backgroundColor: "#F9FAFB", borderRadius: 4 },
  qrText: { fontSize: 8, color: "#6B7280", marginTop: 4, textAlign: "center" },
});

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

function formatNgn(amount: number): string {
  return `NGN ${amount.toLocaleString()}.00`;
}

interface TrustCertificateDocumentProps {
  certificate: {
    certificate_number: string;
    certificate_type: string;
    issued_at: string;
    expires_at: string;
    is_valid: boolean;
    verification_url: string;
    data_snapshot: Record<string, unknown>;
  };
}

export default function TrustCertificateDocument({ certificate }: TrustCertificateDocumentProps) {
  const data = certificate.data_snapshot;
  const isExpired = !certificate.is_valid || new Date(certificate.expires_at) < new Date();

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>SWIIPT TRUST CERTIFICATE</Text>
          <Text style={styles.subtitle}>Issued by Swiipt Technologies Limited, Lagos Nigeria</Text>
          <Text style={{ ...styles.subtitle, marginTop: 2 }}>Certificate #: {certificate.certificate_number}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Holder Details</Text>
          <View style={styles.row}><Text style={styles.label}>Full Name</Text><Text style={styles.value}>{data.holder_name as string || "—"}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Email</Text><Text style={styles.value}>{data.holder_email as string || "—"}</Text></View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Platform Standing</Text>
          <View style={styles.row}><Text style={styles.label}>Platform Tenure</Text><Text style={styles.value}>{data.platform_tenure_days as string || "—"}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Deposit Consistency</Text><Text style={styles.value}>{data.deposit_consistency_score as number || 0}%</Text></View>
          <View style={styles.row}><Text style={styles.label}>Total Lifetime Deposits</Text><Text style={styles.value}>{formatNgn(data.total_deposited_ngn as number || 0)}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Services Completed</Text><Text style={styles.value}>{data.services_completed as number || 0}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Documents Verified</Text><Text style={styles.value}>{data.documents_verified_count as number || 0}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Trust Score</Text><Text style={styles.value}>{data.trust_score as number || 0}/100</Text></View>
          <View style={styles.row}><Text style={styles.label}>Readiness Score</Text><Text style={styles.value}>{data.readiness_score as number || 0}/100</Text></View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Goals & Activity</Text>
          <View style={styles.row}><Text style={styles.label}>Goals Created</Text><Text style={styles.value}>{data.total_goals_created as number || 0}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Goals Completed</Text><Text style={styles.value}>{data.total_goals_completed as number || 0}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Avg. Monthly Deposit</Text><Text style={styles.value}>{formatNgn(data.average_monthly_deposit_ngn as number || 0)}</Text></View>
          <View style={styles.badgeRow}>
            {(data.has_uk_company as boolean) && <Text style={styles.badge}>UK Company</Text>}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Issuance Details</Text>
          <View style={styles.row}><Text style={styles.label}>Issue Date</Text><Text style={styles.value}>{formatDate(certificate.issued_at)}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Expiry Date</Text><Text style={{ ...styles.value, color: isExpired ? "#DC2626" : "#1F2937" }}>{formatDate(certificate.expires_at)}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Status</Text><Text style={{ ...styles.value, color: isExpired ? "#DC2626" : "#059669" }}>{isExpired ? "EXPIRED" : "ACTIVE"}</Text></View>
        </View>

        <View style={styles.qrBox}>
          <Text style={{ fontSize: 9, fontWeight: "bold", color: "#06112B", textAlign: "center" }}>Verify this certificate</Text>
          <Text style={styles.qrText}>{certificate.verification_url}</Text>
        </View>

        <View style={styles.footer}>
          <Text>This certificate confirms the platform trustworthiness of the above-named individual on Swiipt Technologies Limited.</Text>
          <Text style={{ marginTop: 2 }}>Certificate #{certificate.certificate_number} · Issued {formatDate(certificate.issued_at)}</Text>
          <Text>Swiipt Technologies Limited, Lagos Nigeria · www.swiipt.com</Text>
        </View>
      </Page>
    </Document>
  );
}
