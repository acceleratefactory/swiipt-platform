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
  table: { marginTop: 8 },
  tableHeader: { flexDirection: "row", backgroundColor: "#F3F4F6", padding: "6 8", fontSize: 8, fontWeight: "bold", color: "#374151" },
  tableRow: { flexDirection: "row", padding: "4 8", borderBottom: "1 solid #E5E7EB", fontSize: 8 },
  col1: { width: "40%" },
  col2: { width: "30%", textAlign: "right" },
  col3: { width: "30%", textAlign: "right" },
  footer: { position: "absolute", bottom: 40, left: 40, right: 40, borderTop: "1 solid #E5E7EB", paddingTop: 8, fontSize: 7, color: "#9CA3AF", textAlign: "center" },
  qrBox: { marginTop: 16, padding: 12, backgroundColor: "#F9FAFB", borderRadius: 4 },
  qrText: { fontSize: 8, color: "#6B7280", marginTop: 4, textAlign: "center" },
});

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

function formatNgn(amount: number): string {
  return `₦${amount.toLocaleString()}.00`;
}

interface ProofOfFundsDocumentProps {
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

export default function ProofOfFundsDocument({ certificate }: ProofOfFundsDocumentProps) {
  const data = certificate.data_snapshot;
  const isExpired = !certificate.is_valid || new Date(certificate.expires_at) < new Date();
  const depositHistory = (data.deposit_history_90_days as Array<{ amount: number; created_at: string; ngn_equivalent?: number }>) || [];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>PROOF OF FUNDS CERTIFICATE</Text>
          <Text style={styles.subtitle}>Issued by Swiipt Technologies Limited, Lagos Nigeria</Text>
          <Text style={{ ...styles.subtitle, marginTop: 2 }}>Certificate #: {certificate.certificate_number}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Holder Details</Text>
          <View style={styles.row}><Text style={styles.label}>Full Name</Text><Text style={styles.value}>{data.holder_name as string || "—"}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Email</Text><Text style={styles.value}>{data.holder_email as string || "—"}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Goal Name</Text><Text style={styles.value}>{data.goal_name as string || "—"}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Destination</Text><Text style={styles.value}>{data.goal_destination as string || "—"}</Text></View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Balance Summary</Text>
          <View style={styles.row}><Text style={styles.label}>Current Balance</Text><Text style={styles.value}>{formatNgn(data.current_balance_ngn as number || 0)}</Text></View>
          <View style={styles.row}><Text style={styles.label}>28-Day Minimum Balance</Text><Text style={styles.value}>{formatNgn(data.twenty_eight_day_min_balance_ngn as number || 0)}</Text></View>
          <View style={styles.row}><Text style={styles.label}>New Deposits (28 days)</Text><Text style={styles.value}>{formatNgn(data.total_new_deposits_28d as number || 0)}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Total 90 Days</Text><Text style={styles.value}>{formatNgn(data.total_deposits_90d as number || 0)}</Text></View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Deposit History (90 days)</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.col1}>Date</Text>
              <Text style={styles.col2}>Amount</Text>
              <Text style={styles.col3}>NGN Equivalent</Text>
            </View>
            {depositHistory.slice(0, 20).map((dep, i) => (
              <View key={i} style={styles.tableRow}>
                <Text style={styles.col1}>{new Date(dep.created_at).toLocaleDateString("en-GB")}</Text>
                <Text style={styles.col2}>{formatNgn(dep.amount)}</Text>
                <Text style={styles.col3}>{dep.ngn_equivalent ? formatNgn(dep.ngn_equivalent) : "—"}</Text>
              </View>
            ))}
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
          <Text>This certificate confirms that the above-named individual maintains a verified savings goal with Swiipt Technologies Limited.</Text>
          <Text style={{ marginTop: 2 }}>Certificate #{certificate.certificate_number} · Issued {formatDate(certificate.issued_at)}</Text>
          <Text>Swiipt Technologies Limited, Lagos Nigeria · www.swiipt.com</Text>
        </View>
      </Page>
    </Document>
  );
}
