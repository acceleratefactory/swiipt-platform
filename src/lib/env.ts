function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const SUPABASE_URL = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
export const SUPABASE_ANON_KEY = requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
export const DUFFEL_API_KEY = process.env.DUFFEL_API_KEY || "";
export const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
