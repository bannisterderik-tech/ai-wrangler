// Isolation is the product. These tests are the receipt.
//
// Run with: npm test   (scripts/test.mjs builds, migrates a scratch DB, starts the app)
import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";
import postgres from "postgres";

const BASE = process.env.TEST_BASE_URL || "http://localhost:3111";
const DB = process.env.DATABASE_URL;
const PASSWORD = process.env.OPERATOR_PASSWORD;

const sql = postgres(DB, { max: 2, prepare: false, onnotice: () => {} });
let cookie = "";

async function api(path, init = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    redirect: "manual",
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { cookie } : {}),
      ...(init.headers || {}),
    },
  });
  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }
  return { status: res.status, body, res };
}

before(async () => {
  await sql`DELETE FROM bound_resources WHERE customer_id IN ('acme','globex')`;
  await sql`DELETE FROM jobs WHERE customer_id IN ('acme','globex')`;
  await sql`DELETE FROM memories WHERE customer_id IN ('acme','globex')`;
  await sql`DELETE FROM customers WHERE id IN ('acme','globex')`;
  await sql`INSERT INTO customers (id, name) VALUES ('acme','Acme'), ('globex','Globex')`;
  await sql`
    INSERT INTO bound_resources (id, customer_id, provider, resource_id, name) VALUES
      ('b1','acme','github','agency/acme-site','agency/acme-site'),
      ('b2','acme','vercel','prj_acme','acme-site'),
      ('b3','globex','github','agency/globex-shop','agency/globex-shop')`;
  await sql`
    INSERT INTO memories (id, customer_id, text) VALUES
      ('mem-acme','acme','Acme ships on Thursdays.'),
      ('mem-globex','globex','Globex never deploys in December.')`;
});

after(async () => {
  await sql.end();
});

describe("the door is locked", () => {
  test("an API call with no session is refused", async () => {
    const { status } = await api("/api/customers");
    assert.equal(status, 401);
  });

  test("a page request with no session goes to the login screen", async () => {
    const res = await fetch(`${BASE}/customers`, { redirect: "manual" });
    assert.equal(res.status, 307);
    assert.match(res.headers.get("location") || "", /\/login/);
  });

  test("health is public — it says nothing about customers", async () => {
    const { status, body } = await api("/api/health");
    assert.equal(status, 200);
    assert.equal(body.login.configured, true);
    assert.equal(body.customers, undefined);
  });

  test("the wrong password does not get in", async () => {
    const { status } = await api("/api/auth/operator/password", {
      method: "POST",
      body: JSON.stringify({ password: "hunter2" }),
    });
    assert.equal(status, 401);
  });

  test("the right password gets a session", async () => {
    const { status, res } = await api("/api/auth/operator/password", {
      method: "POST",
      body: JSON.stringify({ password: PASSWORD }),
    });
    assert.equal(status, 200);
    const setCookie = res.headers.get("set-cookie") || "";
    assert.match(setCookie, /wrangler_session=/);
    cookie = setCookie.split(";")[0];
    const me = await api("/api/auth/me");
    assert.equal(me.status, 200);
    assert.equal(me.body.signedIn, true);
  });
});

describe("one customer cannot touch another customer's things", () => {
  test("a job for Globex may not name Acme's repo", async () => {
    const { status, body } = await api("/api/jobs", {
      method: "POST",
      body: JSON.stringify({
        customerId: "globex",
        title: "sneak into acme",
        repo: "agency/acme-site",
      }),
    });
    assert.equal(status, 403);
    assert.match(body.error, /not bound to customer globex/);
  });

  test("a job for Globex may not name Acme's Vercel project", async () => {
    const { status, body } = await api("/api/jobs", {
      method: "POST",
      body: JSON.stringify({
        customerId: "globex",
        title: "deploy into acme",
        vercelProjectId: "prj_acme",
      }),
    });
    assert.equal(status, 403);
    assert.match(body.error, /not bound to customer globex/);
  });

  test("a job for Acme on Acme's own repo is fine", async () => {
    const { status, body } = await api("/api/jobs", {
      method: "POST",
      body: JSON.stringify({
        customerId: "acme",
        title: "add a contact form",
        repo: "agency/acme-site",
      }),
    });
    assert.equal(status, 200);
    assert.equal(body.customerId, "acme");
  });

  test("a resource nobody bound is refused, not silently allowed", async () => {
    const { status, body } = await api("/api/jobs", {
      method: "POST",
      body: JSON.stringify({
        customerId: "globex",
        title: "touch a vercel project we never bound",
        vercelProjectId: "prj_ghost",
      }),
    });
    assert.equal(status, 409);
    assert.match(body.error, /bind one before a job can touch it/);
  });

  test("customer-scoped reads return one customer's rows only", async () => {
    const { status, body } = await api("/api/memories?customerId=acme");
    assert.equal(status, 200);
    const ids = body.memories.map((m) => m.id);
    assert.deepEqual(ids, ["mem-acme"]);
  });
});

