// Generate unique payment reference
// Format: SWP-[6USERID]-[6TIMESTAMP]
// This must only be called server-side (in Edge Functions or API routes)
export function generatePaymentReference(userId: string): string {
  const userPrefix = userId.replace(/-/g, '').slice(0, 6).toUpperCase();
  const timeStamp = Date.now().toString().slice(-6);
  return `SWP-${userPrefix}-${timeStamp}`;
}
