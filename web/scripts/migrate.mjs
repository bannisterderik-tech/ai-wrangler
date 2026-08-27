#!/usr/bin/env node
// Applies web/drizzle/*.sql in order, once each. Works against local Postgres,
// Supabase, or any DATABASE_URL. No SQLite, no magic.
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

const here = dirname(fileURLToPath(import.meta.url));
const dir = join(here, "..", "drizzle");

loadEnvFile(join(here, "..", ".env.local"));

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is required. Local dev: postgres://localhost:5432/wrangler_dev");
  process.exit(1);
}

const sql = postgres(url, { max: 1, prepare: false, onnotice: () => {} });

try {
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS _wrangler_migrations (
      name text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  const done = new Set((await sql`SELECT name FROM _wrangler_migrations`).map((r) => r.name));
  const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
  let applied = 0;
  for (const file of files) {
    if (done.has(file)) {
      console.log(`· ${file} (already applied)`);
      continue;
    }
    process.stdout.write(`→ ${file} `);
    await sql.begin(async (tx) => {
      await tx.unsafe(readFileSync(join(dir, file), "utf8"));
      await tx`INSERT INTO _wrangler_migrations (name) VALUES (${file})`;
    });
    applied++;
    console.log("ok");
  }
  console.log(applied ? `applied ${applied} migration(s)` : "database already up to date");
} catch (err) {
  console.error("\nmigration failed:", err.message);
  process.exitCode = 1;
} finally {
  await sql.end();
}

function loadEnvFile(path) {
  try {
    for (const line of readFileSync(path, "utf8").split("\n")) {
      const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line);
      if (!m) continue;
      const value = m[2].trim().replace(/^["']|["']$/g, "");
      if (!(m[1] in process.env)) process.env[m[1]] = value;
    }
  } catch {
    /* no .env.local — env vars come from the environment */
  }
}
