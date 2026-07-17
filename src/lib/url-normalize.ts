// P0#4 — URL normalizer for cross-source dedupe (audit §1.2).
// MUST stay in sync with normalize_url() in swiipt/p0_4_cross_source_dedupe.sql.
// Strips tracker query params, lowercases host, drops trailing slash, forces https.
const KEEP_QUERY_KEYS = new Set([
  "job", "id", "slug", "jobId", "vacancy", "p", "post",
]);

export function normalizeUrl(input?: string | null): string | null {
  if (!input || !input.trim()) return null;
  let u = input.trim().toLowerCase();
  u = u.replace(/^http:\/\//, "https://");
  u = u.replace(/#.*$/, "");

  const hostMatch = u.match(/^https:\/\/([^/]+)/);
  const host = hostMatch ? hostMatch[1] : "";
  const pathMatch = u.match(/^https:\/\/[^/]+(\/[^?]*)/);
  let path = pathMatch ? pathMatch[1] : "";
  const qMatch = u.match(/\?([^#]*)/);
  const q = qMatch ? qMatch[1] : "";

  let keepQ = "";
  if (q) {
    const kept = q
      .split("&")
      .filter((kv) => KEEP_QUERY_KEYS.has(kv.split("=")[0]))
      .join("&");
    keepQ = kept;
  }

  path = path.replace(/\/+$/, "");
  return `https://${host}${path}${keepQ ? `?${keepQ}` : ""}`;
}
