import { NextRequest, NextResponse } from "next/server";
import dns from "dns";
import { promisify } from "util";

const lookup = promisify(dns.lookup);

// Block loopback / private / link-local / reserved addresses (SSRF guard).
function isPrivateIp(ip: string): boolean {
  if (ip === "localhost") return true;
  if (ip.includes(":")) return true; // IPv6 literal (::1, fe80::, etc.) -> block
  const m = ip.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!m) return true; // unparseable -> block
  const p = m.slice(1).map(Number);
  if (p[0] === 10) return true;
  if (p[0] === 172 && p[1] >= 16 && p[1] <= 31) return true;
  if (p[0] === 192 && p[1] === 168) return true;
  if (p[0] === 127) return true;
  if (p[0] === 169 && p[1] === 254) return true;
  if (p[0] === 0) return true;
  return false;
}

export const runtime = "nodejs";
export const maxDuration = 30;

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  if (!url) return new NextResponse("Missing url", { status: 400 });

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return new NextResponse("Invalid url", { status: 400 });
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return new NextResponse("Unsupported protocol", { status: 400 });
  }

  const hostname = parsed.hostname;
  try {
    const res: any = await lookup(hostname);
    const ip = res?.address;
    if (ip && isPrivateIp(ip)) return new NextResponse("Blocked", { status: 403 });
  } catch {
    return new NextResponse("DNS error", { status: 400 });
  }

  try {
    const upstream = await fetch(parsed.toString(), {
      method: "GET",
      redirect: "follow",
      signal: AbortSignal.timeout(20000),
      headers: { "User-Agent": "Swiipt/1.0 (cover proxy)" },
    });
    if (!upstream.ok) return new NextResponse("Upstream error", { status: 502 });

    const ct = upstream.headers.get("content-type") || "";
    if (!ct.startsWith("image/")) return new NextResponse("Not an image", { status: 415 });

    const buf = Buffer.from(await upstream.arrayBuffer());
    if (buf.length > 10 * 1024 * 1024) return new NextResponse("Too large", { status: 413 });

    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": ct,
        "Cache-Control": "public, max-age=86400, immutable",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch {
    return new NextResponse("Fetch failed", { status: 502 });
  }
}
