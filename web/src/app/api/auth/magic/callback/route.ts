import { NextResponse } from "next/server";
import { and, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { HOUSE, SESSION_COOKIE, isOperatorEmail, sessionCookieOptions, signSession } from "@/lib/auth";
import { audit, loginLinks, people } from "@/lib/schema";
import { hashToken } from "@/lib/session-token";
import { safeNext, publicOrigin } from "@/lib/origin";

/** Redeem a sign-in link. One use, then it is dead. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  // Redirect back to where the browser actually is, not to the container's bind
  // address — otherwise signing in lands you on https://0.0.0.0:8080.
  const origin = publicOrigin(req);
  const token = url.searchParams.get("token") || "";
  const bail = (msg: string) =>
    NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(msg)}`, origin));

  if (!token) return bail("That link is missing its token.");

  // Burn it in the same statement that reads it, and only if it is unused —
  // two clicks on the same link race here, and exactly one of them wins.
  const [link] = await db
    .update(loginLinks)
    .set({ usedAt: new Date() })
    .where(and(eq(loginLinks.tokenHash, hashToken(token)), isNull(loginLinks.usedAt)))
    .returning();

  if (!link) return bail("That link was already used, or it is not a link we handed out. Ask for a new one.");
  if (link.expiresAt.getTime() < Date.now()) return bail("That link expired. Ask for a new one.");
  // Both allowlists are re-checked at redemption, not only at send, so removing
  // someone kills the links already sitting in their inbox.
  // Any person, not only a client. A tenant's own staff are operators with a
  // people row, and looking only for clients meant a SaaS account's admin could
  // never sign in at all.
  const [who] = await db
    .select()
    .from(people)
    .where(sql`lower(${people.email}) = ${link.email} AND ${people.kind} IN ('client','operator')`)
    .limit(1);
  if (!isOperatorEmail(link.email) && !who) return bail("That address can no longer sign in here.");

  const name = who?.name || link.email.split("@")[0];
  const identity =
    who && who.kind === "client" && who.customerId
      ? { kind: "client" as const, cid: who.customerId, tid: who.tenantId }
      : who && who.kind === "operator"
        ? { kind: "operator" as const, tid: who.tenantId, trole: (who.tenantRole as "owner" | "admin" | "operator") ?? "operator" }
        // On the env allowlist and no row: that is the house, and the house owns
        // the product.
        : { kind: "operator" as const, tid: HOUSE, trole: "owner" as const };

  const session = await signSession({ sub: link.email, name, via: "email", ...identity });

  await db.insert(audit).values({
    customerId: null,
    actor: link.email,
    action: "signed in with a magic link",
    target: null,
    at: new Date(),
  });

  // A client lands on their own side of the house, never the agency's.
  const home = who?.customerId ? "/client" : "/";
  const next = url.searchParams.get("next");
  const wanted = safeNext(next, publicOrigin(req), home);
  const dest = who?.customerId && !wanted.startsWith("/client") ? home : wanted;
  const res = NextResponse.redirect(new URL(dest, origin));
  res.cookies.set(SESSION_COOKIE, session, sessionCookieOptions());
  return res;
}
