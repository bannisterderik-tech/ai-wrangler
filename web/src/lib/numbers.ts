import { and, eq } from "drizzle-orm";
import { db } from "./db";
import { boundResources, customers, usageEvents } from "./schema";
import { newId } from "./customers";

/**
 * Which number belongs to which customer, and what it costs.
 *
 * A phone number goes through the same wall as a repository, and for a sharper
 * reason: it is the identity a shop's own customers see and call back. Two
 * customers on one number means one shop answering the other's calls.
 *
 * The binding lives in `bound_resources`, so the (provider, resource_id) unique
 * index enforces one-number-one-customer in the database rather than in a code
 * path somebody can forget.
 */
export const NUMBER_PROVIDER = "twilio_number";

export type CustomerNumber = {
  customerId: string;
  customerName: string;
  tenantId: string;
  /** E.164, exactly as Twilio reports it — inbound routing matches on this. */
  number: string;
  /** Twilio's own PN… sid, needed to release it. */
  sid: string;
  label: string;
};

function meta(json: string | null): { sid?: string } {
  try {
    return json ? JSON.parse(json) : {};
  } catch {
    return {};
  }
}

const row = {
  customerId: boundResources.customerId,
  customerName: customers.name,
  tenantId: customers.tenantId,
  number: boundResources.resourceId,
  label: boundResources.name,
  metaJson: boundResources.metaJson,
};

const shape = (r: {
  customerId: string; customerName: string; tenantId: string;
  number: string; label: string; metaJson: string | null;
}): CustomerNumber => ({
  customerId: r.customerId,
  customerName: r.customerName,
  tenantId: r.tenantId,
  number: r.number,
  label: r.label,
  sid: meta(r.metaJson).sid ?? "",
});

/** Every number under one agency. */
export async function numbersFor(tenantId: string): Promise<CustomerNumber[]> {
  const rows = await db
    .select(row)
    .from(boundResources)
    .innerJoin(customers, eq(customers.id, boundResources.customerId))
    .where(and(eq(boundResources.provider, NUMBER_PROVIDER), eq(customers.tenantId, tenantId)));
  return rows.map(shape);
}

/** The number one customer sends from, or null. */
export async function numberForCustomer(customerId: string): Promise<CustomerNumber | null> {
  if (!customerId) return null;
  const [r] = await db
    .select(row)
    .from(boundResources)
    .innerJoin(customers, eq(customers.id, boundResources.customerId))
    .where(and(eq(boundResources.provider, NUMBER_PROVIDER), eq(boundResources.customerId, customerId)))
    .limit(1);
  return r ? shape(r) : null;
}

/**
 * Who an inbound call or text is for, decided by the number it arrived on.
 *
 * This is the entire reason numbers are per-customer. Everything inbound —
 * routing, attribution, the receptionist that comes next — hangs off this one
 * lookup, and the payload's `From` is never trusted for it.
 */
export async function customerForNumber(number: string): Promise<CustomerNumber | null> {
  const e164 = (number || "").trim();
  if (!e164) return null;
  const [r] = await db
    .select(row)
    .from(boundResources)
    .innerJoin(customers, eq(customers.id, boundResources.customerId))
    .where(and(eq(boundResources.provider, NUMBER_PROVIDER), eq(boundResources.resourceId, e164)))
    .limit(1);
  return r ? shape(r) : null;
}

/**
 * Twilio's US list prices, in tenths of a cent.
 *
 * Deliberately named as an assumption. These are what Twilio publishes for US
 * traffic, not what your account is actually charged — volume discounts, other
 * countries and toll-free all differ. The meter is here to be reconciled
 * against a real invoice, and a number in the code that pretends to be measured
 * is exactly the kind of thing this project has been burned by.
 */
export const RATES = {
  /** Per minute, outbound US. */
  callMillicentsPerMinute: 140,
  /** Per message segment. */
  smsMillicents: 79,
} as const;

/**
 * Write one line into the meter.
 *
 * Never throws. A missed meter row is a billing figure that is slightly low; an
 * inbound webhook that 500s because of one is a customer's calls failing.
 *
 * `ref` is the provider's own id and carries a unique index, so a retried
 * status callback cannot count the same call twice.
 */
export async function meter(opts: {
  customerId: string | null;
  tenantId: string;
  kind: "call" | "sms" | "ai" | "ads";
  quantity: number;
  unit: string;
  costMillicents: number;
  ref?: string | null;
  detail?: string | null;
}) {
  try {
    if (!opts.customerId) return false;
    const written = await db
      .insert(usageEvents)
      .values({
        id: "UE" + newId().slice(0, 10),
        tenantId: opts.tenantId,
        customerId: opts.customerId,
        kind: opts.kind,
        quantity: Math.max(0, Math.round(opts.quantity)),
        unit: opts.unit,
        costMillicents: Math.max(0, Math.round(opts.costMillicents)),
        ref: opts.ref ?? null,
        detail: opts.detail?.slice(0, 300) ?? null,
      })
      .onConflictDoNothing()
      .returning({ id: usageEvents.id });
    return written.length > 0;
  } catch {
    return false;
  }
}

/** Twilio bills a call in whole minutes, rounded up. So do we. */
export const callCost = (seconds: number) =>
  Math.max(1, Math.ceil(Math.max(0, seconds) / 60)) * RATES.callMillicentsPerMinute;

export const smsCost = (segments: number) => Math.max(1, segments) * RATES.smsMillicents;
