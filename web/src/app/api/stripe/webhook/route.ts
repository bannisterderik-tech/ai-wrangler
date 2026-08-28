import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { agencyLeads, audit, orchLog, proposalPayments, proposals } from "@/lib/schema";
import { verifyWebhook } from "@/lib/stripe";
import { ensureCustomer } from "@/lib/customers";

/**
 * Money landing is what makes a customer.
 *
 * Deliberately NOT the success redirect. Anyone can open a success URL — it
 * proves a browser visited a page, not that anyone paid. A signed webhook is
 * the only statement about money we did not get from the person who owes it.
 *
 * Stripe retries until it gets a 2xx, so everything here has to be safe to run
 * twice. Idempotency is enforced by two unique indexes — one on the Stripe
 * session id, one on proposals.customer_id — rather than by this handler
 * remembering anything.
 */
export async function POST(req: Request) {
  const raw = await req.text();
  let event;
  try {
    event = verifyWebhook(raw, req.headers.get("stripe-signature"));
  } catch (e) {
    // A bad signature is not our problem to explain. Say no and stop.
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    // Acknowledge everything else, or Stripe retries it forever.
    return NextResponse.json({ received: true });
  }

  const session = event.data?.object ?? {};
  const proposalId = session.metadata?.proposal_id;
  if (!proposalId) return NextResponse.json({ received: true, ignored: "no proposal in metadata" });
  if (session.payment_status !== "paid") {
    return NextResponse.json({ received: true, ignored: `payment_status ${session.payment_status}` });
  }

  const [p] = await db.select().from(proposals).where(eq(proposals.id, proposalId)).limit(1);
  if (!p) return NextResponse.json({ received: true, ignored: "no such proposal" });

  await db
    .update(proposalPayments)
    .set({ status: "paid", paidAt: new Date(), intentId: session.payment_intent ?? null })
    .where(eq(proposalPayments.sessionId, session.id));

  // Already converted by an earlier delivery of this same event.
  if (p.customerId) {
    return NextResponse.json({ received: true, customer: p.customerId, already: true });
  }

  const [lead] = await db.select().from(agencyLeads).where(eq(agencyLeads.id, p.leadId)).limit(1);
  const name = lead?.company ?? p.title;
  // Adopts an existing row rather than failing on a duplicate slug — a webhook
  // that cannot succeed is a webhook Stripe retries forever.
  const customer = await ensureCustomer(name, name);
  const id = customer.id;

  const claimed = await db
    .update(proposals)
    .set({ status: "paid", customerId: id })
    .where(eq(proposals.id, p.id))
    .returning({ id: proposals.id });

  if (claimed.length) {
    await db.update(agencyLeads).set({ stage: "won" }).where(eq(agencyLeads.id, p.leadId));
    await db.insert(orchLog).values({
      customerId: id,
      tag: "you",
      text: `${name} paid the deposit on "${p.title}". They are a customer now.`,
      at: new Date(),
    });
    await db.insert(audit).values({
      customerId: id,
      actor: "stripe",
      action: "deposit paid — lead became a customer",
      target: `${p.id} · ${name}`,
      at: new Date(),
    });
  }

  return NextResponse.json({ received: true, customer: id });
}
