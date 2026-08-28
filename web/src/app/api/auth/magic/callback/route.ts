import { NextResponse } from "next/server";
import { and, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { SESSION_COOKIE, isOperatorEmail, sessionCookieOptions, signSession } from "@/lib/auth";
import { audit, loginLinks, people } from "@/lib/schema";
import { hashToken } from "@/lib/session-token";
import { publicOrigin } from "@/lib/origin";

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
  const [who] = await db
    .select()
    .from(people)
    .where(sql`lower(${people.email}) = ${link.email} AND ${people.kind} = 'client'`)
    .limit(1);
  if (!isOperatorEmail(link.email) && !who) return bail("That address can no longer sign in here.");

  const client = who && who.customerId ? { kind: "client" as const, cid: who.customerId } : {};
  const name = who?.name || link.email.split("@")[0];
  const session = await signSession({
    sub: link.email,
    name,
    via: "email",
    ...(Object.keys(client).length ? client : { kind: "operator" as const }),
  });

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
  const wanted = next && next.startsWith("/") && !next.startsWith("//") ? next : home;
  const dest = who?.customerId && !wanted.startsWith("/client") ? home : wanted;
  const res = NextResponse.redirect(new URL(dest, origin));
  res.cookies.set(SESSION_COOKIE, session, sessionCookieOptions());
  return res;
}
