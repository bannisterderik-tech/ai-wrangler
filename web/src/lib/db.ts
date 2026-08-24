import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import * as schema from "./schema";
import { seedIfEmpty } from "./seed";

if (process.env.VERCEL && !process.env.DATABASE_URL) {
  throw new Error(
    "AI Wrangler: SQLite cannot run on Vercel. Set DATABASE_URL to Postgres before deploying. See HANDOFF.md.",
  );
}

const file = process.env.DATABASE_PATH || join(process.cwd(), "..", "data", "wrangler.db");
mkdirSync(dirname(file), { recursive: true });

const sqlite = new Database(file);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

sqlite.exec(`
CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS connections (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL REFERENCES customers(id),
  provider TEXT NOT NULL,
  mode TEXT NOT NULL,
  encrypted_access TEXT NOT NULL,
  encrypted_refresh TEXT,
  team_id TEXT,
  team_name TEXT,
  installation_id TEXT,
  user_json TEXT,
  token_prefix TEXT,
  connected_at INTEGER NOT NULL,
  expires_at INTEGER
);
CREATE UNIQUE INDEX IF NOT EXISTS conn_customer_provider ON connections(customer_id, provider);
CREATE TABLE IF NOT EXISTS bound_resources (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL REFERENCES customers(id),
  provider TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  name TEXT NOT NULL,
  meta_json TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS bound_unique ON bound_resources(customer_id, provider, resource_id);
CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL REFERENCES customers(id),
  title TEXT NOT NULL,
  status TEXT NOT NULL,
  harness TEXT NOT NULL DEFAULT 'claude-code-mcp',
  spent_cents INTEGER NOT NULL DEFAULT 0,
  budget_cents INTEGER NOT NULL DEFAULT 1000,
  transcript_json TEXT,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS approvals (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL REFERENCES customers(id),
  job_id TEXT REFERENCES jobs(id),
  title TEXT NOT NULL,
  why TEXT,
  payload TEXT,
  irreversible INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS audit (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id TEXT,
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  target TEXT,
  at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS memories (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL REFERENCES customers(id),
  text TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS inbox (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL REFERENCES customers(id),
  from_name TEXT NOT NULL,
  via TEXT NOT NULL,
  at TEXT NOT NULL,
  text TEXT NOT NULL,
  task TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new'
);
CREATE TABLE IF NOT EXISTS changes (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL REFERENCES customers(id),
  title TEXT NOT NULL,
  repo TEXT,
  branch TEXT,
  files INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL,
  diff TEXT,
  expl TEXT,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS orch_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id TEXT,
  tag TEXT NOT NULL,
  text TEXT NOT NULL,
  at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS deals (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  value TEXT NOT NULL,
  note TEXT,
  stage INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS agency_connections (
  provider TEXT PRIMARY KEY,
  mode TEXT NOT NULL,
  encrypted_access TEXT NOT NULL,
  login TEXT,
  org TEXT,
  user_json TEXT,
  connected_at INTEGER NOT NULL
);
`);

function col(table: string, name: string, def: string) {
  try {
    sqlite.exec(`ALTER TABLE ${table} ADD COLUMN ${name} ${def}`);
  } catch {
    /* already exists */
  }
}
col("customers", "profile_json", "TEXT");
col("jobs", "tier", "TEXT DEFAULT 'Medium brain'");
col("jobs", "cache", "INTEGER DEFAULT 60");

export const db = drizzle(sqlite, { schema });
seedIfEmpty(db);
export { schema };