describe("Postgres enforces it too, not just our route handlers", () => {
  test("the tenant role sees only the customer it is pinned to", async () => {
    const seen = await sql.begin(async (tx) => {
      await tx`select set_config('app.customer_id', 'acme', true)`;
      await tx.unsafe("set local role wrangler_tenant");
      const memories = await tx`select id from memories`;
      const bound = await tx`select resource_id from bound_resources`;
      const customers = await tx`select id from customers`;
      return {
        memories: memories.map((r) => r.id),
        bound: bound.map((r) => r.resource_id),
        customers: customers.map((r) => r.id),
      };
    });
    assert.deepEqual(seen.memories, ["mem-acme"]);
    assert.ok(seen.bound.includes("agency/acme-site"));
    assert.ok(!seen.bound.includes("agency/globex-shop"));
    assert.deepEqual(seen.customers, ["acme"]);
  });

  test("the tenant role cannot write a row for another customer", async () => {
    await assert.rejects(
      sql.begin(async (tx) => {
        await tx`select set_config('app.customer_id', 'acme', true)`;
        await tx.unsafe("set local role wrangler_tenant");
        await tx`INSERT INTO memories (id, customer_id, text) VALUES ('bad','globex','stolen')`;
      }),
      /row-level security/i,
    );
    const [row] = await sql`SELECT count(*)::int AS n FROM memories WHERE id = 'bad'`;
    assert.equal(row.n, 0);
  });

  test("the tenant role cannot read the agency's own credentials table", async () => {
    await assert.rejects(
      sql.begin(async (tx) => {
        await tx`select set_config('app.customer_id', 'acme', true)`;
        await tx.unsafe("set local role wrangler_tenant");
        await tx`select * from agency_connections`;
      }),
      /permission denied/i,
    );
  });

  test("a repo cannot be bound to two customers, even by a direct write", async () => {
    await assert.rejects(
      sql`INSERT INTO bound_resources (id, customer_id, provider, resource_id, name)
          VALUES ('b4','globex','github','agency/acme-site','agency/acme-site')`,
      /duplicate key|unique/i,
    );
  });
});

/**
 * Wall five: a teammate's Claude Code. The MCP session is a human holding a token,
 * and it gets exactly the same refusals an agent gets — scope, grants, and main.
 */
describe("a session over MCP cannot reach past its scope", () => {
  let token = "";

  async function mcp(method, params, auth = token) {
    const res = await fetch(`${BASE}/api/mcp`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(auth ? { Authorization: `Bearer ${auth}` } : {}) },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    });
    return { status: res.status, body: await res.json().catch(() => null) };
  }
  const call = async (name, args = {}) => {
    const { body } = await mcp("tools/call", { name, arguments: args });
    return { text: body?.result?.content?.[0]?.text ?? "", isError: body?.result?.isError === true };
  };

  before(async () => {
    await sql`DELETE FROM job_steps WHERE customer_id IN ('acme','globex')`;
    await sql`DELETE FROM approvals WHERE customer_id IN ('acme','globex')`;
    await sql`DELETE FROM jobs WHERE customer_id IN ('acme','globex')`;
    await sql`DELETE FROM people WHERE id = 'test-session'`;
    await sql`
      INSERT INTO jobs (id, customer_id, title, status, repo, budget_cents)
      VALUES ('job-acme','acme','Acme rebuild','queued','agency/acme-site',2000),
             ('job-globex','globex','Globex rebuild','queued','agency/globex-shop',2000)`;
    await sql`INSERT INTO people (id, name, handle, status) VALUES ('test-session','Test Session','tester','invited')`;
    await sql`INSERT INTO person_scopes (person_id, customer_id) VALUES ('test-session','acme')`;
    await sql`
      INSERT INTO person_tools (person_id, tool) VALUES
        ('test-session','list_jobs'), ('test-session','claim_job'),
        ('test-session','read_bound_repo'), ('test-session','open_branch'), ('test-session','post_step')`;

    const minted = await api("/api/people/test-session", {
      method: "POST",
      body: JSON.stringify({ action: "token" }),
    });
    token = minted.body.token;
  });

  test("no token is refused, and the token is never stored in the clear", async () => {
    const { status } = await mcp("initialize", {}, "");
    assert.equal(status, 401);
    const [row] = await sql`SELECT token_hash, token_prefix FROM people WHERE id = 'test-session'`;
    assert.ok(row.token_hash && row.token_hash.length === 64, "token is stored as a sha256 digest");
    assert.ok(!row.token_hash.includes(token), "the plaintext token is not in the row");
    assert.ok(token.startsWith(row.token_prefix), "the prefix is only a display hint");
  });

  test("a made-up token is refused", async () => {
    const { status } = await mcp("initialize", {}, "wr_sess_not_a_real_token");
    assert.equal(status, 401);
  });

  test("tools/list returns only the tools this session was granted", async () => {
    const { body } = await mcp("tools/list", {});
    const names = body.result.tools.map((t) => t.name);
    assert.ok(names.includes("claim_job"));
    assert.ok(!names.includes("release_job"), "release_job was never granted");
    assert.ok(!names.includes("request_approval"), "request_approval was never granted");
  });

  test("list_jobs shows only scoped customers", async () => {
    const { text } = await call("list_jobs");
    assert.match(text, /job-acme/);
    assert.doesNotMatch(text, /job-globex/, "Globex is not in this session's scope");
  });

  test("a job outside the scope is refused, and the refusal does not confirm it exists", async () => {
    const { text, isError } = await call("claim_job", { job_id: "job-globex" });
    assert.ok(isError);
    assert.match(text, /not on this session's floor/);
    assert.doesNotMatch(text, /Globex rebuild/, "the refusal leaks nothing about the other customer");
  });

  test("an ungranted tool is refused even though the job is in scope", async () => {
    const { text, isError } = await call("release_job", { job_id: "job-acme" });
    assert.ok(isError);
    assert.match(text, /was not granted/);
  });

  test("writing requires holding the job", async () => {
    const before = await call("post_step", { job_id: "job-acme", kind: "think", text: "before claiming" });
    assert.ok(before.isError);
    assert.match(before.text, /claim job/);

    const claimed = await call("claim_job", { job_id: "job-acme" });
    assert.ok(!claimed.isError, claimed.text);

    const after = await call("post_step", { job_id: "job-acme", kind: "think", text: "after claiming" });
    assert.ok(!after.isError, after.text);
  });

  test("agents do not write to main", async () => {
    for (const branch of ["main", "master", "production"]) {
      const { text, isError } = await call("open_branch", { job_id: "job-acme", branch, summary: "nope" });
      assert.ok(isError, `${branch} should be refused`);
      assert.match(text, /do not write to main/);
    }
  });

  test("a branch on the customer's own bound repo is fine", async () => {
    const { text, isError } = await call("open_branch", {
      job_id: "job-acme",
      branch: "agent/rebuild",
      summary: "route template",
    });
    assert.ok(!isError, text);
    const [row] = await sql`SELECT status FROM changes WHERE repo = 'agency/acme-site' AND branch = 'agent/rebuild'`;
    assert.equal(row.status, "preview", "it lands as a preview, never as live");
  });

  test("revoking a session kills the token and drops what it was holding", async () => {
    const res = await api("/api/people/test-session", {
      method: "POST",
      body: JSON.stringify({ action: "revoke" }),
    });
    assert.equal(res.status, 200);
    const { status } = await mcp("initialize", {});
    assert.equal(status, 401, "the token stops working immediately");
    const [job] = await sql`SELECT owner_id FROM jobs WHERE id = 'job-acme'`;
    assert.equal(job.owner_id, null, "its claimed work went back on the board");
  });
});

