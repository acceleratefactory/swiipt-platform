"use client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function ExportButton({ transactions, userName }: { transactions: any[]; userName: string }) {
  function handleExport() {
    const headers = ["Date", "Type", "Goal", "Amount", "Currency", "NGN Equivalent", "Reference", "Status"];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows = transactions.map((t: any) => [
      new Date(t.date).toLocaleDateString("en-NG"),
      t.type,
      t.goal_name,
      t.amount,
      t.currency,
      t.ngn_equivalent,
      t.reference || "—",
      t.status,
    ]);

    const csv = [headers, ...rows].map(r => r.map(cell => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `swiipt-wallet-${userName.replace(/\s+/g, "-").toLowerCase()}-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      onClick={handleExport}
      style={{ padding: "0.5rem 1rem", background: "var(--midnight)", color: "white", fontWeight: 600, fontSize: "0.8125rem", borderRadius: "var(--radius-md)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem" }}
    >
      ↓ Export CSV
    </button>
  );
}
