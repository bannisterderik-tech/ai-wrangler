import { and, eq } from "drizzle-orm";
import { db } from "./db";
import { newId } from "./customers";
import { IsolationError, assertBound, assertNotTakenByAnother, boundIds } from "./isolation";
import { audit, boundResources } from "./schema";
import { pgCode } from "./api";

export type BindItem = { resourceId: string; name: string; meta?: Record<string, unknown> };

/**
 * Bind repos or Vercel projects to exactly one customer.
 * Two walls: this check, and a unique index on (provider, resource_id) so a race
 * cannot slip the same repo into two customers.
 */
export async function bindResources(
  customerId: string,
  provider: "github" | "vercel",
  items: BindItem[],
  opts: { replace?: boolean; actor?: string } = {},
) {
  const replace = opts.replace ?? true;
  for (const item of items) {
    if (!item.resourceId) throw new IsolationError(`${provider} resource id required`, 400);
    await assertNotTakenByAnother(customerId, provider, item.resourceId);
  }

  try {
    await db.transaction(async (tx) => {
      if (replace) {
        await tx
          .delete(boundResources)
          .where(and(eq(boundResources.customerId, customerId), eq(boundResources.provider, provider)));
      }
      if (items.length) {
        await tx.insert(boundResources).values(
          items.map((item) => ({
            id: newId(),
            customerId,
            provider,
            resourceId: item.resourceId,
            name: item.name || item.resourceId,
            metaJson: item.meta ? JSON.stringify(item.meta) : null,
          })),
        );
      }
    });
  } catch (e) {
    // pgCode walks the cause chain. Reading .code off the top-level object
    // never matched, because Drizzle rethrows as DrizzleQueryError with the
    // driver error underneath — so this branch had never once run.
    if (pgCode(e) === "23505") {
      throw new IsolationError(
        `one of those is already bound to another customer. no overlap.`,
        403,
      );
    }
    throw e;
  }

  // Read back and assert: what we claim is bound must actually be bound.
  const bound = await boundIds(customerId, provider);
  for (const item of items) assertBound(customerId, provider, item.resourceId, bound);

  if (items.length) {
    await db.insert(audit).values({
      customerId,
      actor: opts.actor || "you",
      action: `bound ${provider} resources`,
      target: items.map((i) => i.resourceId).join(", "),
      at: new Date(),
    });
  }
  return bound;
}
