import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * AI Wrangler runs on Postgres. SQLite is gone — it cannot survive a serverless
 * filesystem, and isolation has to live in the database, not in a file.
 *
 * The connection is built on first use, not on import. `next build` evaluates
 * every route module to collect page data, so a module-level throw here meant
 * the app could not COMPILE without a live database — which is a different and
 * much worse thing than not being able to RUN without one. It still refuses to
 * run without one.
 */

/** The role customer-scoped work runs as. It is not the owner, so RLS applies to it. */
export const TENANT_ROLE = "wrangler_tenant";

type Cache = { client?: postgres.Sql; db?: PostgresJsDatabase<typeof schema> };
const cache = globalThis as unknown as { __wrangler?: Cache };
cache.__wrangler ||= {};

function connectionUrl() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      process.env.VERCEL
        ? "AI Wrangler: DATABASE_URL is not set on this deploy. Add it in Project Settings → Environment Variables, for Production and Preview, then redeploy. SQLite cannot run here. See DEPLOY.md."
        : "AI Wrangler: DATABASE_URL is required (Postgres). Local: postgres://localhost:5432/wrangler_dev — see web/README.md.",
    );
  }
  return url;
}

export function getClient(): postgres.Sql {
  if (cache.__wrangler!.client) return cache.__wrangler!.client!;
  const made = postgres(connectionUrl(), {
    max: process.env.VERCEL ? 3 : 8,
    idle_timeout: 20,
    connect_timeout: 15,
    // Supabase's transaction pooler cannot do prepared statements.
    prepare: false,
  });
  cache.__wrangler!.client = made;
  return made;
}

export function getDb(): PostgresJsDatabase<typeof schema> {
  if (cache.__wrangler!.db) return cache.__wrangler!.db!;
  const made = drizzle(getClient(), { schema });
  cache.__wrangler!.db = made;
  return made;
}

/**
 * `db.select()` still reads the same everywhere; the difference is that touching
 * a property is what opens the connection, so importing this file is free.
 */
export const db = new Proxy({} as PostgresJsDatabase<typeof schema>, {
  get(_target, prop, receiver) {
    const real = getDb() as unknown as Record<string | symbol, unknown>;
    const value = Reflect.get(real, prop, receiver);
    return typeof value === "function" ? (value as (...a: unknown[]) => unknown).bind(real) : value;
  },
});

export const client = new Proxy({} as postgres.Sql, {
  get(_target, prop, receiver) {
    const real = getClient() as unknown as Record<string | symbol, unknown>;
    const value = Reflect.get(real, prop, receiver);
    return typeof value === "function" ? (value as (...a: unknown[]) => unknown).bind(real) : value;
  },
});

export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * Run queries as the tenant role with app.customer_id pinned for the transaction.
 * Row level security does the rest: a query written wrong still cannot read
 * another customer's rows. Isolation is enforced by Postgres, not by our care.
 */
export async function withCustomer<T>(customerId: string, fn: (tx: Tx) => Promise<T>): Promise<T> {
  if (!customerId) throw new Error("withCustomer requires a customerId");
  return db.transaction(async (tx) => {
    await tx.execute(sql`select set_config('app.customer_id', ${customerId}, true)`);
    await tx.execute(sql.raw(`set local role ${TENANT_ROLE}`));
    return fn(tx);
  });
}

export { schema };
