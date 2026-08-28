import { NextResponse } from "next/server";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { fail } from "@/lib/api";
import { agencyLeads, proposalItems, proposalPayments, proposals, signatures } from "@/lib/schema";
import { newId } from "@/lib/customers";
import { callerIp, documentHash, renderDocument, totals } from "@/lib/proposals";
import { depositCheckout, stripeConfigured } from "@/lib/stripe";
import { publicOrigin } from "@/lib/origin";

/**
 * The client's side of a proposal. No account, no password — the link IS the
 * credential, so it is 32 random bytes and it addresses exactly one proposal.
 *
 * Everything here is deliberately narrow: this route can read one proposal,
 * sign it, and start its deposit. It cannot list anything.
 */
async function load(token: string) {
  if (!token || token.length < 20) return null;
  const [p] = await db.select().from(proposals).where(eq(proposals.token, token)).limit(1);
  if (!p) return null;
  if (p.status === "void") return null;
  if (p.expiresAt && p.expiresAt.getTime() < Date.now()) return { proposal: p, expired: true as const };
  return { proposal: p, expired: false as const };
}

async function full(p: typeof proposals.$inferSelect) {
  const items = await db
    .select()
    .from(proposalItems)
    .where(eq(proposalItems.proposalId, p.id))
    .orderBy(asc(proposalItems.sort));
  const [lead] = await db.select().from(agencyLeads).where(eq(agencyLeads.id, p.leadId)).limit(1);
  const [sig] = await db.select().from(signatures).where(eq(signatures.proposalId, p.id)).limit(1);
  const document = renderDocument(p, items, lead?.company ?? "the client");
  return { items, lead, sig, document, t: totals(items, p) };
}

export async function GET(req: Request, ctx: RouteContext<"/api/p/[token]">) {
  try {
    const { token } = await ctx.params;
    const found = await load(token);
    if (!found) return NextResponse.json({ error: "This proposal is no longer available." }, { status: 404 });
    const { proposal: p } = found;
    if (found.expired) return NextResponse.json({ expired: true, title: p.title }, { status: 410 });

    const { items, lead, sig, document, t } = await full(p);
    // First open is worth knowing about; later ones are noise.
    if (!p.viewedAt) {
      await db
        .update(proposals)
        .set({ viewedAt: new Date(), status: p.status === "sent" ? "viewed" : p.status })
        .where(eq(proposals.id, p.id));
    }
    return NextResponse.json({
      id: p.id,
      title: p.title,
      summary: p.summary,
      terms: p.terms,
      status: p.status,
      currency: p.currency,
      company: lead?.company ?? null,
      contact: lead?.contact ?? null,
      email: lead?.email ?? null,
      items: items.map((i) => ({
        name: i.name, detail: i.detail, cadence: i.cadence, qty: i.qty, unitCents: i.unitCents,
      })),
      ...t,
      document,
      signed: sig
        ? { name: sig.typedName, at: sig.signedAt }
        : null,
      payable: stripeConfigured(),
    });
  } catch (e) {
    return fail(e);
  }
}

/** Sign it, or start the deposit. */
export async function POST(req: Request, ctx: RouteContext<"/api/p/[token]">) {
  try {
    const { token } = await ctx.params;
    const found = await load(token);
    if (!found) return NextResponse.json({ error: "This proposal is no longer available." }, { status: 404 });
    if (found.expired) return NextResponse.json({ error: "This proposal has expired." }, { status: 410 });
    const p = found.proposal;
    const body = await req.json().catch(() => ({}));

    if (body.action === "decline") {
      await db
        .update(proposals)
        .set({ status: "declined", declinedAt: new Date(), declineReason: String(body.reason || "").slice(0, 500) || null })
        .where(and(eq(proposals.id, p.id), eq(proposals.status, p.status)));
      return NextResponse.json({ ok: true, status: "declined" });
    }

    if (body.action === "sign") {
      const typed = String(body.name || "").trim();
      if (typed.length < 2) return NextResponse.json({ error: "Please type your full name to sign." }, { status: 400 });
      if (body.agreed !== true) {
        return NextResponse.json({ error: "Please tick the box to say you agree." }, { status: 400 });
      }
      const { document } = await full(p);
      const hash = documentHash(document);
      try {
        await db.insert(signatures).values({
          id: "S" + newId().slice(0, 8),
          proposalId: p.id,
          typedName: typed,
          email: String(body.email || "").trim() || null,
          // Evidence of what the proxy reported, not proof of origin. Recorded
          // as such: a forwarded header is caller-controlled.
          ip: callerIp(req),
          userAgent: (req.headers.get("user-agent") || "").slice(0, 400),
          documentHash: hash,
        });
      } catch {
        // The unique index on proposal_id is the "signed once" rule.
        return NextResponse.json({ error: "This proposal has already been signed." }, { status: 409 });
      }
      await db.update(proposals).set({ status: "signed" }).where(eq(proposals.id, p.id));
      return NextResponse.json({ ok: true, status: "signed", documentHash: hash });
    }

    if (body.action === "pay") {
      const [sig] = await db.select().from(signatures).where(eq(signatures.proposalId, p.id)).limit(1);
      if (!sig) return NextResponse.json({ error: "Sign the agreement first." }, { status: 409 });
      if (p.status === "paid") return NextResponse.json({ error: "The deposit is already paid." }, { status: 409 });
      if (!stripeConfigured()) {
        return NextResponse.json({ error: "Payments are not switched on yet. Ask us for an invoice." }, { status: 503 });
      }
      const { items, lead } = await full(p);
      const t = totals(items, p);
      if (t.dueTodayCents <= 0) {
        return NextResponse.json({ error: "There is no deposit due on this proposal." }, { status: 400 });
      }
      const origin = publicOrigin(req);
      const session = await depositCheckout({
        proposalId: p.id,
        title: `${p.title} — deposit`,
        amountCents: t.dueTodayCents,
        currency: p.currency,
        email: lead?.email ?? null,
        successUrl: `${origin}/p/${token}?paid=1`,
        cancelUrl: `${origin}/p/${token}`,
      });
      await db.insert(proposalPayments).values({
        id: "PY" + newId().slice(0, 8),
        proposalId: p.id,
        sessionId: session.id,
        amountCents: t.dueTodayCents,
        status: "pending",
      });
      return NextResponse.json({ ok: true, url: session.url });
    }

    return NextResponse.json({ error: "unknown action" }, { status: 400 });
  } catch (e) {
    return fail(e);
  }
}
