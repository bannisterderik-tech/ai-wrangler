#!/usr/bin/env node
// Builds the app, rebuilds a scratch Postgres, starts the server, runs the
// isolation suite against it, then puts everything away.
import { spawn, spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const web = join(here, "..");

const user = process.env.PGUSER || process.env.USER || "postgres";
const env = {
  ...process.env,
  NODE_ENV: "production",
  DATABASE_URL:
    process.env.TEST_DATABASE_URL || `postgres://${user}@localhost:5432/wrangler_test`,
  OPERATOR_PASSWORD: "test-operator-password",
  AUTH_SECRET: "test-auth-secret-not-for-production",
  TOKEN_ENCRYPTION_KEY: "0".repeat(64),
  OPERATOR_GITHUB_LOGINS: "",
  PORT: process.env.TEST_PORT || "3111",
  // A known webhook secret so the payment path can be exercised for real: the
  // conversion from lead to customer is the point of the whole feature, and
  // "it refuses a forged webhook" is only half of proving it.
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || "whsec_test_only_not_a_real_secret",
  // Set for the same reason as the Stripe one: "it refuses a forged webhook" is
  // only half a proof. Without a secret the route refuses everything, and a
  // suite that only ever sees refusals would pass with the verification gone.
  ZERNIO_WEBHOOK_SECRET: process.env.ZERNIO_WEBHOOK_SECRET || "zwh_test_only_not_a_real_secret",
  // Twilio signs its webhooks with the auth token. Without one the inbound
  // routes can only ever refuse, and a suite that only sees refusals passes
  // just as happily with the verification deleted. The SID is set alongside it
  // so twilioConfigured() is honest, but no request is ever made to Twilio.
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID || "ACtest0000000000000000000000000000",
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN || "test-twilio-auth-token",
};
const base = `http://localhost:${env.PORT}`;
env.TEST_BASE_URL = base;
// Every deploy has to set this, and the suite runs NODE_ENV=production, so it
// has to set it too. Without it the routes that build links leaving the server
// refuse outright rather than trusting the caller's Host header — which is the
// point, and which the suite should exercise rather than route around.
env.PUBLIC_ORIGIN = process.env.PUBLIC_ORIGIN || base;

step("resetting the test database", [join(here, "reset.mjs")]);
step("building", [join(web, "node_modules", "next", "dist", "bin", "next"), "build"]);

const server = spawn(
  process.execPath,
  [join(web, "node_modules", "next", "dist", "bin", "next"), "start", "-p", env.PORT],
  { cwd: web, env, stdio: ["ignore", "pipe", "pipe"] },
);
let serverLog = "";
server.stdout.on("data", (d) => (serverLog += d));
server.stderr.on("data", (d) => (serverLog += d));

let code = 1;
try {
  await waitForHealth();
  const run = spawnSync(process.execPath, ["--test", join(web, "tests", "*.test.mjs")], {
    cwd: web,
    env,
    stdio: "inherit",
  });
  code = run.status ?? 1;
} catch (err) {
  console.error(err.message);
  console.error(serverLog.slice(-2000));
} finally {
  server.kill("SIGTERM");
}
process.exit(code);

function step(label, args) {
  console.log(`\n— ${label}`);
  const run = spawnSync(process.execPath, args, { cwd: web, env, stdio: "inherit" });
  if (run.status !== 0) {
    console.error(`${label} failed`);
    process.exit(run.status ?? 1);
  }
}

async function waitForHealth() {
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(`${base}/api/health`);
      if (res.ok) {
        console.log(`\n— server up on ${base}\n`);
        return;
      }
    } catch {
      /* not yet */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`server never became healthy on ${base}`);
}
