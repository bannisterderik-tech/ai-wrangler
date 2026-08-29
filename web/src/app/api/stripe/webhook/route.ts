import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  agencyLeads, audit, orchLog, proposalPayments, proposals,
  subscriptionInvoices, subscriptions,
} from "@/lib/schema";
import { verifyWebhook } from "@/lib/stripe";
import { ensureCustomer, newId } from "@/lib/customers";
import { raiseEvent } from "@/lib/agent-events";

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

  // The recurring half. These arrive for months after the session that started
  // them, so they are keyed on the subscription rather than the checkout.
  if (
    event.type === "invoice.paid" ||
    event.type === "invoice.payment_failed" ||
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.deleted"
  ) {
    return handleSubscriptionEvent(event);
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

  // A session in subscription mode carries the subscription it just started.
  // Record it now, so the first invoice.paid has something to attach to.
  if (session.subscription) {
    await db
      .insert(subscriptions)
      .values({
        id: "SB" + newId().slice(0, 10),
        tenantId: p.tenantId,
        customerId: id,
        proposalId: p.id,
        stripeSubscriptionId: String(session.subscription),
        stripeCustomerId: session.customer ? String(session.customer) : null,
        status: "active",
        currency: p.currency,
        monthlyCents: p.monthlyCents,
        startedAt: new Date(),
      })
      .onConflictDoNothing();
    await db.insert(orchLog).values({
      customerId: id,
      tag: "you",
      text: `${name} is on ${money(p.monthlyCents)}/mo from today.`,
      at: new Date(),
    });
  }

  return NextResponse.json({ received: true, customer: id });
}

const money = (c: number) => `$${(c / 100).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

/**
 * Which subscription an invoice belongs to.
 *
 * Stripe moved this. It used to be `invoice.subscription`; on newer API
 * versions it is `invoice.parent.subscription_details.subscription`. Both are
 * read, because the account's API version is a dashboard setting we do not
 * control and a silent miss here means a renewal is never counted.
 */
function subscriptionOnInvoice(invoice: Record<string, unknown>): string {
  const flat = invoice.subscription;
  if (typeof flat === "string" && flat) return flat;

  const parent = invoice.parent as Record<string, unknown> | undefined;
  const details = parent?.subscription_details as Record<string, unknown> | undefined;
  const nested = details?.subscription;
  if (typeof nested === "string" && nested) return nested;

  // Expanded objects arrive as { id, ... } rather than a bare string.
  for (const candidate of [flat, nested]) {
    const id = (candidate as Record<string, unknown> | undefined)?.id;
    if (typeof id === "string" && id) return id;
  }
  return "";
}

/**
 * Renewals, failures and cancellations.
 *
 * Everything here is keyed on the Stripe subscription id and safe to run twice,
 * because Stripe redelivers. `collected_cents` is built from invoice rows with
 * a unique index rather than incremented blindly — a counter that a retry can
 * double is a revenue figure nobody can trust.
 */
async function handleSubscriptionEvent(event: {
  type: string;
  data?: { object?: Record<string, unknown> };
}) {
  const o = (event.data?.object ?? {}) as Record<string, unknown>;
  const subId = event.type.startsWith("invoice.") ? subscriptionOnInvoice(o) : String(o.id ?? "");
  if (!subId) return NextResponse.json({ received: true, ignored: "no subscription on the event" });

  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.stripeSubscriptionId, subId))
    .limit(1);
  if (!sub) {
    // Not ours, or the checkout that created it has not landed yet. Stripe
    // orders nothing, so this is normal and must not be an error.
    return NextResponse.json({ received: true, ignored: "no subscription on file" });
  }

  const now = new Date();

  if (event.type === "invoice.paid") {
    const amount = Number(o.amount_paid ?? 0);
    // The unique index on stripe_invoice_id is what makes a redelivery a no-op.
    const written = await db
      .insert(subscriptionInvoices)
      .values({
        id: "IV" + newId().slice(0, 10),
        subscriptionId: sub.id,
        customerId: sub.customerId,
        stripeInvoiceId: String(o.id ?? ""),
        amountCents: amount,
        status: "paid",
        reason: String(o.billing_reason ?? ""),
        hostedUrl: o.hosted_invoice_url ? String(o.hosted_invoice_url) : null,
        paidAt: now,
      })
      .onConflictDoNothing()
      .returning({ id: subscriptionInvoices.id });

    if (written.length) {
      await db
        .update(subscriptions)
        .set({
          status: "active",
          collectedCents: sub.collectedCents + amount,
          invoicesPaid: sub.invoicesPaid + 1,
          failures: 0,
          lastFailure: null,
          updatedAt: now,
        })
        .where(eq(subscriptions.id, sub.id));
    }
    return NextResponse.json({ received: true, counted: written.length > 0 });
  }

  if (event.type === "invoice.payment_failed") {
    const why = String(
      ((o.last_finalization_error as Record<string, unknown> | undefined)?.message as string) ??
        "the card was declined",
    );
    await db
      .insert(subscriptionInvoices)
      .values({
        id: "IV" + newId().slice(0, 10),
        subscriptionId: sub.id,
        customerId: sub.customerId,
        stripeInvoiceId: String(o.id ?? ""),
        amountCents: Number(o.amount_due ?? 0),
        status: "failed",
        reason: why.slice(0, 300),
        hostedUrl: o.hosted_invoice_url ? String(o.hosted_invoice_url) : null,
      })
      .onConflictDoNothing();
    await db
      .update(subscriptions)
      .set({ status: "past_due", failures: sub.failures + 1, lastFailure: why.slice(0, 300), updatedAt: now })
      .where(eq(subscriptions.id, sub.id));

    if (sub.customerId) {
      await db.insert(orchLog).values({
        customerId: sub.customerId,
        tag: "you",
        text: `A payment failed: ${why}. Stripe will retry — send them the billing portal if it keeps failing.`,
        at: now,
      });
      // Past due is not cut off. Stripe retries for days, and cancelling
      // somebody's service over one declined card is how you lose a customer
      // who would have paid on Tuesday.
      await raiseEvent({
        customerId: sub.customerId,
        kind: "external",
        summary: `Their card was declined — ${why}`,
        source: "stripe",
      });
    }
    return NextResponse.json({ received: true, pastDue: true });
  }

  // customer.subscription.updated / .deleted
  const status = String(o.status ?? "");
  const ended = event.type === "customer.subscription.deleted" || ["canceled", "unpaid"].includes(status);
  const periodEnd = Number(o.current_period_end ?? 0);
  await db
    .update(subscriptions)
    .set({
      status: ended ? (status || "canceled") : status || sub.status,
      currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : sub.currentPeriodEnd,
      canceledAt: ended ? now : sub.canceledAt,
      updatedAt: now,
    })
    .where(eq(subscriptions.id, sub.id));

  if (ended && sub.customerId && !sub.canceledAt) {
    await db.insert(audit).values({
      customerId: sub.customerId,
      actor: "stripe",
      action: `subscription ${status || "canceled"}`,
      target: `${money(sub.monthlyCents)}/mo`,
      at: now,
    });
    await db.insert(orchLog).values({
      customerId: sub.customerId,
      tag: "you",
      text:
        status === "unpaid"
          ? `Billing gave up after ${sub.failures} failed attempts. The work should stop until this is sorted.`
          : `Their subscription ended. ${money(sub.collectedCents)} collected over ${sub.invoicesPaid} invoices.`,
      at: now,
    });
  }
  return NextResponse.json({ received: true, status: status || "updated" });
}
