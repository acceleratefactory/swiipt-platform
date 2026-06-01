// Generate unique referral code for new user
export function generateReferralCode(fullName: string): string {
  const namePart = fullName
    .split(' ')[0]
    .slice(0, 4)
    .toUpperCase()
    .replace(/[^A-Z]/g, '');
  const randomPart = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${namePart}-${randomPart}`;
}
