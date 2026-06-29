export function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function getGroupDiscountPct(size: number, discounts: Record<string, number>): number {
  return discounts[size.toString()] || 0;
}

export function calculateGroupPrice(originalPrice: number, discountPct: number): number {
  return Math.round(originalPrice * (1 - discountPct / 100));
}

export function getExpiryDate(hours: number = 72): Date {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

export function getPaymentDeadline(days: number = 7): Date {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

export function generateTradeShowInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return "TS-" + code;
}

export function getTradeShowDiscountPct(targetGroupSize: number, discounts: Record<string, number>): number {
  const sizes = Object.keys(discounts).map(Number).sort((a, b) => a - b);
  let best = 0;
  for (const size of sizes) {
    if (targetGroupSize >= size) {
      best = discounts[size.toString()] || 0;
    }
  }
  return best;
}
