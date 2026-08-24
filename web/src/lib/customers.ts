import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { boundResources, connections, customers } from "./schema";
import { slug } from "./crypto";

export function ensureCustomer(idOrName: string, name?: string) {
  const id = slug(idOrName);
  const existing = db.select().from(customers).where(eq(customers.id, id)).get();
  if (existing) {
    if (name && existing.name !== name) {
      db.update(customers).set({ name }).where(eq(customers.id, id)).run();
      return { ...existing, name };
    }
    return existing;
  }
  const row = { id, name: name || idOrName, createdAt: new Date() };
  db.insert(customers).values(row).run();
  return row;
}

export function listCustomersPublic() {
  const rows = db.select().from(customers).all();
  const conns = db.select().from(connections).all();
  const bound = db.select().from(boundResources).all();
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