/**
 * The door, by email. A magic link is a credential sitting in a mailbox, so it
 * has to be single use, short lived, and only ever issued to an operator.
 */
describe("magic-link sign in", () => {
  const ADMIN = "derik@aiwrangler.co";
  const STRANGER = "someone@example.com";

  async function ask(email) {
    const res = await fetch(`${BASE}/api/auth/magic/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    return { status: res.status, body: await res.json().catch(() => ({})) };
  }
  /** The link is only ever in the email; the test reads the row it was minted from. */
  async function latestTokenHash(email) {
    const [row] = await sql`
      SELECT token_hash FROM login_links WHERE email = ${email} ORDER BY created_at DESC LIMIT 1`;
    return row?.token_hash ?? null;
  }
  before(async () => {
    await sql`DELETE FROM login_links`;
  });

  test("a stranger gets the same answer an operator does", async () => {
    const mine = await ask(ADMIN);
    const theirs = await ask(STRANGER);
    assert.equal(mine.status, 200);
    assert.equal(theirs.status, 200);
    // Byte-for-byte, not just the same message: an extra field on one of them is
    // enough to tell an attacker which addresses are admins.
    assert.deepEqual(theirs.body, mine.body, "the responses must be indistinguishable");
    assert.equal(JSON.stringify(theirs.body), JSON.stringify(mine.body));
  });

  test("but no link is minted for a stranger", async () => {
    assert.equal(await latestTokenHash(STRANGER), null);
    assert.ok(await latestTokenHash(ADMIN), "the operator did get one");
  });

  test("the refusal is still recorded, so guessing is visible", async () => {
    const [row] = await sql`
      SELECT action FROM audit WHERE actor = ${STRANGER} ORDER BY at DESC LIMIT 1`;
    assert.match(row.action, /not an operator/);
  });

  test("the token is stored as a digest, never in the clear", async () => {
    const hash = await latestTokenHash(ADMIN);
    assert.match(hash, /^[0-9a-f]{64}$/);
    const [row] = await sql`SELECT * FROM login_links WHERE token_hash = ${hash}`;
    assert.ok(!Object.values(row).some((v) => typeof v === "string" && v.startsWith("wr_sess_")));
  });

  test("a made-up token is refused and sets no cookie", async () => {
    const res = await fetch(`${BASE}/api/auth/magic/callback?token=not-a-real-token`, { redirect: "manual" });
    assert.equal(res.status, 307);
    assert.match(res.headers.get("location"), /\/login\?error=/);
    assert.ok(!(res.headers.get("set-cookie") || "").includes("wrangler_session"));
  });

  test("a link works exactly once", async () => {
    // Mint one directly so the test holds the plaintext, the way the mailbox would.
    const raw = "wr_sess_test_single_use_token";
    const { createHash } = await import("node:crypto");
    const hash = createHash("sha256").update(raw).digest("hex");
    await sql`
      INSERT INTO login_links (token_hash, email, expires_at)
      VALUES (${hash}, ${ADMIN}, now() + interval '15 minutes')`;

    const first = await fetch(`${BASE}/api/auth/magic/callback?token=${raw}`, { redirect: "manual" });
    assert.equal(first.status, 307);
    assert.ok((first.headers.get("set-cookie") || "").includes("wrangler_session"), "first click signs in");

    const second = await fetch(`${BASE}/api/auth/magic/callback?token=${raw}`, { redirect: "manual" });
    assert.match(decodeURIComponent(second.headers.get("location")), /already used/);
    assert.ok(!(second.headers.get("set-cookie") || "").includes("wrangler_session"), "second click does not");
  });

  test("an expired link is refused even though it was never used", async () => {
    const raw = "wr_sess_test_expired_token";
    const { createHash } = await import("node:crypto");
    const hash = createHash("sha256").update(raw).digest("hex");
    await sql`
      INSERT INTO login_links (token_hash, email, expires_at)
      VALUES (${hash}, ${ADMIN}, now() - interval '1 minute')`;
    const res = await fetch(`${BASE}/api/auth/magic/callback?token=${raw}`, { redirect: "manual" });
    assert.match(decodeURIComponent(res.headers.get("location")), /expired/);
    assert.ok(!(res.headers.get("set-cookie") || "").includes("wrangler_session"));
  });

  test("the session a link mints actually opens the door", async () => {
    const raw = "wr_sess_test_working_token";
    const { createHash } = await import("node:crypto");
    const hash = createHash("sha256").update(raw).digest("hex");
    await sql`
      INSERT INTO login_links (token_hash, email, expires_at)
      VALUES (${hash}, ${ADMIN}, now() + interval '15 minutes')`;
    const res = await fetch(`${BASE}/api/auth/magic/callback?token=${raw}`, { redirect: "manual" });
    const setCookie = res.headers.get("set-cookie") || "";
    const value = /wrangler_session=([^;]+)/.exec(setCookie)?.[1];
    assert.ok(value, "a session cookie was set");
    const me = await fetch(`${BASE}/api/auth/me`, { headers: { cookie: `wrangler_session=${value}` } });
    assert.equal(me.status, 200);
    const body = await me.json();
    assert.equal(body.session?.sub ?? body.sub, ADMIN);
  });
});

/**
 * Intake and context. An agent that can open its own work off a customer's error
 * feed is only safe if the feed itself is walled — the ingest key routes, and
 * routes nothing else.
 */
describe("intake is walled the same as everything else", () => {
  let token = "";
  let acmeKey = "";
  let globexKey = "";

  async function call(name, args = {}) {
    const res = await fetch(`${BASE}/api/mcp`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name, arguments: args } }),
    });
    const body = await res.json();
    return { text: body?.result?.content?.[0]?.text ?? "", isError: body?.result?.isError === true };
  }
  const post = (path, key, payload) =>
    fetch(`${BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(key ? { "x-wrangler-key": key } : {}) },
      body: JSON.stringify(payload),
    });

  before(async () => {
    const { createHash } = await import("node:crypto");
    const hash = (v) => createHash("sha256").update(v).digest("hex");
    acmeKey = "wr_ingest_acme_test";
    globexKey = "wr_ingest_globex_test";
    await sql`UPDATE customers SET ingest_key_hash = ${hash(acmeKey)} WHERE id = 'acme'`;
    await sql`UPDATE customers SET ingest_key_hash = ${hash(globexKey)} WHERE id = 'globex'`;
    await sql`DELETE FROM site_errors WHERE customer_id IN ('acme','globex')`;
    await sql`DELETE FROM client_requests WHERE customer_id IN ('acme','globex')`;
    await sql`DELETE FROM memories WHERE customer_id = 'acme' AND text LIKE 'Never ship%'`;
    await sql`INSERT INTO memories (id, customer_id, text) VALUES ('mem-rule','acme','Never ship on a Friday.')`;
    await sql`DELETE FROM jobs WHERE id IN ('job-acme','job-globex')`;
    await sql`
      INSERT INTO jobs (id, customer_id, title, status, repo, budget_cents)
      VALUES ('job-acme','acme','Acme rebuild','queued','agency/acme-site',2000),
             ('job-globex','globex','Globex rebuild','queued','agency/globex-shop',2000)`;
    await sql`DELETE FROM people WHERE id = 'intake-session'`;
    await sql`INSERT INTO people (id, name, handle, status) VALUES ('intake-session','Intake','intake','invited')`;
    await sql`INSERT INTO person_scopes (person_id, customer_id) VALUES ('intake-session','acme')`;
    await sql`
      INSERT INTO person_tools (person_id, tool) VALUES
        ('intake-session','list_jobs'), ('intake-session','claim_job'),
        ('intake-session','read_project'), ('intake-session','next_work'), ('intake-session','open_work')`;
    const minted = await api("/api/people/intake-session", {
      method: "POST",
      body: JSON.stringify({ action: "token" }),
    });
    token = minted.body.token;
  });

  test("an error with no key, or a wrong key, is refused", async () => {
    assert.equal((await post("/api/ingest/error", "", { message: "boom" })).status, 401);
    assert.equal((await post("/api/ingest/error", "not-a-key", { message: "boom" })).status, 401);
  });

  test("the key routes the error to its own customer and nowhere else", async () => {
    assert.equal((await post("/api/ingest/error", acmeKey, { message: "TypeError on /quote", url: "/quote" })).status, 202);
    assert.equal((await post("/api/ingest/error", globexKey, { message: "Globex checkout broke", url: "/cart" })).status, 202);
    const rows = await sql`SELECT customer_id, message FROM site_errors ORDER BY customer_id`;
    assert.equal(rows.length, 2);
    assert.equal(rows.find((r) => r.message.includes("quote")).customer_id, "acme");
    assert.equal(rows.find((r) => r.message.includes("Globex")).customer_id, "globex");
  });

  test("the same failure twice is one row with a count", async () => {
    await post("/api/ingest/error", acmeKey, { message: "TypeError on /quote at line 41", url: "/quote" });
    await post("/api/ingest/error", acmeKey, { message: "TypeError on /quote at line 77", url: "/quote" });
    const [row] = await sql`
      SELECT count FROM site_errors WHERE customer_id = 'acme' AND message LIKE '%quote%' ORDER BY count DESC LIMIT 1`;
    assert.ok(row.count >= 2, `line numbers vary, the failure does not — got count ${row.count}`);
  });

  test("read_project hands over one customer's world and no one else's", async () => {
    await call("claim_job", { job_id: "job-acme" });
    const { text, isError } = await call("read_project", { job_id: "job-acme" });
    assert.ok(!isError, text);
    assert.match(text, /agency\/acme-site/);
    assert.match(text, /Never ship on a Friday/);
    assert.match(text, /TypeError on \/quote/);
    assert.doesNotMatch(text, /globex/i, "another customer must not appear in this context");
  });

  test("next_work only shows this customer's intake", async () => {
    await post("/api/ingest/request", acmeKey, { body: "Can you add a booking page", email: "maya@acme.test" });
    await post("/api/ingest/request", globexKey, { body: "Globex wants a dark mode" });
    const { text } = await call("next_work", { job_id: "job-acme" });
    assert.match(text, /booking page/);
    assert.doesNotMatch(text, /dark mode/, "Globex's intake is not on this floor");
  });

  test("open_work promotes an item into a real, budgeted, owned job", async () => {
    const [item] = await sql`SELECT id FROM client_requests WHERE customer_id = 'acme' LIMIT 1`;
    const { text, isError } = await call("open_work", {
      job_id: "job-acme",
      item_id: item.id,
      title: "Add a booking page",
      budget_dollars: 15,
    });
    assert.ok(!isError, text);
    const [req] = await sql`SELECT status, job_id FROM client_requests WHERE id = ${item.id}`;
    assert.equal(req.status, "jobbed");
    const [job] = await sql`SELECT owner_id, budget_cents, customer_id FROM jobs WHERE id = ${req.job_id}`;
    assert.equal(job.owner_id, "intake-session");
    assert.equal(job.budget_cents, 1500);
    assert.equal(job.customer_id, "acme");
  });

  test("an intake item from another customer cannot be promoted, even with a valid job id", async () => {
    const [theirs] = await sql`SELECT id FROM client_requests WHERE customer_id = 'globex' LIMIT 1`;
    const { text, isError } = await call("open_work", {
      job_id: "job-acme",
      item_id: theirs.id,
      title: "sneaking in",
    });
    assert.ok(isError);
    assert.match(text, /belongs to another customer/);
    const [row] = await sql`SELECT status FROM client_requests WHERE id = ${theirs.id}`;
    assert.equal(row.status, "new", "and it stays untouched");
  });
});

