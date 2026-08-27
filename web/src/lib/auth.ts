/**
 * Operator login. One agency, one operator seat (for now) — the OS is not public.
 * Runs in the edge middleware as well as in route handlers, so: Web Crypto only,
 * no node:crypto imports in this file.
 */

export const SESSION_COOKIE = "wrangler_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export type Session = {
  sub: string;
  name: string;
  via: "password" | "github";
  exp: number;
};

function secret() {
  return process.env.AUTH_SECRET || process.env.TOKEN_ENCRYPTION_KEY || "";
}

/** Is there any way to sign in at all? If not, the OS refuses to open rather than sitting wide open. */
export function authConfigured() {
  return Boolean(
    process.env.OPERATOR_PASSWORD ||
      (process.env.GITHUB_OAUTH_CLIENT_ID && process.env.GITHUB_OAUTH_CLIENT_SECRET),
  );
}

export function githubLoginConfigured() {
  return Boolean(process.env.GITHUB_OAUTH_CLIENT_ID && process.env.GITHUB_OAUTH_CLIENT_SECRET);
}

export function passwordLoginConfigured() {
  return Boolean(process.env.OPERATOR_PASSWORD);
}

/** Logins allowed to run this agency. Empty means "the first GitHub account that signs in", so we require it in production. */
export function operatorAllowlist() {
  return (process.env.OPERATOR_GITHUB_LOGINS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

const enc = new TextEncoder();

function b64url(bytes: Uint8Array) {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function unb64url(text: string) {
  const padded = text.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((text.length + 3) % 4);
  const bin = atob(padded);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

async function hmacKey() {
  const raw = secret();
  if (!raw) throw new Error("AUTH_SECRET (or TOKEN_ENCRYPTION_KEY) must be set before anyone can sign in.");
  return crypto.subtle.importKey("raw", enc.encode(raw), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
    "verify",
  ]);
}

export async function signSession(input: Omit<Session, "exp"> & { exp?: number }) {
  const session: Session = {
    ...input,
    exp: input.exp ?? Math.floor(Date.now() / 1000) + MAX_AGE_SECONDS,
  };
  const body = b64url(enc.encode(JSON.stringify(session)));
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", await hmacKey(), enc.encode(body)));
  return `${body}.${b64url(sig)}`;
}

export async function readSession(token: string | undefined | null): Promise<Session | null> {
  if (!token || !secret()) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  let ok = false;
  try {
    ok = await crypto.subtle.verify("HMAC", await hmacKey(), unb64url(sig), enc.encode(body));
  } catch {
    return null;
  }
  if (!ok) return null;
  try {
    const session = JSON.parse(new TextDecoder().decode(unb64url(body))) as Session;
    if (!session.exp || session.exp * 1000 < Date.now()) return null;
    return session;
  } catch {
    return null;
  }
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  };
}

/** Constant-time compare that does not leak length through early return. */
export function sameSecret(a: string, b: string) {
  const ab = enc.encode(a);
  const bb = enc.encode(b);
  let diff = ab.length ^ bb.length;
  const len = Math.max(ab.length, bb.length);
  for (let i = 0; i < len; i++) diff |= (ab[i] ?? 0) ^ (bb[i] ?? 0);
  return diff === 0;
}
