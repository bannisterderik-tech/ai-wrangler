/**
 * Where this deploy actually lives, from the outside.
 *
 * Behind a proxy `new URL(req.url).origin` is the container's bind address —
 * https://0.0.0.0:8080 — which is fine for serving and useless in a link you
 * email someone.
 *
 * Order matters, and it is a trust order rather than a convenience one. The
 * Host header is set by the caller, so believing it lets someone request a
 * sign-in link that points at their own server and collects the token when the
 * real operator clicks it. Platform-provided values and an explicit setting are
 * trustworthy; headers are the last resort.
 */
export function publicOrigin(req: Request): string {
  const explicit = process.env.PUBLIC_ORIGIN?.trim();
  if (explicit) return explicit.replace(/\/+$/, "");

  // Set by the platform, not by the caller.
  const railway = process.env.RAILWAY_PUBLIC_DOMAIN?.trim();
  if (railway) return `https://${railway.replace(/^https?:\/\//, "").replace(/\/+$/, "")}`;

  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim() || process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${vercel.replace(/^https?:\/\//, "").replace(/\/+$/, "")}`;

  const host = req.headers.get("x-forwarded-host")?.split(",")[0]?.trim() || req.headers.get("host")?.trim();
  if (host) {
    const proto = req.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() || "https";
    return `${proto}://${host}`;
  }

  return new URL(req.url).origin;
}

/**
 * The origin for something that leaves the building — a sign-in link, a
 * proposal link, an OAuth callback.
 *
 * Same order, minus the last resort. The comment above says believing the Host
 * header lets someone request a sign-in link pointing at their own server, and
 * then the function believed it anyway. On Railway and Vercel a platform value
 * is always present so this never fires; on a bare Node host — which the
 * Dockerfile explicitly invites — nothing was set and the header decided where
 * an operator's one-time token was sent.
 *
 * Refusing is the only safe answer: a sign-in email nobody can send beats one
 * that signs an attacker in as you.
 */
export function trustedOrigin(req: Request): string {
  const explicit = process.env.PUBLIC_ORIGIN?.trim();
  if (explicit) return explicit.replace(/\/+$/, "");
  const railway = process.env.RAILWAY_PUBLIC_DOMAIN?.trim();
  if (railway) return `https://${railway.replace(/^https?:\/\//, "").replace(/\/+$/, "")}`;
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim() || process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${vercel.replace(/^https?:\/\//, "").replace(/\/+$/, "")}`;

  // Local development has no proxy in front of it, so the host IS the origin.
  if (process.env.NODE_ENV !== "production") return publicOrigin(req);

  throw new Error(
    "PUBLIC_ORIGIN is not set. Links that leave this server — sign-in links, proposal links — would be built " +
      "from the caller's own Host header, which lets someone send themselves your sign-in link. Set PUBLIC_ORIGIN " +
      "to this deploy's real URL.",
  );
}

/**
 * A redirect target that cannot leave this origin.
 *
 * Checking the string was not enough. WHATWG URL folds a backslash to a slash
 * for special schemes, so "/\\evil.com" and "/\t/evil.com" both begin with a
 * single "/", both survive a `!startsWith("//")` guard, and both resolve to
 * https://evil.com. On the magic-link callback that redirect happens *after*
 * the session cookie is set, which turns it into login-CSRF with a free
 * off-site bounce.
 *
 * Resolving against our own origin and comparing the result is the only check
 * that agrees with what the browser will actually do.
 */
export function safeNext(next: string | null | undefined, origin: string, fallback = "/") {
  if (!next) return fallback;
  try {
    const url = new URL(next, origin);
    if (url.origin !== new URL(origin).origin) return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}