/**
 * Two audiences, one OS. A client user is the first login that must NOT see
 * everything, so this is where wall three stops being a proof and starts being
 * the product.
 */
describe("a client sees their own CRM and nothing else", () => {
  let acmeCookie = "";
  let globexCookie = "";

  let minted = 0;
  async function signInAs(email) {
    // A fresh token every call — the links are single use, so reusing one here
    // would be testing the burn, not the landing.
    const raw = `wr_sess_test_client_${email.replace(/\W/g, "")}_${++minted}`;
    const { createHash } = await import("node:crypto");
    const hash = createHash("sha256").update(raw).digest("hex");
    await sql`
      INSERT INTO login_links (token_hash, email, expires_at)
      VALUES (${hash}, ${email}, now() + interval '15 minutes')`;
    const res = await fetch(`${BASE}/api/auth/magic/callback?token=${raw}`, { redirect: "manual" });
    const value = /wrangler_session=([^;]+)/.exec(res.headers.get("set-cookie") || "")?.[1];
    return { cookie: value ? `wrangler_session=${value}` : "", location: res.headers.get("location") };
  }
  const as = (cookie, path, init = {}) =>
    fetch(`${BASE}${path}`, { ...init, redirect: "manual", headers: { "Content-Type": "application/json", cookie, ...(init.headers || {}) } });

  before(async () => {
    await sql`DELETE FROM lead_events WHERE customer_id IN ('acme','globex')`;
    await sql`DELETE FROM leads WHERE customer_id IN ('acme','globex')`;
    await sql`DELETE FROM people WHERE kind = 'client'`;
    await sql`
      INSERT INTO people (id, name, handle, email, kind, customer_id) VALUES
        ('p-acme','Maya at Acme','maya','maya@acme.test','client','acme'),
        ('p-globex','Dev at Globex','dev','dev@globex.test','client','globex')`;
    await sql`
      INSERT INTO leads (id, customer_id, name, phone, stage, value_cents) VALUES
        ('lead-acme','acme','Homeowner on Oak St','+15305550111','new',450000),
        ('lead-globex','globex','Somebody who called Globex','+15305550222','new',380000)`;

    acmeCookie = (await signInAs("maya@acme.test")).cookie;
    globexCookie = (await signInAs("dev@globex.test")).cookie;
  });

  test("a client user can sign in with a magic link", async () => {
    assert.ok(acmeCookie, "Maya got a session");
    assert.ok(globexCookie, "Dev got a session");
  });

  test("and lands on their own side of the house", async () => {
    const { location } = await signInAs("maya@acme.test");
    assert.match(location, /\/client$/);
  });

  test("they see their own leads", async () => {
    const res = await as(acmeCookie, "/api/client/leads");
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.leads.length, 1);
    assert.equal(body.leads[0].name, "Homeowner on Oak St");
  });

  test("and cannot see anyone else's, because RLS will not return them", async () => {
    const mine = await (await as(acmeCookie, "/api/client/leads")).json();
    const theirs = await (await as(globexCookie, "/api/client/leads")).json();
    assert.equal(mine.leads.length, 1);
    assert.equal(theirs.leads.length, 1);
    assert.notEqual(mine.leads[0].id, theirs.leads[0].id);
    assert.ok(!JSON.stringify(mine).includes("Globex"), "no trace of the other customer");
  });

  test("logging a call against another customer's lead is a 404, not a write", async () => {
    const res = await as(acmeCookie, "/api/client/leads", {
      method: "POST",
      body: JSON.stringify({ leadId: "lead-globex", kind: "call", body: "sneaking in" }),
    });
    assert.equal(res.status, 404, "inside their transaction that lead does not exist");
    const [row] = await sql`SELECT count(*)::int AS n FROM lead_events WHERE lead_id = 'lead-globex'`;
    assert.equal(row.n, 0, "and nothing was written");
  });

  test("logging one against their own lead works", async () => {
    const res = await as(acmeCookie, "/api/client/leads", {
      method: "POST",
      body: JSON.stringify({ leadId: "lead-acme", kind: "call", body: "called back in 40s" }),
    });
    assert.equal(res.status, 200);
    const [row] = await sql`SELECT actor, kind FROM lead_events WHERE lead_id = 'lead-acme'`;
    assert.equal(row.kind, "call");
    assert.equal(row.actor, "Maya at Acme");
  });

  test("the agency side is closed to them — pages redirect, APIs 403", async () => {
    const page = await as(acmeCookie, "/customers");
    assert.equal(page.status, 307);
    assert.match(page.headers.get("location"), /\/client$/);

    for (const path of ["/api/floor", "/api/people", "/api/customers", "/api/jobs"]) {
      const res = await as(acmeCookie, path);
      assert.equal(res.status, 403, `${path} must be closed to a client`);
    }
  });

  test("an operator cannot masquerade on a client screen either", async () => {
    const res = await api("/api/auth/operator/password", {
      method: "POST",
      body: JSON.stringify({ password: PASSWORD }),
    });
    assert.equal(res.status, 200);
    const opCookie = /wrangler_session=([^;]+)/.exec(res.res.headers.get("set-cookie") || "")?.[1];
    const page = await as(`wrangler_session=${opCookie}`, "/client");
    assert.equal(page.status, 307, "operators get sent to the agency view");
  });

  test("a stranger with no session gets nothing from the client API", async () => {
    const res = await fetch(`${BASE}/api/client/leads`, { redirect: "manual" });
    assert.equal(res.status, 401);
  });
});

