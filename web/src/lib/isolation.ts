import { and, eq } from "drizzle-orm";
import { db } from "./db";
import { boundResources } from "./schema";

export class IsolationError extends Error {
  status: number;
  constructor(message: string, status = 403) {
    super(message);
    this.name = "IsolationError";
    this.status = status;
  }
}

export function assertBound(
  customerId: string,
  kind: "vercel" | "github",
  resourceId: string,
  allow: string[],
) {
  if (!resourceId) throw new IsolationError(`${kind} resource id required`, 400);
  if (!allow.length) {
    throw new IsolationError(
      `no ${kind} resources bound to customer ${customerId} — bind one before a job can touch it`,
      409,
    );
  }
  if (!allow.includes(resourceId)) {
    throw new IsolationError(
      `refused: ${kind} ${resourceId} is not bound to customer ${customerId}. our github, their walls.`,
      403,
    );
  }
}

export async function boundIds(customerId: string, kind: "vercel" | "github") {
  const rows = await db
    .select({ resourceId: boundResources.resourceId })
    .from(boundResources)
    .where(and(eq(boundResources.customerId, customerId), eq(boundResources.provider, kind)));
  return rows.map((r) => r.resourceId);
}

/**
 * The gate every job goes through: this customer, this repo or project, or nothing.
 * Binding Harbor's repo to Brightline is a 403, not a warning.
 */
export async function assertBoundToCustomer(
  customerId: string,
  kind: "vercel" | "github",
  resourceId: string,
) {
  if (!resourceId) throw new IsolationError(`${kind} resource id required`, 400);
  // Owned by someone else is a flat refusal — never a "you have nothing bound yet" hint.
  const rows = await db
    .select()
    .from(boundResources)
    .where(and(eq(boundResources.provider, kind), eq(boundResources.resourceId, resourceId)));
  const owner = rows[0];
  if (owner && owner.customerId !== customerId) {
    throw new IsolationError(
      `refused: ${kind} ${resourceId} belongs to customer ${owner.customerId} — it is not bound to customer ${customerId}. our github, their walls.`,
      403,
    );
  }
  assertBound(customerId, kind, resourceId, await boundIds(customerId, kind));
}

/** Refuse to hand a resource to a second customer. Also enforced by a unique index. */
export async function assertNotTakenByAnother(
  customerId: string,
  kind: "vercel" | "github",
  resourceId: string,
) {
  const rows = await db
    .select()
    .from(boundResources)
    .where(and(eq(boundResources.provider, kind), eq(boundResources.resourceId, resourceId)));
  const other = rows.find((r) => r.customerId !== customerId);
  if (other) {
    throw new IsolationError(
      `${resourceId} is already bound to customer ${other.customerId}. no overlap.`,
      403,
    );
  }
}
