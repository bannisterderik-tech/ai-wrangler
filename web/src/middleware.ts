import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, authConfigured, isClient, readSession } from "@/lib/auth";

/** Open to the world. Everything else needs an operator session. */
const PUBLIC = [
  "/login",
  "/api/health",
  "/api/mcp",
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
  const isPublic = PUBLIC.some((p) => pathname === p);

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
        pathname.startsWith("/api/auth/");
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
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
