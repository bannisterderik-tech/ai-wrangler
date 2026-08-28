import { db } from "./db";
import { sql } from "drizzle-orm";
import { getAgencyKey } from "./keys";
import { githubAppConfigured } from "./github-app";

/**
 * Ask every vendor whether we can actually talk to them.
 *
 * "The key is set" is not the same claim as "the key works", and the gap
 * between those two is where a deploy quietly does nothing. Everything here is
 * a real request to the real service, reporting the service's own answer —
 * never a guess, never an inference from an environment variable being present.
 *
 * Every check is chosen to be free and side-effect-free: read the account, list
 * the models, fetch the balance. Nothing here sends a message, places a call,
 * charges a card or writes to a repository.
 */

export type Check = {
  id: string;
  label: string;
  /** ok = proven working. off = not configured. fail = configured and broken. */
  state: "ok" | "off" | "fail";
  /** What the vendor said, or why it is off. Their words, not ours. */
  detail: string;
  /** What stops working while this is not ok. */
  costs: string;
};

async function timed(f: () => Promise<Check>, id: string, label: string, costs: string): Promise<Check> {
  try {
    return await f();
  } catch (e) {
    return { id, label, state: "fail", detail: (e as Error).message.slice(0, 240), costs };
  }
}

const ok = (id: string, label: string, detail: string, costs: string): Check => ({ id, label, state: "ok", detail, costs });
const off = (id: string, label: string, detail: string, costs: string): Check => ({ id, label, state: "off", detail, costs });

export async function selfTest(): Promise<Check[]> {
  const checks: Promise<Check>[] = [];

  checks.push(
    timed(
      async () => {
        const rows = await db.execute(sql`select count(*)::int as n from _wrangler_migrations`);
        const n = (rows as unknown as { n: number }[])[0]?.n ?? 0;
        return ok("database", "Postgres", `reachable, ${n} migrations applied`, "everything");
      },
      "database", "Postgres", "everything",
    ),
  );

  // Anthropic — list models. Free, and it proves the key and the account.
  checks.push(
    timed(
      async () => {
        const key = (await getAgencyKey("anthropic")) || process.env.ANTHROPIC_API_KEY;
        if (!key) return off("anthropic", "Anthropic", "no key saved", "every agent. Nothing can think.");
        const res = await fetch("https://api.anthropic.com/v1/models?limit=1", {
          headers: { "x-api-key": key, "anthropic-version": "2023-06-01" },
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body?.error?.message || `HTTP ${res.status}`);
        return ok("anthropic", "Anthropic", `key works — ${body?.data?.[0]?.id ?? "models readable"}`, "every agent");
      },
      "anthropic", "Anthropic", "every agent. Nothing can think.",
    ),
  );

  // Stripe — read the balance. Free, proves the key and tells us live vs test.
  checks.push(
    timed(
      async () => {
        const key = process.env.STRIPE_SECRET_KEY;
        if (!key) return off("stripe", "Stripe", "no key set", "deposits. A client can sign but not pay.");
        const res = await fetch("https://api.stripe.com/v1/balance", { headers: { Authorization: `Bearer ${key}` } });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body?.error?.message || `HTTP ${res.status}`);
        const mode = key.startsWith("sk_live") ? "LIVE" : "test";
        const hook = process.env.STRIPE_WEBHOOK_SECRET
          ? ""
          : " — but STRIPE_WEBHOOK_SECRET is missing, so a paid deposit will NOT create a customer";
        return {
          id: "stripe", label: "Stripe",
          state: process.env.STRIPE_WEBHOOK_SECRET ? "ok" : "fail",
          detail: `key works in ${mode} mode${hook}`,
          costs: "deposits, and the lead-to-customer conversion",
        };
      },
      "stripe", "Stripe", "deposits, and the lead-to-customer conversion",
    ),
  );

  // Twilio — read the account. Free, proves SID and token together.
  checks.push(
    timed(
      async () => {
        const sid = process.env.TWILIO_ACCOUNT_SID;
        const tok = process.env.TWILIO_AUTH_TOKEN;
        if (!sid || !tok) return off("twilio", "Twilio", "not configured", "calls and SMS");
        const auth = Buffer.from(`${sid}:${tok}`).toString("base64");
        const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}.json`, {
          headers: { Authorization: `Basic ${auth}` },
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body?.message || `HTTP ${res.status}`);
        const ring = await getAgencyKey("callback_number");
        return {
          id: "twilio", label: "Twilio",
          state: ring ? "ok" : "fail",
          detail: ring
            ? `${body.friendly_name ?? "account"} (${body.status}), bridging via ${ring}`
            : `${body.friendly_name ?? "account"} (${body.status}) — but no "Ring me on" number, so every call is refused`,
          costs: "calls and SMS",
        };
      },
      "twilio", "Twilio", "calls and SMS",
    ),
  );

  // GitHub App — mint an App JWT and read the app. Proves ID and private key.
  checks.push(
    timed(
      async () => {
        if (!githubAppConfigured()) {
          return off("github_app", "GitHub App", "not configured", "the agent pushing anything, ever");
        }
        const { installationFor } = await import("./github-app");
        // Reading our own app is the cheapest proof the JWT signs correctly.
        const { createSign } = await import("node:crypto");
        const b64 = (b: Buffer | string) =>
          Buffer.from(b).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
        const now = Math.floor(Date.now() / 1000);
        const head = b64(JSON.stringify({ alg: "RS256", typ: "JWT" }));
        const pay = b64(JSON.stringify({ iat: now - 60, exp: now + 540, iss: process.env.GITHUB_APP_ID }));
        const signer = createSign("RSA-SHA256");
        signer.update(`${head}.${pay}`);
        const jwt = `${head}.${pay}.${b64(signer.sign((process.env.GITHUB_APP_PRIVATE_KEY || "").replace(/\\n/g, "\n")))}`;
        const res = await fetch("https://api.github.com/app", {
          headers: { Authorization: `Bearer ${jwt}`, Accept: "application/vnd.github+json", "User-Agent": "ai-wrangler" },
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body?.message || `HTTP ${res.status}`);
        void installationFor;
        return ok(
          "github_app", "GitHub App",
          `signed in as "${body.name}" · installed on ${body.installations_count ?? "?"} account(s)`,
          "the agent pushing anything, ever",
        );
      },
      "github_app", "GitHub App", "the agent pushing anything, ever",
    ),
  );

  // Resend — list domains. Free, and tells us whether the from-domain verifies.
  checks.push(
    timed(
      async () => {
        const key = await getAgencyKey("resend");
        if (!key) return off("resend", "Resend", "no key saved", "magic-link sign in, and sending a proposal");
        const res = await fetch("https://api.resend.com/domains", { headers: { Authorization: `Bearer ${key}` } });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body?.message || `HTTP ${res.status}`);
        const from = (await getAgencyKey("mail_from")) || "";
        const domain = from.match(/@([^>\s]+)/)?.[1] ?? "";
        const list: { name: string; status: string }[] = body?.data ?? [];
        const match = list.find((d) => d.name === domain);
        if (domain && !match) {
          return {
            id: "resend", label: "Resend", state: "fail",
            detail: `key works, but "${domain}" is not a domain on this account — Resend will refuse every send`,
            costs: "magic-link sign in, and sending a proposal",
          };
        }
        return ok(
          "resend", "Resend",
          match ? `key works · ${match.name} is ${match.status}` : `key works · ${list.length} domain(s)`,
          "magic-link sign in, and sending a proposal",
        );
      },
      "resend", "Resend", "magic-link sign in, and sending a proposal",
    ),
  );

  return Promise.all(checks);
}
