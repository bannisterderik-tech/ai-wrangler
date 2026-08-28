import { NextResponse } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { SESSION_COOKIE, isOperatorEmail, sessionCookieOptions, signSession } from "@/lib/auth";
import { audit, loginLinks } from "@/lib/schema";
import { hashToken } from "@/lib/session-token";

/** Redeem a sign-in link. One use, then it is dead. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token") || "";
  const bail = (msg: string) =>
    NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(msg)}`, url.origin));

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
  // The allowlist can change between sending and clicking. It wins.
  if (!isOperatorEmail(link.email)) return bail("That address is no longer an operator here.");

  const name = link.email.split("@")[0];
  const session = await signSession({ sub: link.email, name, via: "email" });

  await db.insert(audit).values({
    customerId: null,
    actor: link.email,
    action: "signed in with a magic link",
    target: null,
    at: new Date(),
  });

  const next = url.searchParams.get("next");
  const dest = next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
  const res = NextResponse.redirect(new URL(dest, url.origin));
  res.cookies.set(SESSION_COOKIE, session, sessionCookieOptions());
  return res;
}
