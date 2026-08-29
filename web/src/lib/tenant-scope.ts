import { and, eq, inArray, sql, type SQL } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";
import { db } from "./db";
import { customers, people } from "./schema";

/**
 * Which customers belong to an agency, and whether one of them is theirs.
 *
 * Most tenant tables do not carry `tenant_id` — they carry `customer_id`, and
 * reach the agency through `customers.tenant_id`. That indirection is why the
 * leaks kept happening: `guard()` reads as a check, the query looks scoped
 * because it names a customer, and nothing anywhere says which agency that
 * customer belongs to.
 *
 * So the rule is one function. A route either filters by `customerIdsFor()` or
 * asserts with `customerInTenant()`, and a route that does neither is the bug.
 */

/** Every customer id under one agency. */
export async function customerIdsFor(tenantId: string): Promise<string[]> {
  const rows = await db
    .select({ id: customers.id })
    .from(customers)
    .where(eq(customers.tenantId, tenantId));
  return rows.map((r) => r.id);
}

/**
 * The customer, or null.
 *
 * Null for "no such customer" and null for "belongs to another agency" —
 * deliberately the same answer. A route that distinguishes them confirms the
 * existence of rows the caller is not allowed to know about.
 */
export async function customerInTenant(tenantId: string, customerId: string) {
  if (!customerId) return null;
  const [row] = await db
    .select()
    .from(customers)
    .where(and(eq(customers.id, customerId), eq(customers.tenantId, tenantId)))
    .limit(1);
  return row ?? null;
}

/**
 * A `WHERE customer_id IN (...)` for this agency.
 *
 * An agency with no customers gets `false`, not an omitted condition. That
 * distinction is the whole point: a filter that evaporates when the list is
 * empty is a filter that returns everybody's rows on the one day it matters.
 */
export function ownedBy(column: PgColumn, ids: string[]): SQL {
  return ids.length ? inArray(column, ids) : sql`false`;
}

/**
 * A person on this account, or null.
 *
 * `people` carries `tenant_id` directly, so this is a plain check rather than a
 * join — but it exists here beside the customer one so a route author finds
 * both in the same place.
 */
export async function personInTenant(tenantId: string, personId: string) {
  if (!personId) return null;
  const [row] = await db
    .select()
    .from(people)
    .where(and(eq(people.id, personId), eq(people.tenantId, tenantId)))
    .limit(1);
  return row ?? null;
}
