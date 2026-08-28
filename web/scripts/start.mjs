#!/usr/bin/env node
// Production entrypoint: bring the schema up to date, then serve.
// Lives next to the standalone server.js inside the image.
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

// Fail with the fix, not with a stack trace. Without a database this container
// cannot migrate and will not serve, and "migrations failed" does not tell anyone
// which of the four settings is missing.
if (!process.env.DATABASE_URL) {
  console.error(
    [
      "AI Wrangler cannot start: DATABASE_URL is not set.",
      "",
      "On Railway: add a Postgres database to this project, then set",
      "  DATABASE_URL = ${{Postgres.DATABASE_URL}}",
      "on this service. You also need AUTH_SECRET and TOKEN_ENCRYPTION_KEY",
      "(openssl rand -hex 32, a different value for each).",
      "",
      "See DEPLOY.md.",
    ].join("\n"),
  );
  process.exit(1);
}

const missing = ["AUTH_SECRET", "TOKEN_ENCRYPTION_KEY"].filter((k) => !process.env[k]);
if (missing.length) {
  console.error(
    `AI Wrangler cannot start: ${missing.join(" and ")} not set. ` +
      "Generate each with: openssl rand -hex 32",
  );
  process.exit(1);
}

const migrate = spawnSync(process.execPath, [join(here, "migrate.mjs")], { stdio: "inherit" });
if (migrate.status !== 0) {
  console.error("migrations failed — refusing to start on a schema we do not understand");
  process.exit(migrate.status ?? 1);
}

process.env.HOSTNAME ||= "0.0.0.0";
process.env.PORT ||= "3000";
await import(join(here, "..", "server.js"));
