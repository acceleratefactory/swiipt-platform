// Format a number as currency in the user's preferred currency
export function formatCurrency(
  amount: number,
  currencyCode: string = 'NGN',
  locale: string = 'en-NG'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

// Convert NGN amount to another currency using rate
export function convertFromNGN(
  amountNGN: number,
  targetCurrencyRate: number
): number {
  if (targetCurrencyRate === 0) return 0;
  return amountNGN / targetCurrencyRate;
}

// Convert any currency to NGN
export function convertToNGN(
  amount: number,
  currencyRate: number
): number {
  return amount * currencyRate;
}

// Get currency symbol
export const CURRENCY_SYMBOLS: Record<string, string> = {
  NGN: '₦',
  USD: '$',
  AED: 'AED',
  QAR: 'QAR',
  GBP: '£',
  CAD: 'CA$',
  EUR: '€',
};
