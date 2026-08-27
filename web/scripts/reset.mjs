#!/usr/bin/env node
// Drops and rebuilds the schema. Refuses to touch anything that is not obviously
// a local or test database unless you pass --force.
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";
import postgres from "postgres";

const here = dirname(fileURLToPath(import.meta.url));
loadEnvFile(join(here, "..", ".env.local"));

const url = process.env.DATABASE_URL;
const force = process.argv.includes("--force");
if (!url) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}
const local = /localhost|127\.0\.0\.1/.test(url);
const test = /wrangler_test|_test(\?|$)/.test(url);
if (!force && !(local || test)) {
  console.error(`refusing to reset ${redact(url)} — pass --force if you really mean it`);
  process.exit(1);
}

const sql = postgres(url, { max: 1, prepare: false, onnotice: () => {} });
try {
  await sql.unsafe(`
    DO $$
    DECLARE t record;
    BEGIN
      FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
        EXECUTE format('DROP TABLE IF EXISTS %I CASCADE', t.tablename);
      END LOOP;
    END
    $$;
  `);
  console.log(`dropped every table in ${redact(url)}`);
} finally {
  await sql.end();
}

execFileSync(process.execPath, [join(here, "migrate.mjs")], { stdio: "inherit", env: process.env });

function redact(u) {
  return u.replace(/\/\/([^@/]+)@/, "//***@");
}

function loadEnvFile(path) {
  try {
    for (const line of readFileSync(path, "utf8").split("\n")) {
      const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line);
      if (!m) continue;
      if (!(m[1] in process.env)) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
    }
  } catch {
    /* fine */
  }
}