/**
 * An agent is not a teammate. A teammate works across the customers you scope
 * them to; an agent is per project, and its scope is a column rather than a list
 * somebody maintains — there is no second customer to grant it and no toggle to
 * forget.
 */
describe("an agent belongs to exactly one project", () => {
  before(async () => {
    await sql`DELETE FROM people WHERE id IN ('A_test-agent','U_test-mate')`;
  });

  test("creating one without a project is refused", async () => {
    const res = await api("/api/people", {
      method: "POST",
      body: JSON.stringify({ name: "test-agent", kind: "agent" }),
    });
    assert.equal(res.status, 400);
    assert.match(res.body.error, /belongs to one customer/);
  });

  test("the database refuses it too, not just the route", async () => {
    await assert.rejects(
      () => sql`INSERT INTO people (id, name, handle, kind) VALUES ('A_bare','Bare','bare','agent')`,
      /people_kind_scope/,
    );
  });

  test("its scope is its project, without anything in person_scopes", async () => {
    const made = await api("/api/people", {
      method: "POST",
      body: JSON.stringify({ name: "test-agent", kind: "agent", customerId: "acme" }),
    });
    assert.equal(made.status, 200);
    const [rows] = await sql`SELECT count(*)::int AS n FROM person_scopes WHERE person_id = 'A_test-agent'`;
    assert.equal(rows.n, 0, "nothing maintains a list for it");

    const minted = await api("/api/people/A_test-agent", {
      method: "POST",
      body: JSON.stringify({ action: "token" }),
    });
    const res = await fetch(`${BASE}/api/mcp`, { headers: { Authorization: `Bearer ${minted.body.token}` } });
    const seen = await res.json();
    assert.deepEqual(seen.scope, ["acme"], "one customer, from the column");
  });

  test("and that scope cannot be widened", async () => {
    const res = await api("/api/people/A_test-agent", {
      method: "POST",
      body: JSON.stringify({ action: "scope", customerId: "globex" }),
    });
    assert.equal(res.status, 400);
    assert.match(res.body.error, /cannot be widened/);
    const [rows] = await sql`SELECT count(*)::int AS n FROM person_scopes WHERE person_id = 'A_test-agent'`;
    assert.equal(rows.n, 0);
  });

  test("a teammate still gets a list, because that is what a teammate is", async () => {
    await api("/api/people", { method: "POST", body: JSON.stringify({ name: "test mate" }) });
    const res = await api("/api/people/U_test-mate", {
      method: "POST",
      body: JSON.stringify({ action: "scope", customerId: "acme" }),
    });
    assert.equal(res.status, 200);
    const [rows] = await sql`SELECT count(*)::int AS n FROM person_scopes WHERE person_id = 'U_test-mate'`;
    assert.equal(rows.n, 1);
  });
});

