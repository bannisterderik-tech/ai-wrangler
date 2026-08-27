import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * AI Wrangler runs on Postgres. SQLite is gone — it cannot survive a serverless
 * filesystem, and isolation has to live in the database, not in a file.
 */
if (process.env.VERCEL && !process.env.DATABASE_URL) {
  throw new Error(
    "AI Wrangler: SQLite cannot run on Vercel. Set DATABASE_URL to Postgres before deploying. See HANDOFF.md.",
  );
}

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error(
    "AI Wrangler: DATABASE_URL is required (Postgres). Local: postgres://localhost:5432/wrangler_dev — see web/README.md.",
  );
}

/** The role customer-scoped work runs as. It is not the owner, so RLS applies to it. */
export const TENANT_ROLE = "wrangler_tenant";

type Cache = { client?: postgres.Sql; db?: PostgresJsDatabase<typeof schema> };
const cache = globalThis as unknown as { __wrangler?: Cache };
cache.__wrangler ||= {};

export const client =
  cache.__wrangler.client ??
  postgres(url, {
    max: process.env.VERCEL ? 3 : 8,
    idle_timeout: 20,
    connect_timeout: 15,
    // Supabase's transaction pooler cannot do prepared statements.
    prepare: false,
  });

export const db = cache.__wrangler.db ?? drizzle(client, { schema });

if (process.env.NODE_ENV !== "production") {
  cache.__wrangler.client = client;
  cache.__wrangler.db = db;
}

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
