#!/usr/bin/env node
// Production entrypoint: bring the schema up to date, then serve.
// Lives next to the standalone server.js inside the image.
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

const migrate = spawnSync(process.execPath, [join(here, "migrate.mjs")], { stdio: "inherit" });
if (migrate.status !== 0) {
  console.error("migrations failed — refusing to start on a schema we do not understand");
  process.exit(migrate.status ?? 1);
}

process.env.HOSTNAME ||= "0.0.0.0";
process.env.PORT ||= "3000";
await import(join(here, "..", "server.js"));