/**
 * Minting an agent's token should deploy it. When Railway is not connected that
 * has to degrade into a clear sentence, not a 500 — the token is still valid and
 * the agent can still be run by hand.
 */
describe("agents deploy themselves, and say so when they cannot", () => {
  before(async () => {
    await sql`DELETE FROM agency_connections WHERE provider = 'railway'`;
    await sql`DELETE FROM people WHERE id = 'A_deploy-test'`;
    await api("/api/people", {
      method: "POST",
      body: JSON.stringify({ name: "deploy test", kind: "agent", customerId: "acme" }),
    });
  });

  test("with Railway unconnected, minting still works and explains itself", async () => {
    const res = await api("/api/people/A_deploy-test", {
      method: "POST",
      body: JSON.stringify({ action: "token" }),
    });
    assert.equal(res.status, 200);
    assert.ok(res.body.token.startsWith("wr_sess_"), "the token is still minted");
    assert.equal(res.body.deploy.deployed, false);
    assert.match(res.body.deploy.why, /Railway|token/i, `got: ${res.body.deploy.why}`);
  });

  test("and the token it minted actually works on the floor", async () => {
    const minted = await api("/api/people/A_deploy-test", {
      method: "POST",
      body: JSON.stringify({ action: "token" }),
    });
    const res = await fetch(`${BASE}/api/mcp`, {
      headers: { Authorization: `Bearer ${minted.body.token}` },
    });
    assert.equal(res.status, 200);
    assert.deepEqual((await res.json()).scope, ["acme"]);
  });

  test("the Railway status endpoint is honest about what is missing", async () => {
    const res = await api("/api/railway");
    assert.equal(res.status, 200);
    assert.equal(res.body.connected, false);
    assert.ok(res.body.blocked, "it says why");
  });

  test("a bad Railway token is refused before it is stored", async () => {
    const res = await api("/api/railway", {
      method: "POST",
      body: JSON.stringify({ token: "" }),
    });
    assert.equal(res.status, 400);
    const [row] = await sql`SELECT count(*)::int AS n FROM agency_connections WHERE provider = 'railway'`;
    assert.equal(row.n, 0, "nothing was stored");
  });

  test("minting for a teammate does not try to deploy anything", async () => {
    await sql`DELETE FROM people WHERE id = 'U_deploy-mate'`;
    await api("/api/people", { method: "POST", body: JSON.stringify({ name: "deploy mate" }) });
    const res = await api("/api/people/U_deploy-mate", {
      method: "POST",
      body: JSON.stringify({ action: "token" }),
    });
    assert.equal(res.body.deploy.deployed, false);
    assert.match(res.body.deploy.why, /Not an agent/);
  });
});

