import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Stripe, over REST.
 *
 * No SDK: two endpoints and one signature check, all of which are plain HTTP,
 * against a dependency that would need updating forever.
 *
 * Card details never touch this server. Checkout is Stripe's own hosted page,
 * so the deposit is taken entirely on their side and nothing here is ever in
 * scope for handling a card number.
 */

const KEY = process.env.STRIPE_SECRET_KEY;
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

export function stripeConfigured() {
  return Boolean(KEY);
}

export function stripeStatus() {
  return {
    configured: stripeConfigured(),
    webhook: Boolean(WEBHOOK_SECRET),
    mode: KEY?.startsWith("sk_live") ? "live" : KEY ? "test" : null,
    missing: [!KEY && "STRIPE_SECRET_KEY", !WEBHOOK_SECRET && "STRIPE_WEBHOOK_SECRET"].filter(Boolean) as string[],
  };
}

async function stripe(path: string, form: Record<string, string>) {
  if (!KEY) throw new Error("Stripe is not configured.");
  const res = await fetch(`https://api.stripe.com/v1${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
      // Stripe dedupes on this, so a retried request cannot charge twice.
      ...(form.__idem ? { "Idempotency-Key": form.__idem } : {}),
    },
    body: new URLSearchParams(Object.fromEntries(Object.entries(form).filter(([k]) => k !== "__idem"))),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || `Stripe refused the request (${res.status})`);
  return data;
}

/**
 * One hosted page that takes the deposit AND starts the retainer.
 *
 * The proposal has always carried both numbers — a one-off `once_cents` and a
 * monthly `monthly_cents` the customer signs for. Only the first was ever
 * charged. Every recurring dollar the agency sold was then collected by hand,
 * outside the system that sold it.
 *
 * Stripe takes both in a single Checkout Session. From their API reference,
 * verbatim: "For `subscription` mode, there is a maximum of 20 line items with
 * recurring Prices and 20 line items with one-time Prices. Line items with
 * one-time Prices will be on the initial invoice only." So the deposit rides
 * the first invoice and the retainer recurs from there — one page, one card
 * entry, one decision by the customer.
 *
 * With no monthly it stays a plain one-off payment, because a subscription for
 * zero a month is a subscription that exists to confuse somebody later.
 */
export async function depositCheckout(opts: {
  proposalId: string;
  title: string;
  amountCents: number;
  /** The signed retainer. Zero means this really is a one-off. */
  monthlyCents?: number;
  currency: string;
  email?: string | null;
  successUrl: string;
  cancelUrl: string;
}) {
  const monthly = Math.max(0, Math.round(opts.monthlyCents ?? 0));
  const recurring = monthly > 0;

  const form: Record<string, string> = {
    // Keyed on the proposal, so a double-submitted form cannot open two
    // sessions and charge the deposit twice.
    __idem: `checkout_${opts.proposalId}_${recurring ? "sub" : "once"}`,
    mode: recurring ? "subscription" : "payment",
    success_url: opts.successUrl,
    cancel_url: opts.cancelUrl,
    ...(opts.email ? { customer_email: opts.email } : {}),
    // The webhook reads this back. It is the only link from money to proposal
    // that we can trust, because the browser never gets to assert it.
    "metadata[proposal_id]": opts.proposalId,
  };

  let i = 0;
  if (opts.amountCents > 0) {
    form[`line_items[${i}][quantity]`] = "1";
    form[`line_items[${i}][price_data][currency]`] = opts.currency;
    form[`line_items[${i}][price_data][unit_amount]`] = String(opts.amountCents);
    form[`line_items[${i}][price_data][product_data][name]`] = `${opts.title} — deposit`.slice(0, 250);
    i++;
  }
  if (recurring) {
    form[`line_items[${i}][quantity]`] = "1";
    form[`line_items[${i}][price_data][currency]`] = opts.currency;
    form[`line_items[${i}][price_data][unit_amount]`] = String(monthly);
    form[`line_items[${i}][price_data][recurring][interval]`] = "month";
    form[`line_items[${i}][price_data][product_data][name]`] = `${opts.title} — monthly`.slice(0, 250);
    // Carried onto the subscription itself, so later invoices — which arrive
    // long after this session is gone — still say who they belong to.
    form["subscription_data[metadata][proposal_id]"] = opts.proposalId;
  } else {
    form["payment_intent_data[metadata][proposal_id]"] = opts.proposalId;
  }

  const data = await stripe("/checkout/sessions", form);
  return { id: data.id as string, url: data.url as string, recurring };
}

/** Read one subscription back, for the fields a webhook did not carry. */
export async function readSubscription(id: string) {
  if (!KEY) throw new Error("Stripe is not configured.");
  const res = await fetch(`https://api.stripe.com/v1/subscriptions/${encodeURIComponent(id)}`, {
    headers: { Authorization: `Bearer ${KEY}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || `Stripe refused the request (${res.status})`);
  return data;
}

/** Stop billing a customer. `now` skips the rest of the paid period. */
export async function cancelSubscription(id: string, now = false) {
  if (!KEY) throw new Error("Stripe is not configured.");
  if (now) {
    const res = await fetch(`https://api.stripe.com/v1/subscriptions/${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${KEY}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error?.message || "Stripe refused the cancellation");
    return data;
  }
  // The kinder default: they keep what they have paid for, and it does not renew.
  return stripe(`/subscriptions/${encodeURIComponent(id)}`, { cancel_at_period_end: "true" });
}

/**
 * A hosted page where a customer fixes their own card.
 *
 * The answer to a failed payment. We never see the card, and nobody has to read
 * a number down a phone line.
 */
export async function billingPortal(stripeCustomerId: string, returnUrl: string) {
  const data = await stripe("/billing_portal/sessions", {
    customer: stripeCustomerId,
    return_url: returnUrl,
  });
  return data.url as string;
}

/**
 * Verify a webhook actually came from Stripe.
 *
 * This is the whole reason the customer is created here and not on the success
 * redirect: anyone can open a success URL. Only Stripe can sign this.
 */
export function verifyWebhook(payload: string, header: string | null) {
  if (!WEBHOOK_SECRET) throw new Error("STRIPE_WEBHOOK_SECRET is not set, so no webhook can be trusted.");
  if (!header) throw new Error("no signature");
  const parts = Object.fromEntries(
    header.split(",").map((p) => {
      const i = p.indexOf("=");
      return [p.slice(0, i), p.slice(i + 1)];
    }),
  );
  const t = parts.t;
  const v1 = parts.v1;
  if (!t || !v1) throw new Error("malformed signature");

  // Five minutes, so a captured request cannot be replayed later.
  const age = Math.abs(Date.now() / 1000 - Number(t));
  if (!Number.isFinite(age) || age > 300) throw new Error("signature too old");

  const expected = createHmac("sha256", WEBHOOK_SECRET).update(`${t}.${payload}`).digest("hex");
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(v1, "hex");
  if (a.length !== b.length || !timingSafeEqual(a, b)) throw new Error("signature does not match");

  return JSON.parse(payload);
}
