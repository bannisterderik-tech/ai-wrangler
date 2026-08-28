import { NextResponse } from "next/server";
import { HOUSE, SESSION_COOKIE, sameSecret, sessionCookieOptions, signSession } from "@/lib/auth";

/** Crude but real: a few tries per IP per minute, then the door stops answering. */
const attempts = new Map<string, { n: number; until: number }>();
const LIMIT = 6;
const WINDOW_MS = 60_000;

function throttled(ip: string) {
  const now = Date.now();
  const hit = attempts.get(ip);
  if (!hit || hit.until < now) {
    attempts.set(ip, { n: 1, until: now + WINDOW_MS });
    return false;
  }
  hit.n += 1;
  return hit.n > LIMIT;
}

export async function POST(req: Request) {
  const expected = process.env.OPERATOR_PASSWORD;
  if (!expected) {
    return NextResponse.json({ error: "password login is not configured" }, { status: 503 });
  }
  // The LEFTMOST x-forwarded-for hop is whatever the caller sent; keying on it
  // let an attacker mint a new bucket per request and brute-force a
  // single-factor admin password unthrottled. The rightmost hop is the one our
  // own proxy appended, and a platform header beats both.
  const fwd = req.headers.get("x-forwarded-for") || "";
  const hops = fwd.split(",").map((h) => h.trim()).filter(Boolean);
  const ip =
    req.headers.get("x-vercel-forwarded-for")?.trim() ||
    req.headers.get("x-real-ip")?.trim() ||
    hops[hops.length - 1] ||
    "local";
  if (throttled(ip)) {
    return NextResponse.json({ error: "too many tries — wait a minute" }, { status: 429 });
  }
  const body = await req.json().catch(() => ({}));
  if (!sameSecret(String(body.password || ""), expected)) {
    return NextResponse.json({ error: "wrong password" }, { status: 401 });
  }
  const token = await signSession({ sub: "operator", name: "Operator", via: "password",
    // The password is the house key: it signs you in as the owner of the
    // product, not as a tenant.
    tid: HOUSE,
    trole: "owner" as const,
  });
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  return res;
}