/**
 * The Anthropic key belongs in the vault like every other credential, so setting
 * up an agent never means opening the Railway dashboard.
 */
describe("the Anthropic key lives in the vault", () => {
  before(async () => {
    await sql`DELETE FROM agency_connections WHERE provider = 'anthropic'`;
  });

  test("something that is not a key is refused before anything is stored", async () => {
    const res = await api("/api/railway", {
      method: "POST",
      body: JSON.stringify({ anthropicKey: "hunter2" }),
    });
    assert.equal(res.status, 500, "the shape check throws");
    const [row] = await sql`SELECT count(*)::int AS n FROM agency_connections WHERE provider = 'anthropic'`;
    assert.equal(row.n, 0);
  });

  test("a key is stored encrypted, never in the clear", async () => {
    const key = "sk-ant-test-not-a-real-key-000000";
    const res = await api("/api/railway", { method: "POST", body: JSON.stringify({ anthropicKey: key }) });
    assert.equal(res.status, 200);
    assert.equal(res.body.anthropic, true);
    const [row] = await sql`SELECT encrypted_access FROM agency_connections WHERE provider = 'anthropic'`;
    assert.ok(row.encrypted_access.startsWith("v1."), "it is a vault blob");
    assert.ok(!row.encrypted_access.includes(key), "the key itself is not in the row");
  });

  test("and it never comes back out of the API", async () => {
    const res = await api("/api/railway");
    assert.equal(res.status, 200);
    assert.equal(res.body.anthropic, true, "it says a key exists");
    assert.ok(!JSON.stringify(res.body).includes("sk-ant-"), "and never returns it");
  });
});

/**
 * Agency keys — ours, not a customer's. They live in the vault so setting one
 * never means opening a hosting dashboard, and they never come back out.
 */
describe("agency keys are vaulted, shape-checked and write-only", () => {
  before(async () => {
    await sql`DELETE FROM agency_connections WHERE provider IN ('anthropic','resend','openrouter')`;
  });

  test("the status endpoint lists the fields and what is missing", async () => {
    const res = await api("/api/keys");
    assert.equal(res.status, 200);
    const ids = res.body.fields.map((f) => f.id);
    assert.ok(ids.includes("anthropic") && ids.includes("resend"), `got ${ids}`);
    assert.equal(res.body.keys.resend, false);
  });

  test("a key with the wrong shape is refused before it is stored", async () => {
    const res = await api("/api/keys", {
      method: "POST",
      body: JSON.stringify({ key: "resend", value: "sk-ant-wrong-provider" }),
    });
    assert.notEqual(res.status, 200);
    const [row] = await sql`SELECT count(*)::int AS n FROM agency_connections WHERE provider = 'resend'`;
    assert.equal(row.n, 0, "nothing stored");
  });

  test("a real one is stored encrypted and reported as set", async () => {
    const key = "re_test_not_a_real_key";
    const res = await api("/api/keys", { method: "POST", body: JSON.stringify({ key: "resend", value: key }) });
    assert.equal(res.status, 200);
    assert.equal(res.body.keys.resend, true);
    const [row] = await sql`SELECT encrypted_access FROM agency_connections WHERE provider = 'resend'`;
    assert.ok(row.encrypted_access.startsWith("v1."));
    assert.ok(!row.encrypted_access.includes(key), "the key is not in the row");
  });

  test("and it never comes back out", async () => {
    const res = await api("/api/keys");
    assert.ok(!JSON.stringify(res.body).includes("re_test"), "no value is returned");
  });

  test("health reports mail as configured once the Resend key is saved", async () => {
    const res = await fetch(`${BASE}/api/health`);
    const body = await res.json();
    assert.equal(body.mail.configured, true);
  });

  test("an unknown key name is refused", async () => {
    const res = await api("/api/keys", {
      method: "POST",
      body: JSON.stringify({ key: "stripe", value: "sk_live_whatever" }),
    });
    assert.equal(res.status, 400);
  });
});

/**
 * Opening a job. The cap is the point — an agent stops at it and asks rather
 * than deciding the work was worth more than you said.
 */
