import { NextResponse } from "next/server";
import { and, desc, eq, gte, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { fail, guardTenant, operator } from "@/lib/api";
import { audit, customers, subscriptionInvoices, subscriptions, usageEvents } from "@/lib/schema";
import { customerIdsFor, ownedBy } from "@/lib/tenant-scope";
import { billingPortal, cancelSubscription, stripeConfigured } from "@/lib/stripe";
import { publicOrigin } from "@/lib/origin";

/**
 * What is actually being collected.
 *
 * Every figure here is a sum of rows Stripe told us about, never a projection.
 * MRR counts only subscriptions currently billing — counting a cancelled one
 * because it was worth something last month is how a dashboard starts lying.
 */
export async function GET() {
  const t = await guardTenant();
  if ("error" in t) return t.error;
  try {
    const rows = await db
      .select({
        id: subscriptions.id,
        customerId: subscriptions.customerId,
        customer: customers.name,
        status: subscriptions.status,
        monthlyCents: subscriptions.monthlyCents,
        collectedCents: subscriptions.collectedCents,
        invoicesPaid: subscriptions.invoicesPaid,
        failures: subscriptions.failures,
        lastFailure: subscriptions.lastFailure,
        currentPeriodEnd: subscriptions.currentPeriodEnd,
        startedAt: subscriptions.startedAt,
        canceledAt: subscriptions.canceledAt,
        hasStripeCustomer: subscriptions.stripeCustomerId,
      })
      .from(subscriptions)
      .leftJoin(customers, eq(customers.id, subscriptions.customerId))
      .where(eq(subscriptions.tenantId, t.tenantId))
      .orderBy(desc(subscriptions.createdAt));

    const ids = rows.map((r) => r.id);
    const invoices = ids.length
      ? await db
          .select()
          .from(subscriptionInvoices)
          .where(inArray(subscriptionInvoices.subscriptionId, ids))
          .orderBy(desc(subscriptionInvoices.createdAt))
          .limit(50)
      : [];

    // Billing right now. `past_due` still counts — Stripe is retrying and most
    // of them recover; writing them off today would understate the business.
    const billing = rows.filter((r) => ["active", "trialing", "past_due"].includes(r.status));

    // What this month has cost us per customer. Not yet marked up or charged —
    // the meter has to exist and be trusted before anything is billed from it.
    const monthStart = new Date();
    monthStart.setUTCDate(1);
    monthStart.setUTCHours(0, 0, 0, 0);
    const mine = await customerIdsFor(t.tenantId);
    const usage = await db
      .select({
        customerId: usageEvents.customerId,
        kind: usageEvents.kind,
        quantity: sql<number>`sum(${usageEvents.quantity})::int`,
        millicents: sql<number>`sum(${usageEvents.costMillicents})::int`,
      })
      .from(usageEvents)
      .where(and(ownedBy(usageEvents.customerId, mine), gte(usageEvents.at, monthStart)))
      .groupBy(usageEvents.customerId, usageEvents.kind);

    return NextResponse.json({
      configured: stripeConfigured(),
      usage: usage.map((u) => ({
        customerId: u.customerId,
        kind: u.kind,
        quantity: u.quantity,
        // Tenths of a cent to dollars. Kept as a number of dollars because that
        // is what a screen shows; the precision lives in the column.
        cost: u.millicents / 100000,
      })),
      usageCost: usage.reduce((a, u) => a + u.millicents, 0) / 100000,
      mrr: billing.reduce((a, r) => a + r.monthlyCents, 0) / 100,
      collected: rows.reduce((a, r) => a + r.collectedCents, 0) / 100,
      counts: {
        billing: billing.length,
        pastDue: rows.filter((r) => r.status === "past_due").length,
        ended: rows.filter((r) => ["canceled", "unpaid"].includes(r.status)).length,
      },
      subscriptions: rows.map((r) => ({
        ...r,
        monthly: r.monthlyCents / 100,
        collected: r.collectedCents / 100,
        hasStripeCustomer: Boolean(r.hasStripeCustomer),
      })),
      invoices: invoices.map((i) => ({
        id: i.id,
        subscriptionId: i.subscriptionId,
        amount: i.amountCents / 100,
        status: i.status,
        reason: i.reason,
        hostedUrl: i.hostedUrl,
        paidAt: i.paidAt,
        createdAt: i.createdAt,
      })),
    });
  } catch (e) {
    return fail(e);
  }
}

/**
 * Cancel, or hand the customer a page to fix their own card.
 *
 * The portal is Stripe's own. We never see the card number, and nobody has to
 * read one down a phone line.
 */
export async function POST(req: Request) {
  const t = await guardTenant();
  if ("error" in t) return t.error;
  const actor = (await operator())?.name || "you";
  try {
    const body = await req.json().catch(() => ({}));
    const id = String(body.id || "");
    const action = String(body.action || "");

    const [sub] = await db
      .select()
      .from(subscriptions)
      .where(and(eq(subscriptions.id, id), eq(subscriptions.tenantId, t.tenantId)))
      .limit(1);
    if (!sub) return NextResponse.json({ error: "no such subscription" }, { status: 404 });
    if (!stripeConfigured()) return NextResponse.json({ error: "Stripe is not configured." }, { status: 503 });

    if (action === "portal") {
      if (!sub.stripeCustomerId) {
        return NextResponse.json({ error: "Stripe has no customer on this subscription yet." }, { status: 409 });
      }
      const url = await billingPortal(sub.stripeCustomerId, `${publicOrigin(req)}/billing`);
      return NextResponse.json({ ok: true, url });
    }

    if (action === "cancel" || action === "cancel_now") {
      if (!sub.stripeSubscriptionId) {
        return NextResponse.json({ error: "nothing to cancel at Stripe" }, { status: 409 });
      }
      // The state change is Stripe's to make. We wait for the webhook rather
      // than writing "canceled" here and hoping the two agree.
      await cancelSubscription(sub.stripeSubscriptionId, action === "cancel_now");
      await db.insert(audit).values({
        customerId: sub.customerId,
        actor,
        action: action === "cancel_now" ? "cancelled a subscription immediately" : "set a subscription to not renew",
        target: sub.customerId ?? sub.id,
        at: new Date(),
      });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "unknown action" }, { status: 400 });
  } catch (e) {
    return fail(e);
  }
}
