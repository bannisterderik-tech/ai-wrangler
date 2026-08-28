import { NextResponse } from "next/server";
import { and, gt, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { isOperatorEmail, magicLinkConfigured } from "@/lib/auth";
import { audit, loginLinks, people } from "@/lib/schema";
import { mailConfigured, sendMagicLink } from "@/lib/mail";
import { hashToken, mintToken } from "@/lib/session-token";
import { trustedOrigin } from "@/lib/origin";

const TTL_MINUTES = 15;
const MAX_PER_WINDOW = 5;
const WINDOW_MINUTES = 15;

/**
 * Ask for a sign-in link.
 *
 * The response is the same whether or not the address is an operator. Telling a
 * stranger "that email is not an admin here" hands them half the login, and the
 * only person who needs to know the difference is the one holding the mailbox.
 */
export async function POST(req: Request) {
  if (!magicLinkConfigured()) {
    return NextResponse.json(
      { error: "Magic link is not configured on this deploy. AUTH_SECRET must be set." },
      { status: 503 },
    );
  }

  const body = await req.json().catch(() => ({}));
  const email = String(body.email || "").trim().toLowerCase();
  // Byte-identical for an operator and a stranger. `delivered` describes this
  // deploy's mail wiring, not this address, so it is safe on both — and it has to
  // be on both, or its presence alone answers the question we refuse to answer.
  const same = {
    ok: true,
    message: "If that address can sign in here, a link is on its way.",
    delivered: await mailConfigured(),
  };

  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: "That does not look like an email address." }, { status: 400 });
  }
  // Two ways to be allowed in: the operator allowlist, or a client user row that
  // somebody deliberately created. Nothing else, and both look identical from out here.
  const [clientUser] = await db
    .select({ id: people.id })
    .from(people)
    .where(sql`lower(${people.email}) = ${email} AND ${people.kind} = 'client'`)
    .limit(1);

  if (!isOperatorEmail(email) && !clientUser) {
    // Deliberately indistinguishable from success, but recorded, because a
    // stranger guessing at admin addresses is worth seeing in the trail.
    await db.insert(audit).values({
      customerId: null,
      actor: email,
      action: "sign-in link refused — not an operator",
      target: null,
      at: new Date(),
    });
    return NextResponse.json(same);
  }

  // Throttle by email, not by IP: the address is the thing being protected and,
  // unlike X-Forwarded-For, the caller cannot make up a new one per request.
  const [recent] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(loginLinks)
    .where(
      and(
        sql`${loginLinks.email} = ${email}`,
        gt(loginLinks.createdAt, new Date(Date.now() - WINDOW_MINUTES * 60_000)),
      ),
    );
  if ((recent?.n ?? 0) >= MAX_PER_WINDOW) {
    return NextResponse.json(
      { error: `Too many links requested. Wait ${WINDOW_MINUTES} minutes.` },
      { status: 429 },
    );
  }

  const { raw } = mintToken();
  const origin = trustedOrigin(req);
  const url = `${origin}/api/auth/magic/callback?token=${encodeURIComponent(raw)}`;

  await db.insert(loginLinks).values({
    tokenHash: hashToken(raw),
    email,
    expiresAt: new Date(Date.now() + TTL_MINUTES * 60_000),
    requestedFrom: req.headers.get("user-agent")?.slice(0, 120) ?? null,
  });

  try {
    await sendMagicLink(email, url, TTL_MINUTES);
  } catch (e) {
    console.error("[wrangler] magic link send failed", e);
    // Say what the provider said. This is our own configuration, not anything
    // about the address, and hiding it means nobody can fix it.
    return NextResponse.json(
      { error: (e as Error).message || "Could not send the email." },
      { status: 502 },
    );
  }

  await db.insert(audit).values({
    customerId: null,
    actor: email,
    action: "sign-in link sent",
    target: (await mailConfigured()) ? "email" : "server log (no mail provider)",
    at: new Date(),
  });

  return NextResponse.json(same);
}