describe("giving an agent a job with a limit", () => {
  before(async () => {
    await sql`DELETE FROM job_steps WHERE customer_id IN ('acme','globex')`;
    await sql`DELETE FROM jobs WHERE title LIKE 'Booking page%'`;
    await sql`DELETE FROM people WHERE id IN ('A_acme-bot','A_globex-bot')`;
    await sql`
      INSERT INTO people (id, name, handle, kind, customer_id) VALUES
        ('A_acme-bot','acme-bot','acme-bot','agent','acme'),
        ('A_globex-bot','globex-bot','globex-bot','agent','globex')`;
  });

  test("a job without a cap is refused", async () => {
    const res = await api("/api/floor", {
      method: "POST",
      body: JSON.stringify({ title: "Booking page A", customerId: "acme" }),
    });
    assert.equal(res.status, 400);
    assert.match(res.body.error, /cap/i);
  });

  test("an absurd cap is refused too", async () => {
    const res = await api("/api/floor", {
      method: "POST",
      body: JSON.stringify({ title: "Booking page B", customerId: "acme", budgetDollars: 5000 }),
    });
    assert.equal(res.status, 400);
  });

  test("a job opens with the cap in cents and lands on the board", async () => {
    const res = await api("/api/floor", {
      method: "POST",
      body: JSON.stringify({ title: "Booking page C", customerId: "acme", budgetDollars: 12.5, goal: "one page, one form" }),
    });
    assert.equal(res.status, 200);
    const [row] = await sql`SELECT budget_cents, owner_id, status, goal, repo FROM jobs WHERE id = ${res.body.id}`;
    assert.equal(row.budget_cents, 1250);
    assert.equal(row.owner_id, null, "unclaimed, so any scoped session can take it");
    assert.equal(row.goal, "one page, one form");
    assert.equal(row.repo, "agency/acme-site", "the repo comes from the binding, not the form");
  });

  test("handing it to that project's agent claims it immediately", async () => {
    const res = await api("/api/floor", {
      method: "POST",
      body: JSON.stringify({ title: "Booking page D", customerId: "acme", budgetDollars: 5, ownerId: "A_acme-bot" }),
    });
    assert.equal(res.status, 200);
    const [row] = await sql`SELECT owner_id, status FROM jobs WHERE id = ${res.body.id}`;
    assert.equal(row.owner_id, "A_acme-bot");
    assert.equal(row.status, "thinking");
  });

  test("handing it to another project's agent is refused", async () => {
    const res = await api("/api/floor", {
      method: "POST",
      body: JSON.stringify({ title: "Booking page E", customerId: "acme", budgetDollars: 5, ownerId: "A_globex-bot" }),
    });
    assert.equal(res.status, 400);
    assert.match(res.body.error, /different project/);
  });

  test("the first step says who opened it and what the cap is", async () => {
    const [job] = await sql`SELECT id FROM jobs WHERE title = 'Booking page C'`;
    const [step] = await sql`SELECT text, actor FROM job_steps WHERE job_id = ${job.id} ORDER BY id LIMIT 1`;
    assert.match(step.text, /Cap \$12\.50/);
  });
});

/**
 * Mail failures have to say what the provider said. Resend refuses any address
 * on a domain you have not verified, and "could not send the email" is not a
 * sentence anybody can act on.
 */
describe("mail says why when it fails", () => {
  before(async () => {
    await sql`DELETE FROM agency_connections WHERE provider IN ('resend','mail_from')`;
  });

  test("the from address is a settable field, and not a secret one", async () => {
    const res = await api("/api/keys");
    const field = res.body.fields.find((f) => f.id === "mail_from");
    assert.ok(field, "it is offered");
    assert.equal(field.secret, false, "so it renders as text, not dots");
  });

  test("something that is not an address is refused", async () => {
    const res = await api("/api/keys", {
      method: "POST",
      body: JSON.stringify({ key: "mail_from", value: "not-an-address" }),
    });
    assert.notEqual(res.status, 200);
  });

  test("a real one is accepted", async () => {
    const res = await api("/api/keys", {
      method: "POST",
      body: JSON.stringify({ key: "mail_from", value: "AI Wrangler <login@reoperative.ai>" }),
    });
    assert.equal(res.status, 200);
  });

  test("with a bad Resend key, the sign-in route returns the provider's own words", async () => {
    await api("/api/keys", { method: "POST", body: JSON.stringify({ key: "resend", value: "re_definitely_invalid" }) });
    const res = await fetch(`${BASE}/api/auth/magic/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "derik@aiwrangler.co" }),
    });
    assert.equal(res.status, 502);
    const body = await res.json();
    assert.match(body.error, /Resend refused it/, `got: ${body.error}`);
    assert.doesNotMatch(body.error, /^Could not send the email\.$/, "not the useless generic one");
  });
});

describe("the screens read from rows, and failures stay inside", () => {
  test("Command answers with countable numbers", async () => {
    // Regression: `sql`${callLog.at} > ${since}`` handed postgres.js a bare Date.
    // Drizzle's column encoder never ran, the driver refused it, and the whole
    // dashboard 500'd — on the one screen that opens first.
    const { status, body } = await api("/api/command");
    assert.equal(status, 200);
    for (const k of ["callsToday", "unread", "customers"]) {
      assert.equal(typeof body[k], "number", `${k} should be a number`);
    }
    assert.equal(typeof body.pipeline.open, "number");
    assert.ok(Array.isArray(body.hot));
  });

  test("every desk screen loads for a signed-in operator", async () => {
    for (const path of ["/api/leads", "/api/partners", "/api/ads", "/api/threads", "/api/calls"]) {
      const { status, body } = await api(path);
      assert.equal(status, 200, `${path} returned ${status}`);
      assert.equal(typeof body, "object", `${path} did not return json`);
    }
  });

  test("a constraint refusal is a sentence, not a statement dump", async () => {
    const territory = "Test Territory " + Date.now();
    const first = await api("/api/partners", {
      method: "POST",
      body: JSON.stringify({ name: "First Agency", territory }),
    });
    assert.equal(first.status, 200);

    const clash = await api("/api/partners", {
      method: "POST",
      body: JSON.stringify({ name: "Second Agency", territory: territory.toLowerCase() }),
    });
    assert.equal(clash.status, 409);
    assert.match(clash.body.error, /territory already belongs/);

    // The driver's message carries the full INSERT and every bound parameter.
    // It is logged; it never leaves the building.
    const said = JSON.stringify(clash.body);
    for (const leak of ["Failed query", "insert into", "params:", "$1"]) {
      assert.ok(!said.includes(leak), `refusal leaked ${leak}: ${said}`);
    }
    await sql`DELETE FROM partners WHERE territory ILIKE ${territory}`;
  });
});
