import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { boundResources, connections, customers } from "./schema";
import { slug } from "./crypto";

/**
 * Find or make a customer.
 *
 * `tenantId` decides who owns a new one, and — more importantly — who is
 * allowed to touch an existing one. Customer ids are slugs and slugs collide:
 * two agencies both signing "Acme" want the same row. Without the check below
 * the second one silently adopts and renames the first one's customer.
 */
export async function ensureCustomer(idOrName: string, name?: string, tenantId?: string) {
  const id = slug(idOrName);
  const [existing] = await db.select().from(customers).where(eq(customers.id, id)).limit(1);
  if (existing && tenantId && existing.tenantId !== tenantId) {
    throw new Error(`the name "${idOrName}" is already taken — pick a different one`);
  }
  if (existing) {
    if (name && existing.name !== name) {
      await db.update(customers).set({ name }).where(eq(customers.id, id));
      return { ...existing, name };
    }
    return existing;
  }
  const row = { id, name: name || idOrName, createdAt: new Date(), tenantId: tenantId ?? "ai-wrangler" };
  await db.insert(customers).values(row).onConflictDoNothing();
  return row;
}

export async function getCustomer(id: string) {
  const [row] = await db.select().from(customers).where(eq(customers.id, id)).limit(1);
  return row || null;
}

/**
 * The customer list, for one agency.
 *
 * The tenant is required rather than optional. An optional filter here is a
 * filter somebody forgets, and forgetting it hands one agency another's client
 * list — which is exactly what happened before this argument existed.
 */
export async function listCustomersPublic(tenantId: string) {
  const [rows, conns, bound] = await Promise.all([
    db.select().from(customers).where(eq(customers.tenantId, tenantId)),
    db.select().from(connections),
    db.select().from(boundResources),
  ]);
  return rows.map((c) => {
    const v = conns.find((x) => x.customerId === c.id && x.provider === "vercel");
    const n = bound.filter((b) => b.customerId === c.id && b.provider === "vercel").length;
    const gh = bound.filter((b) => b.customerId === c.id && b.provider === "github");
    return {
      id: c.id,
      name: c.name,
      createdAt: c.createdAt,
      vercel: v
        ? { connected: true, mode: v.mode, teamId: v.teamId, bound: n }
        : { connected: false },
      github: {
        bound: gh.length,
        repos: gh.map((b) => b.name),
      },
    };
  });
}

export function newId() {
  return randomUUID();
}
