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
