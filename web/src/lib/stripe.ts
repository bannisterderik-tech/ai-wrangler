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

/** A hosted payment page for one deposit. */
export async function depositCheckout(opts: {
  proposalId: string;
  title: string;
  amountCents: number;
  currency: string;
  email?: string | null;
  successUrl: string;
  cancelUrl: string;
}) {
  const data = await stripe("/checkout/sessions", {
    __idem: `deposit_${opts.proposalId}`,
    mode: "payment",
    success_url: opts.successUrl,
    cancel_url: opts.cancelUrl,
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": opts.currency,
    "line_items[0][price_data][unit_amount]": String(opts.amountCents),
    "line_items[0][price_data][product_data][name]": opts.title.slice(0, 250),
    ...(opts.email ? { customer_email: opts.email } : {}),
    // The webhook reads this back. It is the only link from money to proposal
    // that we can trust, because the browser never gets to assert it.
    "metadata[proposal_id]": opts.proposalId,
    "payment_intent_data[metadata][proposal_id]": opts.proposalId,
  });
  return { id: data.id as string, url: data.url as string };
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
