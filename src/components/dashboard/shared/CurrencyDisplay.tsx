export default function CurrencyDisplay({
  amount,
  currency,
}: {
  amount: number;
  currency: string;
  walletData?: Record<string, unknown>;
}) {
  const symbolMap: Record<string, string> = {
    NGN: "₦",
    USD: "$",
    EUR: "€",
    GBP: "£",
    CAD: "CA$",
    AED: "د.إ",
    QAR: "ر.ق",
  };
  const symbol = symbolMap[currency] || "₦";

  return (
    <span>
      {symbol}
      {amount.toLocaleString()}
    </span>
  );
}
