import { and, eq } from "drizzle-orm";
import { db } from "./db";
import { boundResources, customers } from "./schema";

/**
 * Which Google Ads account belongs to which customer, and to which agency.
 *
 * Two walls, and both are needed. The tenant wall stops one agency reading
 * another's customers. The binding wall stops a customer's campaign being run
 * against somebody else's Google Ads account — which is the expensive one,
 * because an ad account is a live payment method.
 *
 * The binding lives in `bound_resources`, the same table as repos and Vercel
 * projects, so it inherits the unique index that makes "one account, one
 * customer" a database fact rather than a code path.
 */
export type AdBinding = {
  customerId: string;
  customerName: string;
  /** The Zernio SocialAccount id — what every Zernio call takes as `accountId`. */
  accountId: string;
  /** The numeric Google Ads customer id. */
  adAccountId: string;
  name: string;
};

export const PROVIDER = "google_ads";

function parse(meta: string | null): { accountId?: string } {
  try {
    return meta ? JSON.parse(meta) : {};
  } catch {
    return {};
  }
}

/** Every Google Ads account bound under one agency. */
export async function listBindings(tenantId: string): Promise<AdBinding[]> {
  const rows = await db
    .select({
      customerId: boundResources.customerId,
      customerName: customers.name,
      adAccountId: boundResources.resourceId,
      name: boundResources.name,
      metaJson: boundResources.metaJson,
    })
    .from(boundResources)
    .innerJoin(customers, eq(customers.id, boundResources.customerId))
    .where(and(eq(boundResources.provider, PROVIDER), eq(customers.tenantId, tenantId)));
  return rows.map((r) => ({
    customerId: r.customerId,
    customerName: r.customerName,
    accountId: parse(r.metaJson).accountId ?? "",
    adAccountId: r.adAccountId,
    name: r.name,
  }));
}

/**
 * The binding for one customer, or null.
 *
 * Null for "no such customer on this account" and null for "that customer has
 * no ad account bound" — deliberately the same answer, so the reply never
 * confirms another agency's customer exists.
 */
export async function bindingFor(tenantId: string, customerId: string): Promise<AdBinding | null> {
  if (!customerId) return null;
  const [row] = await db
    .select({
      customerId: boundResources.customerId,
      customerName: customers.name,
      adAccountId: boundResources.resourceId,
      name: boundResources.name,
      metaJson: boundResources.metaJson,
    })
    .from(boundResources)
    .innerJoin(customers, eq(customers.id, boundResources.customerId))
    .where(
      and(
        eq(boundResources.provider, PROVIDER),
        eq(boundResources.customerId, customerId),
        eq(customers.tenantId, tenantId),
      ),
    )
    .limit(1);
  if (!row) return null;
  const accountId = parse(row.metaJson).accountId;
  if (!accountId) return null;
  return {
    customerId: row.customerId,
    customerName: row.customerName,
    accountId,
    adAccountId: row.adAccountId,
    name: row.name,
  };
}
