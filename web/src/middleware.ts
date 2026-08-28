import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, authConfigured, isClient, readSession } from "@/lib/auth";

/** Open to the world. Everything else needs an operator session. */
const PUBLIC = [
  "/login",
  "/api/health",
  "/api/mcp",
  // The worker reporting what a pass cost. Bearer session token, same as
  // /api/mcp, and it can only add spend to a job its own session holds.
  "/api/agent/spend",
  "/api/agent/next",
  // A worker reporting its own health, Bearer-authenticated like the rest.
  "/api/agent/heartbeat",
  // A worker collecting its maintenance queue and reporting how it went.
  "/api/agent/commands",
  // A copilot collecting the credentials for its own connections, and only
  // its own — the query is keyed on the session, not on an argument.
  "/api/agent/credentials",
  // What woke a copilot. The cheap half of the loop: nothing to react to
  // costs one request, and only an event becomes a model run.
  "/api/agent/events",
  // Stripe posts here with its own signature; there is no session to have.
  "/api/stripe/webhook",
  // Called from a customer's own deployed site. Write-only, key-authenticated,
  // and it cannot read anything — see the route.
  "/api/ingest/error",
  "/api/ingest/request",
  "/api/auth/magic/start",
  "/api/auth/magic/callback",
  "/api/auth/operator/password",
  "/api/auth/operator/github/start",
  "/api/auth/operator/github/callback",
  "/api/auth/logout",
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isApi = pathname.startsWith("/api/");
  // A proposal link is the credential — the recipient is a lead, not a user, and
  // has nothing to sign in with. The token is 32 random bytes and addresses one
  // proposal; the route can read, sign and pay that one and list nothing.
  const isProposal = pathname.startsWith("/p/") || pathname.startsWith("/api/p/");
  const isPublic = isProposal || PUBLIC.some((p) => pathname === p);

  if (!authConfigured()) {
    // No way to sign in means no way in. Never fall open.
    if (isApi && !isPublic) {
      return NextResponse.json(
        { error: "AI Wrangler has no login configured. Set OPERATOR_PASSWORD or GitHub OAuth." },
        { status: 503 },
      );
    }
    if (!isPublic && !isApi) return NextResponse.redirect(new URL("/login", req.nextUrl.origin));
    return NextResponse.next();
  }

  const session = await readSession(req.cookies.get(SESSION_COOKIE)?.value);
  if (session) {
    // A client user gets their own side of the house and nothing else. This is a
    // second wall, not the only one: every /api/client route also runs through
    // withCustomer, so a mistake here is still refused by Postgres.
    if (isClient(session)) {
      const theirs =
        pathname === "/client" ||
        pathname.startsWith("/client/") ||
        pathname.startsWith("/api/client/") ||
        // NOT all of /api/auth/. That prefix also holds the Vercel and GitHub
        // OAuth routes, which rewrite agency-wide credentials and bindings for
        // any customer id the caller names — so a signed-in client could bind
        // another tenant's Vercel account to themselves. A client needs to sign
        // in and sign out, and nothing else under here.
        pathname === "/api/auth/logout" ||
        pathname === "/api/auth/me" ||
        pathname.startsWith("/api/auth/magic/");
      if (!theirs) {
        if (isApi) return NextResponse.json({ error: "not yours" }, { status: 403 });
        return NextResponse.redirect(new URL("/client", req.nextUrl.origin));
      }
      return NextResponse.next();
    }
    // An operator has no business on a client screen; it would read as theirs.
    if (pathname === "/client" || pathname.startsWith("/client/")) {
      return NextResponse.redirect(new URL("/customers", req.nextUrl.origin));
    }
    if (pathname === "/login") return NextResponse.redirect(new URL("/", req.nextUrl.origin));
    return NextResponse.next();
  }

  if (isPublic) return NextResponse.next();
  if (isApi) return NextResponse.json({ error: "sign in first" }, { status: 401 });

  const to = new URL("/login", req.nextUrl.origin);
  if (pathname !== "/") to.searchParams.set("next", pathname);
  return NextResponse.redirect(to);
}

export const config = {
  // `brand` is the wordmark, which the login page needs before anyone has a
  // session. It holds two PNGs and nothing else — adding a directory here opens
  // whatever is in it, so keep it to assets that are meant to be public.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|brand/).*)"],
};
