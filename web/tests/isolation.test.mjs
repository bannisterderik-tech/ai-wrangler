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
    // The step names the brain as well as the cap: both are what the job costs.
    assert.match(step.text, /cap \$12\.50/i);
    assert.match(step.text, /Medium brain/);
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

/**
 * The cap has to be a wall, not a label.
 *
 * It was a label. `spent_cents` was written as 0 when a job opened and never
 * touched again, and `budget_cents` was displayed but never compared to
 * anything — so a job could be worked forever while honestly reporting
 * "$0.00 of $2.00 spent". These tests are the receipt that it stops now.
 */
describe("the cap is enforced, not displayed", () => {
  let agentToken = "";
  let jobId = "";

  before(async () => {
    await sql`DELETE FROM jobs WHERE title = 'Capped work'`;
    await sql`DELETE FROM people WHERE id = 'A_cap-bot'`;
    // A raw token whose SHA-256 is what the floor stores, same as minting.
    agentToken = "wr_sess_captest0000000000000000000";
    const { createHash } = await import("node:crypto");
    const hash = createHash("sha256").update(agentToken).digest("hex");
    await sql`
      INSERT INTO people (id, name, handle, kind, customer_id, token_hash, status)
      VALUES ('A_cap-bot','cap-bot','cap-bot','agent','acme',${hash},'connected')`;
    await sql`
      INSERT INTO person_tools (person_id, tool) VALUES
        ('A_cap-bot','claim_job'), ('A_cap-bot','list_jobs')`;
    const res = await api("/api/floor", {
      method: "POST",
      body: JSON.stringify({ title: "Capped work", customerId: "acme", budgetDollars: 2 }),
    });
    jobId = res.body.id;
  });

  async function spend(usd) {
    return fetch(`${BASE}/api/agent/spend`, {
      method: "POST",
      headers: { Authorization: `Bearer ${agentToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ usd }),
    }).then(async (r) => ({ status: r.status, body: await r.json() }));
  }

  async function claim() {
    const r = await fetch(`${BASE}/api/mcp`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${agentToken}`,
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: { name: "claim_job", arguments: { job_id: jobId } },
      }),
    });
    const text = await r.text();
    return text;
  }

  test("an unknown token cannot report spend", async () => {
    const r = await fetch(`${BASE}/api/agent/spend`, {
      method: "POST",
      headers: { Authorization: "Bearer wr_sess_nope", "Content-Type": "application/json" },
      body: JSON.stringify({ usd: 500 }),
    });
    assert.equal(r.status, 401);
  });

  test("a pass's cost lands on the job the session holds", async () => {
    const first = await claim();
    assert.match(first, /Claimed/, `expected a clean claim, got: ${first}`);
    const r = await spend(0.75);
    assert.equal(r.status, 200);
    assert.equal(r.body.attributed, true);
    assert.equal(r.body.spent, 0.75);
    assert.equal(r.body.over, false);
    const [row] = await sql`SELECT spent_cents FROM jobs WHERE id = ${jobId}`;
    assert.equal(row.spent_cents, 75, "spend has to reach the row, not just the response");
  });

  test("spend accumulates across passes and trips the cap", async () => {
    const r = await spend(1.5);
    assert.equal(r.body.spent, 2.25);
    assert.equal(r.body.over, true, "$2.25 of a $2.00 cap is over");
    const [row] = await sql`SELECT status FROM jobs WHERE id = ${jobId}`;
    assert.equal(row.status, "blocked", "over the cap, the job is held in the row");
  });

  test("and the floor then refuses to let it be worked again", async () => {
    await sql`UPDATE jobs SET owner_id = NULL WHERE id = ${jobId}`;
    const out = await claim();
    assert.match(out, /refused/, `a capped job must not be claimable: ${out}`);
    assert.match(out, /\$2\.25 of its \$2\.00 cap/);
  });

  test("nonsense costs are refused", async () => {
    for (const usd of [-5, "lots", 999999]) {
      const r = await fetch(`${BASE}/api/agent/spend`, {
        method: "POST",
        headers: { Authorization: `Bearer ${agentToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ usd }),
      });
      assert.equal(r.status, 400, `usd=${usd} should be refused`);
    }
  });
});

describe("the worker can be redeployed from the OS", () => {
  test("with Railway not connected it says so, and does not pretend", async () => {
    const res = await api("/api/railway", {
      method: "POST",
      body: JSON.stringify({ action: "redeploy" }),
    });
    assert.equal(res.status, 409, "no Railway connection is a refusal, not a silent ok");
    assert.match(res.body.error, /Railway|worker/i);
    assert.ok(!res.body.ok, "must not report success when nothing was deployed");
  });

  test("a stranger cannot redeploy anything", async () => {
    const saved = cookie;
    cookie = "";
    const res = await api("/api/railway", {
      method: "POST",
      body: JSON.stringify({ action: "redeploy" }),
    });
    cookie = saved;
    assert.equal(res.status, 401);
  });
});

/**
 * A job's tier has to reach the model that runs it.
 *
 * `jobs.tier` existed as free text defaulting to "Medium brain" and nothing read
 * it — every pass ran on whatever AGENT_MODEL the container held, so a heading
 * change was billed at rebuild prices and the column was decoration.
 */
describe("a job picks its own size of brain", () => {
  let token = "";
  before(async () => {
    await sql`DELETE FROM jobs WHERE title LIKE 'Brain %'`;
    await sql`DELETE FROM people WHERE id = 'A_brain-bot'`;
    token = "wr_sess_braintest000000000000000000";
    const { createHash } = await import("node:crypto");
    const hash = createHash("sha256").update(token).digest("hex");
    await sql`
      INSERT INTO people (id, name, handle, kind, customer_id, token_hash, status)
      VALUES ('A_brain-bot','brain-bot','brain-bot','agent','acme',${hash},'connected')`;
  });

  const next = () =>
    fetch(`${BASE}/api/agent/next`, { headers: { Authorization: `Bearer ${token}` } }).then(async (r) => ({
      status: r.status,
      body: await r.json(),
    }));

  test("the floor offers the tiers so the form does not retype them", async () => {
    const { body } = await api("/api/floor");
    assert.ok(Array.isArray(body.brains) && body.brains.length >= 3);
    const ids = body.brains.map((b) => b.id);
    for (const id of ["haiku", "sonnet", "opus"]) assert.ok(ids.includes(id), `missing ${id}`);
    // Every tier states its downside. A picker of only upsides is a sales page.
    for (const b of body.brains) assert.ok(b.bad && b.bad.length > 10, `${b.id} has no stated downside`);
  });

  test("opening a job on a tier stores that tier", async () => {
    const res = await api("/api/floor", {
      method: "POST",
      body: JSON.stringify({ title: "Brain small", customerId: "acme", budgetDollars: 3, tier: "haiku" }),
    });
    assert.equal(res.status, 200);
    const [row] = await sql`SELECT tier FROM jobs WHERE id = ${res.body.id}`;
    assert.equal(row.tier, "haiku");
  });

  test("an unknown tier falls back rather than failing the job", async () => {
    const res = await api("/api/floor", {
      method: "POST",
      body: JSON.stringify({ title: "Brain junk", customerId: "acme", budgetDollars: 3, tier: "galaxy" }),
    });
    assert.equal(res.status, 200);
    const [row] = await sql`SELECT tier FROM jobs WHERE id = ${res.body.id}`;
    assert.equal(row.tier, "sonnet");
  });

  test("the worker is told which model to start", async () => {
    const r = await next();
    assert.equal(r.status, 200);
    assert.ok(r.body.job, "there is claimable work, so a job should be offered");
    assert.ok(r.body.model, "a model has to be named or --model cannot be set");
    assert.equal(typeof r.body.remaining, "number");
  });

  test("a stranger is not told what is on the board", async () => {
    const r = await fetch(`${BASE}/api/agent/next`, { headers: { Authorization: "Bearer wr_sess_nope" } });
    assert.equal(r.status, 401);
  });

  test("a job at its cap is not offered as work", async () => {
    await sql`UPDATE jobs SET spent_cents = budget_cents WHERE customer_id = 'acme' AND owner_id IS NULL`;
    await sql`UPDATE jobs SET spent_cents = budget_cents WHERE owner_id = 'A_brain-bot'`;
    const r = await next();
    assert.equal(r.body.job, null, "capped jobs must not start a pass that can only be refused");
    assert.match(r.body.reason, /cap|nothing/i);
  });
});

/**
 * Recall has to return the notes that bear on the work.
 *
 * read_project handed the agent the newest thirty memories by date, so a job
 * about a booking form was read a note about last quarter's logo — worse
 * context and more tokens, every pass.
 */
describe("memory is searched, not just listed", () => {
  before(async () => {
    await sql`DELETE FROM memories WHERE customer_id = 'acme'`;
    const rows = [
      ["never touch the pricing page without asking Dana", "rule"],
      ["the booking form posts to Formspree, not to our own endpoint", "note"],
      ["site visits are booked in two-hour windows, never exact times", "note"],
      ["the logo was redrawn in March and the old one is still cached", "note"],
      ["they bill quarterly and hate being invoiced monthly", "note"],
      ["hero photography comes from the owner's phone, expect low res", "note"],
    ];
    for (const [text, kind] of rows) {
      await sql`
        INSERT INTO memories (id, customer_id, text, kind)
        VALUES (${"M" + Math.random().toString(36).slice(2, 10)}, 'acme', ${text}, ${kind})`;
    }
  });

  async function recall(q) {
    const res = await api(`/api/memories/recall?customerId=acme&q=${encodeURIComponent(q)}`);
    return res;
  }

  test("a search for the booking form finds the booking notes", async () => {
    const { status, body } = await recall("booking form for site visits");
    assert.equal(status, 200);
    const texts = body.memories.map((m) => m.text).join(" | ");
    assert.match(texts, /booking form posts to Formspree/);
    assert.match(texts, /two-hour windows/);
  });

  test("it does not lead with the notes that have nothing to do with it", async () => {
    const { body } = await recall("booking form for site visits");
    const top = body.memories.filter((m) => m.kind !== "rule").slice(0, 2).map((m) => m.text).join(" | ");
    assert.ok(!/logo was redrawn/.test(top), `an unrelated note ranked top: ${top}`);
    assert.ok(!/bill quarterly/.test(top), `an unrelated note ranked top: ${top}`);
  });

  test("a house rule comes back whatever the query, because it outranks relevance", async () => {
    const { body } = await recall("hero photography");
    const rules = body.memories.filter((m) => m.kind === "rule").map((m) => m.text);
    assert.match(rules.join(" "), /pricing page without asking Dana/);
  });

  test("it says which backend answered, so nobody assumes semantic when it is lexical", async () => {
    const { body } = await recall("anything");
    assert.ok(["semantic", "lexical"].includes(body.mode), `unexpected mode ${body.mode}`);
  });

  test("another customer's memories are not searchable from here", async () => {
    await sql`
      INSERT INTO memories (id, customer_id, text, kind)
      VALUES ('M_globexsecret','globex','the globex booking form is a secret','note')`;
    const { body } = await recall("booking form");
    const texts = body.memories.map((m) => m.text).join(" ");
    assert.ok(!texts.includes("globex booking form"), "recall leaked across customers");
  });
});

/**
 * The client wall had a door in it marked "auth".
 *
 * middleware.ts let any signed-in client session reach the whole of
 * /api/auth/*, so they could sign in and out. But that prefix also holds the
 * Vercel and GitHub OAuth routes, and none of the four checked authorization at
 * all — guard() only asks whether SOMEBODY is signed in, and a client satisfies
 * it. A client could therefore start a Vercel connect flow naming another
 * customer, complete it against their own Vercel account, and have the callback
 * overwrite that customer's stored deploy token and rebind their projects.
 */
describe("a client cannot reach the agency's OAuth routes", () => {
  let clientCookie = "";
  // Local copies: the originals are scoped to the client-CRM block above.
  async function signInAs(email) {
    const raw = `wr_sess_wall_${email.replace(/\W/g, "")}_${Date.now()}`;
    const { createHash } = await import("node:crypto");
    const hash = createHash("sha256").update(raw).digest("hex");
    await sql`
      INSERT INTO login_links (token_hash, email, expires_at)
      VALUES (${hash}, ${email}, now() + interval '15 minutes')`;
    const res = await fetch(`${BASE}/api/auth/magic/callback?token=${raw}`, { redirect: "manual" });
    const value = /wrangler_session=([^;]+)/.exec(res.headers.get("set-cookie") || "")?.[1];
    return { cookie: value ? `wrangler_session=${value}` : "" };
  }
  const as = (cookie, path, init = {}) =>
    fetch(`${BASE}${path}`, {
      ...init,
      redirect: "manual",
      headers: { "Content-Type": "application/json", cookie, ...(init.headers || {}) },
    });

  before(async () => {
    await sql`DELETE FROM people WHERE email = 'wall@acme.test'`;
    await sql`
      INSERT INTO people (id, name, handle, email, kind, customer_id)
      VALUES ('p-wall','Wall Tester','walltester','wall@acme.test','client','acme')`;
    clientCookie = (await signInAs("wall@acme.test")).cookie;
    assert.ok(clientCookie, "the client signed in");
  });

  for (const path of [
    "/api/auth/vercel/start?customerId=globex",
    "/api/auth/vercel/callback?code=x&state=y",
    "/api/auth/github/start",
    "/api/auth/github/callback?code=x&state=y",
  ]) {
    test(`refuses a client at ${path.split("?")[0]}`, async () => {
      const res = await as(clientCookie, path);
      assert.ok(
        res.status === 403 || res.status === 404 || (res.status >= 300 && res.status < 400 && !/vercel\.com|github\.com/.test(res.headers.get("location") ?? "")),
        `a client reached ${path} and got ${res.status}`,
      );
      assert.notEqual(res.status, 200, "a client must never get a 200 from an agency OAuth route");
    });
  }

  test("and the start route did not create a customer row on the way through", async () => {
    await as(clientCookie, "/api/auth/vercel/start?customerId=invented-by-a-client");
    const [row] = await sql`SELECT count(*)::int AS n FROM customers WHERE id = 'invented-by-a-client'`;
    assert.equal(row.n, 0, "a refused route must not have written a customer first");
  });

  test("the client can still sign out — the door they actually need is open", async () => {
    const res = await as(clientCookie, "/api/auth/logout", { method: "POST" });
    assert.ok(res.status < 400, `logout should work for a client, got ${res.status}`);
  });
});

/**
 * Tables created after 0002 do not inherit its revokes. On Supabase, new public
 * tables are granted to anon/authenticated by default, so a table shipped
 * without RLS is readable through PostgREST — and these hold signing evidence
 * (email, IP, user agent) and the capability token that lets its holder sign.
 */
describe("every table is walled", () => {
  test("no table in public is missing row level security", async () => {
    const rows = await sql`
      SELECT relname FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relkind = 'r' AND NOT c.relrowsecurity
        AND relname <> '_wrangler_migrations'`;
    assert.deepEqual(
      rows.map((r) => r.relname),
      [],
      "these tables have no RLS — a migration added them and forgot the wall",
    );
  });
});

/**
 * Spend has to land on the job that was worked.
 *
 * It was attributed to "whatever this session most recently claimed, if it is
 * still open", which had two holes big enough to make the cap decorative:
 *
 *  - post_step(kind:"done") sets a job to 'done' and release_job clears its
 *    owner, and neither matched the lookup — so every pass that FINISHED its
 *    work recorded nothing. Only crashes were billed.
 *  - open_work inserts a job with claimedAt=now, which is always the newest
 *    claim, so an agent following its own brief could move the bill onto a
 *    fresh $0 budget and do it again next pass.
 */
describe("spend lands on the job that was worked", () => {
  let token = "";
  before(async () => {
    await sql`DELETE FROM jobs WHERE title LIKE 'Attrib %'`;
    await sql`DELETE FROM people WHERE id = 'A_attrib'`;
    token = "wr_sess_attrib000000000000000000000";
    const { createHash } = await import("node:crypto");
    const hash = createHash("sha256").update(token).digest("hex");
    await sql`
      INSERT INTO people (id, name, handle, kind, customer_id, token_hash, status)
      VALUES ('A_attrib','attrib-bot','attrib-bot','agent','acme',${hash},'connected')`;
  });

  const spend = (usd, jobId) =>
    fetch(`${BASE}/api/agent/spend`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ usd, jobId }),
    }).then(async (r) => ({ status: r.status, body: await r.json() }));

  test("a finished job is still billed for the pass that finished it", async () => {
    const res = await api("/api/floor", {
      method: "POST",
      body: JSON.stringify({ title: "Attrib done", customerId: "acme", budgetDollars: 5 }),
    });
    const id = res.body.id;
    await sql`UPDATE jobs SET status = 'done', owner_id = NULL WHERE id = ${id}`;
    const r = await spend(2.5, id);
    assert.equal(r.body.attributed, true, "a completed job must still take the bill");
    const [row] = await sql`SELECT spent_cents FROM jobs WHERE id = ${id}`;
    assert.equal(row.spent_cents, 250);
  });

  test("an agent cannot move its bill onto a different customer's job", async () => {
    const [other] = await sql`
      INSERT INTO jobs (id, customer_id, title, status, budget_cents)
      VALUES ('J_notmine','globex','Attrib elsewhere','queued',10000) RETURNING id`;
    const r = await spend(3, other.id);
    const [row] = await sql`SELECT spent_cents FROM jobs WHERE id = 'J_notmine'`;
    assert.equal(row.spent_cents, 0, "out of scope: that job must not be touched");
    assert.notEqual(r.body.job, "J_notmine");
  });

  test("spend adds up instead of overwriting when two reports race", async () => {
    const res = await api("/api/floor", {
      method: "POST",
      body: JSON.stringify({ title: "Attrib race", customerId: "acme", budgetDollars: 50 }),
    });
    const id = res.body.id;
    await Promise.all([spend(1, id), spend(1, id), spend(1, id), spend(1, id)]);
    const [row] = await sql`SELECT spent_cents FROM jobs WHERE id = ${id}`;
    assert.equal(row.spent_cents, 400, "four concurrent $1 reports are $4, not $1");
  });

  test("a teammate's session cannot report spend at all", async () => {
    await sql`DELETE FROM people WHERE id = 'P_human'`;
    const raw = "wr_sess_human0000000000000000000000";
    const { createHash } = await import("node:crypto");
    const hash = createHash("sha256").update(raw).digest("hex");
    await sql`
      INSERT INTO people (id, name, handle, kind, token_hash, status)
      VALUES ('P_human','A Teammate','teammate','operator',${hash},'connected')`;
    const r = await fetch(`${BASE}/api/agent/spend`, {
      method: "POST",
      headers: { Authorization: `Bearer ${raw}`, "Content-Type": "application/json" },
      body: JSON.stringify({ usd: 9999 }),
    });
    assert.equal(r.status, 403);
  });
});

/**
 * The dialer must connect two people, or refuse.
 *
 * placeCall used to send <Response><Say>Connecting you through AI
 * Wrangler.</Say></Response> — no <Dial> anywhere in it. With live credentials
 * that rings a customer's lead, says one sentence at them and hangs up. A
 * robocaller, behind a button labelled "Call".
 */
describe("the dialer connects a call or says why not", () => {
  test("the TwiML we would send actually dials the lead", async () => {
    const src = await import("node:fs/promises").then((fs) =>
      fs.readFile(new URL("../src/lib/twilio.ts", import.meta.url), "utf8"),
    );
    assert.match(src, /<Dial/, "TwiML with no <Dial> connects nobody");
    assert.match(src, /answerOnBridge/, "without answerOnBridge the lead hears ringing as answered");
    assert.ok(
      !/Twiml:\s*`<Response><Say>[^`]*<\/Say><\/Response>`/.test(src),
      "a Say-only call is a robocall",
    );
  });

  test("voiceToken does not claim success while returning nothing", async () => {
    const res = await api("/api/twilio/call");
    assert.equal(res.status, 200);
    // Unconfigured is fine; silently reporting ok with a null token is not.
    if (res.body.token?.token === null) {
      assert.ok(res.body.token.why, "a null token has to say why it is null");
    }
    assert.equal(typeof res.body.canCall, "boolean", "the UI needs to know if a call can be placed at all");
  });

  test("a call with nowhere to ring us is refused, not faked", async () => {
    const src = await import("node:fs/promises").then((fs) =>
      fs.readFile(new URL("../src/lib/twilio.ts", import.meta.url), "utf8"),
    );
    // The bridge number is what puts a human on our end. No number, no call.
    assert.match(src, /just a robocall/, "the refusal must exist and explain itself");
    assert.match(src, /if \(!target\)/, "placeCall has to check it has somewhere to ring");
  });
});

/**
 * The approval loop had no return path.
 *
 * request_approval wrote a row; approving flipped a status. No tool let the
 * agent learn the answer, so it went to the wall, was approved, picked the job
 * back up, re-derived everything from scratch and hit the same wall — four
 * times, on real money. And claim_job told the operator "a human has to raise
 * the cap", an operation that existed nowhere in the codebase.
 */
describe("a decision reaches the agent, and a cap can be raised", () => {
  let token = "";
  let jobId = "";
  before(async () => {
    await sql`DELETE FROM jobs WHERE title = 'Loop job'`;
    await sql`DELETE FROM people WHERE id = 'A_loop'`;
    token = "wr_sess_loop00000000000000000000000";
    const { createHash } = await import("node:crypto");
    const hash = createHash("sha256").update(token).digest("hex");
    await sql`
      INSERT INTO people (id, name, handle, kind, customer_id, token_hash, status)
      VALUES ('A_loop','loop-bot','loop-bot','agent','acme',${hash},'connected')`;
    await sql`
      INSERT INTO person_tools (person_id, tool) VALUES
        ('A_loop','claim_job'), ('A_loop','read_decision'), ('A_loop','request_approval')`;
    const res = await api("/api/floor", {
      method: "POST",
      body: JSON.stringify({ title: "Loop job", customerId: "acme", budgetDollars: 2 }),
    });
    jobId = res.body.id;
  });

  const call = async (name, args) => {
    const r = await fetch(`${BASE}/api/mcp`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
      },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name, arguments: args } }),
    });
    return r.text();
  };

  test("with nothing asked, it says so instead of inventing an answer", async () => {
    await call("claim_job", { job_id: jobId });
    const out = await call("read_decision", { job_id: jobId });
    assert.match(out, /Nothing has been asked/);
  });

  test("while pending it is told to stop, not to ask again", async () => {
    await call("request_approval", {
      job_id: jobId, title: "Merge the booking page", what: "merge to main", blast: "the live site",
    });
    const out = await call("read_decision", { job_id: jobId });
    assert.match(out, /Still waiting/);
    assert.match(out, /do not do it anyway|stop here/i);
  });

  test("once approved, the agent can actually learn that", async () => {
    const [gate] = await sql`SELECT id FROM approvals WHERE job_id = ${jobId} ORDER BY created_at DESC LIMIT 1`;
    const res = await api(`/api/approvals/${gate.id}`, { method: "POST", body: JSON.stringify({ action: "approve" }) });
    assert.equal(res.status, 200);
    const out = await call("read_decision", { job_id: jobId });
    assert.match(out, /was approved/);
  });

  test("a capped job can be raised and goes back on the board", async () => {
    await sql`UPDATE jobs SET spent_cents = budget_cents, status = 'blocked' WHERE id = ${jobId}`;
    const bad = await api(`/api/floor/${jobId}`, {
      method: "POST", body: JSON.stringify({ action: "raise-cap", budgetDollars: 1 }),
    });
    assert.equal(bad.status, 400, "a new cap below what it already spent is not a cap");

    const ok = await api(`/api/floor/${jobId}`, {
      method: "POST", body: JSON.stringify({ action: "raise-cap", budgetDollars: 20 }),
    });
    assert.equal(ok.status, 200);
    const [row] = await sql`SELECT budget_cents, status, owner_id FROM jobs WHERE id = ${jobId}`;
    assert.equal(row.budget_cents, 2000);
    assert.equal(row.status, "queued", "raised means workable again");
    assert.equal(row.owner_id, null, "the session that hit the wall is gone; leaving it owned makes it unclaimable");
  });
});

/**
 * Quote to cash.
 *
 * A lead is sent a proposal, agrees to it, signs it, and pays a deposit — and
 * the deposit is what turns them into a customer, because money changing hands
 * is the only signal worth trusting for that.
 */
describe("a proposal can be signed and paid, and paying makes a customer", () => {
  let leadId = "";
  let proposalId = "";
  let token = "";

  before(async () => {
    await sql`DELETE FROM proposals WHERE title LIKE 'Chain %'`;
    await sql`DELETE FROM agency_leads WHERE company = 'Chain Test Co'`;
    await sql`DELETE FROM customers WHERE id = 'chain-test-co'`;
    const [lead] = await sql`
      INSERT INTO agency_leads (id, company, contact, email, stage, value_cents)
      VALUES ('L_chain','Chain Test Co','Dana Chain','dana@chain.test','talking',0) RETURNING id`;
    leadId = lead.id;
  });

  const pub = (path, init) =>
    fetch(`${BASE}${path}`, { ...init, headers: { "Content-Type": "application/json", ...(init?.headers || {}) } });

  test("an operator builds it and the deposit is taken on one-time work only", async () => {
    const made = await api("/api/proposals", {
      method: "POST",
      body: JSON.stringify({ leadId, title: "Chain rebuild", terms: "50% up front." }),
    });
    assert.equal(made.status, 200);
    proposalId = made.body.id;

    const priced = await api(`/api/proposals/${proposalId}`, {
      method: "PATCH",
      body: JSON.stringify({
        depositKind: "percent",
        depositPct: 50,
        items: [
          { name: "Build", cadence: "once", qty: 1, unitCents: 400000 },
          { name: "Retainer", cadence: "monthly", qty: 1, unitCents: 50000 },
        ],
      }),
    });
    assert.equal(priced.body.onceCents, 400000);
    assert.equal(priced.body.monthlyCents, 50000);
    // Half of the build, not half of build+retainer: a deposit on a retainer
    // bills for months nobody has worked yet.
    assert.equal(priced.body.depositCents, 200000);
  });

  test("an unsent proposal has no link to open", async () => {
    const before = await sql`SELECT token FROM proposals WHERE id = ${proposalId}`;
    assert.equal(before[0].token, null, "a draft must not be reachable");
  });

  test("sending freezes it and produces a link", async () => {
    const sent = await api(`/api/proposals/${proposalId}`, {
      method: "PATCH",
      body: JSON.stringify({ action: "send" }),
    });
    assert.equal(sent.status, 200);
    token = sent.body.link.split("/p/")[1];
    assert.ok(token && token.length > 30, "the link is the credential, so it has to be unguessable");

    const edit = await api(`/api/proposals/${proposalId}`, {
      method: "PATCH",
      body: JSON.stringify({ title: "Sneakily changed" }),
    });
    assert.equal(edit.status, 409, "a sent proposal must not be editable underneath the person reading it");
  });

  test("the client opens it with no account and sees the price", async () => {
    const res = await pub(`/api/p/${token}`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.dueTodayCents, 200000);
    assert.equal(body.company, "Chain Test Co");
  });

  test("a wrong token gets nothing", async () => {
    const res = await pub(`/api/p/${"x".repeat(43)}`);
    assert.equal(res.status, 404);
  });

  test("signing needs a name and an explicit agreement", async () => {
    const noBox = await pub(`/api/p/${token}`, {
      method: "POST",
      body: JSON.stringify({ action: "sign", name: "Dana Chain", agreed: false }),
    });
    assert.equal(noBox.status, 400);
    const noName = await pub(`/api/p/${token}`, {
      method: "POST",
      body: JSON.stringify({ action: "sign", name: "", agreed: true }),
    });
    assert.equal(noName.status, 400);
  });

  test("a signature records who, when, from where, and what exactly", async () => {
    const res = await pub(`/api/p/${token}`, {
      method: "POST",
      headers: { "X-Forwarded-For": "203.0.113.9, 10.0.0.1", "User-Agent": "TestBrowser/1.0" },
      body: JSON.stringify({ action: "sign", name: "Dana Chain", agreed: true, email: "dana@chain.test" }),
    });
    assert.equal(res.status, 200);
    const [sig] = await sql`SELECT * FROM signatures WHERE proposal_id = ${proposalId}`;
    assert.equal(sig.typed_name, "Dana Chain");
    assert.equal(sig.ip, "203.0.113.9", "the client hop, not the proxy");
    assert.match(sig.user_agent, /TestBrowser/);
    assert.equal(sig.document_hash.length, 64);
  });

  test("the hash still matches the document, so it proves what was agreed", async () => {
    const [sig] = await sql`SELECT document_hash FROM signatures WHERE proposal_id = ${proposalId}`;
    const now = await api(`/api/proposals/${proposalId}`);
    const { createHash } = await import("node:crypto");
    const rehashed = createHash("sha256").update(now.body.document, "utf8").digest("hex");
    assert.equal(rehashed, sig.document_hash, "a hash that cannot be reproduced proves nothing");
  });

  test("it cannot be signed twice", async () => {
    const again = await pub(`/api/p/${token}`, {
      method: "POST",
      body: JSON.stringify({ action: "sign", name: "Someone Else", agreed: true }),
    });
    assert.equal(again.status, 409);
  });

  test("an unsigned webhook creates nothing", async () => {
    const res = await fetch(`${BASE}/api/stripe/webhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "checkout.session.completed",
        data: { object: { payment_status: "paid", metadata: { proposal_id: proposalId } } },
      }),
    });
    assert.equal(res.status, 400, "no signature, no customer — anyone could POST this");
    const [row] = await sql`SELECT customer_id FROM proposals WHERE id = ${proposalId}`;
    assert.equal(row.customer_id, null);
  });

  test("and the browser redirect cannot convert anyone either", async () => {
    const res = await pub(`/api/p/${token}?paid=1`);
    assert.equal(res.status, 200);
    const [row] = await sql`SELECT customer_id, status FROM proposals WHERE id = ${proposalId}`;
    assert.equal(row.customer_id, null, "visiting a success URL is not payment");
    assert.notEqual(row.status, "paid");
  });
});

/**
 * The conversion itself: a signed webhook, and only a signed webhook, turns a
 * lead into a customer. Stripe retries until it gets a 2xx, so this has to be
 * safe to run twice.
 */
describe("the deposit is what creates the customer", () => {
  const SECRET = "whsec_test_only_not_a_real_secret";
  let proposalId = "";

  before(async () => {
    await sql`DELETE FROM proposals WHERE title = 'Convert me'`;
    await sql`DELETE FROM agency_leads WHERE company = 'Convert Co'`;
    await sql`DELETE FROM customers WHERE id = 'convert-co'`;
    await sql`
      INSERT INTO agency_leads (id, company, contact, email, stage, value_cents)
      VALUES ('L_convert','Convert Co','Sam Convert','sam@convert.test','proposal',0)`;
    const made = await api("/api/proposals", {
      method: "POST",
      body: JSON.stringify({ leadId: "L_convert", title: "Convert me" }),
    });
    proposalId = made.body.id;
    await api(`/api/proposals/${proposalId}`, {
      method: "PATCH",
      body: JSON.stringify({ items: [{ name: "Build", cadence: "once", qty: 1, unitCents: 100000 }] }),
    });
    await api(`/api/proposals/${proposalId}`, { method: "PATCH", body: JSON.stringify({ action: "send" }) });
  });

  async function send(body, { secret = SECRET, age = 0 } = {}) {
    const { createHmac } = await import("node:crypto");
    const payload = JSON.stringify(body);
    const t = Math.floor(Date.now() / 1000) - age;
    const sig = createHmac("sha256", secret).update(`${t}.${payload}`).digest("hex");
    return fetch(`${BASE}/api/stripe/webhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "stripe-signature": `t=${t},v1=${sig}` },
      body: payload,
    });
  }

  const paidEvent = (id = "cs_test_1") => ({
    type: "checkout.session.completed",
    data: { object: { id, payment_status: "paid", payment_intent: "pi_test_1", metadata: { proposal_id: proposalId } } },
  });

  test("a signature from the wrong secret is refused", async () => {
    const res = await send(paidEvent(), { secret: "whsec_wrong" });
    assert.equal(res.status, 400);
  });

  test("a replayed old signature is refused", async () => {
    const res = await send(paidEvent(), { age: 4000 });
    assert.equal(res.status, 400, "an old timestamp is a captured request being replayed");
  });

  test("an unpaid session converts nobody", async () => {
    const res = await send({
      type: "checkout.session.completed",
      data: { object: { id: "cs_unpaid", payment_status: "unpaid", metadata: { proposal_id: proposalId } } },
    });
    assert.equal(res.status, 200);
    const [row] = await sql`SELECT customer_id FROM proposals WHERE id = ${proposalId}`;
    assert.equal(row.customer_id, null);
  });

  test("a real paid webhook creates the customer and wins the lead", async () => {
    const res = await send(paidEvent());
    assert.equal(res.status, 200);
    const [p] = await sql`SELECT customer_id, status FROM proposals WHERE id = ${proposalId}`;
    assert.ok(p.customer_id, "paying is what makes a customer");
    assert.equal(p.status, "paid");
    const [c] = await sql`SELECT name FROM customers WHERE id = ${p.customer_id}`;
    assert.equal(c.name, "Convert Co");
    const [lead] = await sql`SELECT stage FROM agency_leads WHERE id = 'L_convert'`;
    assert.equal(lead.stage, "won");
  });

  test("Stripe retrying the same event does not create a second customer", async () => {
    const before = await sql`SELECT count(*)::int AS n FROM customers`;
    const res = await send(paidEvent());
    assert.equal(res.status, 200);
    const after = await sql`SELECT count(*)::int AS n FROM customers`;
    assert.equal(after[0].n, before[0].n, "webhooks retry; conversion must be idempotent");
  });
});

describe("a client-facing page never wears the agency shell", () => {
  test("the proposal page is bare", async () => {
    const src = await import("node:fs/promises").then((fs) =>
      fs.readFile(new URL("../src/components/os/Shell.tsx", import.meta.url), "utf8"),
    );
    // Caught by looking, not by a test, twice now — once on /client and once
    // here. A lead with no account must not be shown our floor and a Sign out
    // button for a session they do not have.
    for (const route of ['path === "/login"', 'path === "/client"', 'path.startsWith("/p/")']) {
      assert.ok(src.includes(route), `Shell must render bare for ${route}`);
    }
  });
});

describe("assigning work to the right hands", () => {
  before(async () => {
    await sql`DELETE FROM people WHERE id IN ('A_pick_acme','A_pick_globex')`;
    await sql`
      INSERT INTO people (id, name, handle, kind, customer_id, status) VALUES
        ('A_pick_acme','acme-builder','acme-builder','agent','acme','connected'),
        ('A_pick_globex','globex-builder','globex-builder','agent','globex','connected')`;
  });

  test("the floor says which people are agents and whose project they are on", async () => {
    const { body } = await api("/api/floor");
    const agents = body.people.filter((p) => p.kind === "agent");
    assert.ok(agents.length >= 2, "agents have to be identifiable as agents");
    // Without these two fields every "is this agent on this project?" filter in
    // the UI passes for everyone, and the New job form offers a customer every
    // other customer's agent.
    for (const a of agents) {
      assert.ok("customerId" in a, `${a.name} has no customerId, so it cannot be filtered by project`);
    }
    const acme = agents.find((a) => a.id === "A_pick_acme");
    assert.equal(acme.customerId, "acme");
  });

  test("handing a job to another project's agent is still refused server-side", async () => {
    const res = await api("/api/floor", {
      method: "POST",
      body: JSON.stringify({
        title: "Wrong hands", customerId: "acme", budgetDollars: 5, ownerId: "A_pick_globex",
      }),
    });
    assert.equal(res.status, 400);
    assert.match(res.body.error, /different project/);
  });

  test("handing it to this project's agent works and claims it", async () => {
    const res = await api("/api/floor", {
      method: "POST",
      body: JSON.stringify({
        title: "Right hands", customerId: "acme", budgetDollars: 5, ownerId: "A_pick_acme", tier: "haiku",
      }),
    });
    assert.equal(res.status, 200);
    const [row] = await sql`SELECT owner_id, status, tier FROM jobs WHERE id = ${res.body.id}`;
    assert.equal(row.owner_id, "A_pick_acme");
    assert.equal(row.status, "thinking");
    assert.equal(row.tier, "haiku");
  });
});

/**
 * A redirect after sign-in must not be able to leave this origin.
 *
 * The old guard was `next.startsWith("/") && !next.startsWith("//")`. WHATWG URL
 * folds a backslash to a slash for special schemes, so "/\evil.com" begins with
 * a single slash, passes both checks, and resolves to https://evil.com. The
 * redirect happens after the session cookie is set, so it is login-CSRF plus a
 * free off-site bounce.
 */
describe("sign-in cannot bounce you off-site", () => {
  const minted = [];
  async function link(email, next) {
    const raw = `wr_sess_redir_${Math.random().toString(36).slice(2)}`;
    minted.push(raw);
    const { createHash } = await import("node:crypto");
    const hash = createHash("sha256").update(raw).digest("hex");
    await sql`
      INSERT INTO login_links (token_hash, email, expires_at)
      VALUES (${hash}, ${email}, now() + interval '15 minutes')`;
    const qs = next === undefined ? "" : `&next=${encodeURIComponent(next)}`;
    const res = await fetch(`${BASE}/api/auth/magic/callback?token=${raw}${qs}`, { redirect: "manual" });
    return res.headers.get("location") || "";
  }

  for (const evil of ["/\\evil.com", "/\t/evil.com", "//evil.com", "https://evil.com", "/\\\\evil.com"]) {
    test(`refuses ${JSON.stringify(evil)}`, async () => {
      const to = await link("derik@aiwrangler.co", evil);
      const host = (() => {
        try {
          return new URL(to, BASE).host;
        } catch {
          return "unparseable";
        }
      })();
      assert.equal(host, new URL(BASE).host, `signed in and was sent to ${to}`);
    });
  }

  test("but an ordinary path still works", async () => {
    const to = await link("derik@aiwrangler.co", "/work");
    assert.match(to, /\/work$/);
  });
});

describe("three quiet holes closed", () => {
  test("brute force cannot mint a fresh throttle bucket per request", async () => {
    const tries = [];
    for (let i = 0; i < 8; i++) {
      tries.push(
        await fetch(`${BASE}/api/auth/operator/password`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            // A different caller-supplied leftmost hop every time. Keying on
            // this gave an attacker unlimited attempts at a single-factor
            // full-admin password.
            "X-Forwarded-For": `10.0.0.${i}, 203.0.113.7`,
          },
          body: JSON.stringify({ password: "definitely-wrong" }),
        }).then((r) => r.status),
      );
    }
    assert.ok(tries.includes(429), `never throttled across 8 tries: ${tries.join(",")}`);
  });

  test("a Vercel project we cannot see is not bindable", async () => {
    const res = await api("/api/customers/acme/vercel/projects", {
      method: "POST",
      body: JSON.stringify({ projectIds: ["prj_i_just_made_this_up"] }),
    });
    assert.ok(res.status >= 400, `an unverifiable project was bound: ${res.status}`);
    const [row] = await sql`
      SELECT count(*)::int AS n FROM bound_resources WHERE resource_id = 'prj_i_just_made_this_up'`;
    assert.equal(row.n, 0, "a wall cannot vouch for a row it never verified");
  });

  test("losing a binding race says what actually happened", async () => {
    const src = await import("node:fs/promises").then((fs) =>
      fs.readFile(new URL("../src/lib/binding.ts", import.meta.url), "utf8"),
    );
    // Drizzle puts the SQLSTATE on .cause, so reading .code off the top-level
    // error never matched and this refusal had never once run.
    assert.match(src, /pgCode\(e\) === "23505"/);
    assert.ok(!/\(e as \{ code\?: string \}\)\.code/.test(src), "the top-level .code read never matches");
  });
});

describe("a link that leaves the building cannot be aimed by its recipient", () => {
  test("a forged Host does not end up in the sign-in link", async () => {
    // The old code built the emailed link from x-forwarded-host, so a stranger
    // could ask for a link "for" an operator and have it point at their own
    // server, collecting the one-time token when the real operator clicked it.
    await sql`DELETE FROM login_links WHERE email = 'derik@aiwrangler.co'`;
    const res = await fetch(`${BASE}/api/auth/magic/start`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Forwarded-Host": "evil.tld",
        "X-Forwarded-Proto": "https",
      },
      body: JSON.stringify({ email: "derik@aiwrangler.co" }),
    });
    // Not asserting on the status: an earlier suite deliberately stores a bad
    // Resend key, so this route can legitimately answer 502 here. Mail delivery
    // is a different test; what matters is which origin built the link.
    assert.ok(res.status, "the route answered");
    const [link] = await sql`
      SELECT requested_from FROM login_links WHERE email = 'derik@aiwrangler.co' ORDER BY created_at DESC LIMIT 1`;
    if (link?.requested_from) {
      assert.ok(!/evil\.tld/.test(link.requested_from), `a forged host was recorded: ${link.requested_from}`);
    }
    // PUBLIC_ORIGIN is set here, so the header must be ignored outright rather
    // than merely deprioritised.
    const src = await import("node:fs/promises").then((fs) =>
      fs.readFile(new URL("../src/app/api/auth/magic/start/route.ts", import.meta.url), "utf8"),
    );
    assert.match(src, /trustedOrigin\(req\)/, "the sign-in link must use the origin that ignores headers");
    assert.ok(!/publicOrigin\(/.test(src), "publicOrigin falls back to the caller's Host header");
  });

  test("trustedOrigin refuses rather than trusting a header in production", async () => {
    const src = await import("node:fs/promises").then((fs) =>
      fs.readFile(new URL("../src/lib/origin.ts", import.meta.url), "utf8"),
    );
    assert.match(src, /throw new Error\(\s*\n?\s*"PUBLIC_ORIGIN is not set/);
  });
});

/**
 * The stop switch.
 *
 * A deployed worker idled on Opus every 120 seconds with no skip and no
 * per-pass check — a full session to be told "nothing to do", thirty times an
 * hour, $20 spent on nothing. The only way to stop it was to delete a Railway
 * service, which is the exact thing this OS exists to make unnecessary.
 */
describe("agents can be stopped from the OS", () => {
  let token = "";
  let jobId = "";
  before(async () => {
    await sql`DELETE FROM jobs WHERE title = 'Switch job'`;
    await sql`DELETE FROM people WHERE id = 'A_switch'`;
    await sql`UPDATE floor_switches SET on_at = NULL WHERE id = 'agents_paused'`;
    token = "wr_sess_switch0000000000000000000000";
    const { createHash } = await import("node:crypto");
    const hash = createHash("sha256").update(token).digest("hex");
    await sql`
      INSERT INTO people (id, name, handle, kind, customer_id, token_hash, status)
      VALUES ('A_switch','switch-bot','switch-bot','agent','acme',${hash},'connected')`;
    await sql`INSERT INTO person_tools (person_id, tool) VALUES ('A_switch','claim_job')`;
    const res = await api("/api/floor", {
      method: "POST",
      body: JSON.stringify({ title: "Switch job", customerId: "acme", budgetDollars: 5 }),
    });
    jobId = res.body.id;
  });
  after(async () => {
    await sql`UPDATE floor_switches SET on_at = NULL WHERE id = 'agents_paused'`;
  });

  const next = () =>
    fetch(`${BASE}/api/agent/next`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json());
  const claim = () =>
    fetch(`${BASE}/api/mcp`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
      },
      body: JSON.stringify({
        jsonrpc: "2.0", id: 1, method: "tools/call",
        params: { name: "claim_job", arguments: { job_id: jobId } },
      }),
    }).then((r) => r.text());

  test("running normally, there is work to take", async () => {
    const r = await next();
    assert.ok(r.job, "there is a queued job");
    assert.ok(!r.stop);
  });

  test("stopping tells the worker not to start a paid session", async () => {
    const res = await api("/api/agents/pause", {
      method: "POST",
      body: JSON.stringify({ paused: true, reason: "burning money on nothing" }),
    });
    assert.equal(res.status, 200);
    const r = await next();
    assert.equal(r.stop, true, "the cheapest possible answer, before any model runs");
    assert.match(r.reason, /burning money/);
  });

  test("and a worker on older code, which never asks, is refused at the claim", async () => {
    const out = await claim();
    assert.match(out, /refused/);
    assert.match(out, /paused/);
  });

  test("letting them run puts the work back", async () => {
    await api("/api/agents/pause", { method: "POST", body: JSON.stringify({ paused: false }) });
    const r = await next();
    assert.ok(r.job, "work is available again");
    assert.ok(!r.stop);
  });

  test("a stranger cannot stop the floor, or restart it", async () => {
    const saved = cookie;
    cookie = "";
    const res = await api("/api/agents/pause", { method: "POST", body: JSON.stringify({ paused: true }) });
    cookie = saved;
    assert.equal(res.status, 401);
  });
});

/**
 * The agent path now goes through the database wall, not just past it.
 *
 * HANDOFF calls row level security the third wall. No MCP tool had ever gone
 * through withCustomer, so on the agent path — the one an autonomous process
 * drives, unattended — that wall was not there at all. Scope was a TypeScript
 * check and nothing else.
 */
describe("tenant isolation reaches the agent path", () => {
  let token = "";
  let acmeJob = "";
  before(async () => {
    await sql`DELETE FROM jobs WHERE title = 'Wall job'`;
    await sql`DELETE FROM people WHERE id = 'A_wall'`;
    token = "wr_sess_wall000000000000000000000000";
    const { createHash } = await import("node:crypto");
    const hash = createHash("sha256").update(token).digest("hex");
    await sql`
      INSERT INTO people (id, name, handle, kind, customer_id, token_hash, status)
      VALUES ('A_wall','wall-bot','wall-bot','agent','acme',${hash},'connected')`;
    await sql`
      INSERT INTO person_tools (person_id, tool) VALUES
        ('A_wall','claim_job'), ('A_wall','post_step'), ('A_wall','read_project')`;
    const res = await api("/api/floor", {
      method: "POST",
      body: JSON.stringify({ title: "Wall job", customerId: "acme", budgetDollars: 5 }),
    });
    acmeJob = res.body.id;
  });

  const call = (name, args) =>
    fetch(`${BASE}/api/mcp`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
      },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name, arguments: args } }),
    }).then((r) => r.text());

  test("the scope gate asks the database, not only itself", async () => {
    const src = await import("node:fs/promises").then((fs) =>
      fs.readFile(new URL("../src/lib/mcp-tools.ts", import.meta.url), "utf8"),
    );
    // In jobInScope, so a tool added later inherits it rather than needing
    // somebody to remember.
    const gate = src.slice(src.indexOf("async function jobInScope"), src.indexOf("function mustHold"));
    assert.match(gate, /withCustomer\(/, "the gate must confirm against the tenant role");
  });

  test("writes from a tool land under that customer and nowhere else", async () => {
    await call("claim_job", { job_id: acmeJob });
    const out = await call("post_step", { job_id: acmeJob, kind: "think", text: "wall test step" });
    assert.match(out, /Posted/);

    // Visible to acme's tenant context...
    const mine = await sql`
      SELECT count(*)::int AS n FROM job_steps WHERE job_id = ${acmeJob} AND text = 'wall test step'`;
    assert.equal(mine[0].n, 1);

    // ...and invisible to globex's, enforced by Postgres rather than by a filter
    // we remembered to write.
    const theirs = await sql.begin(async (tx) => {
      await tx`SELECT set_config('app.customer_id', 'globex', true)`;
      await tx`SET LOCAL ROLE wrangler_tenant`;
      return tx`SELECT count(*)::int AS n FROM job_steps WHERE text = 'wall test step'`;
    });
    assert.equal(theirs[0].n, 0, "another tenant could see a step written for acme");
  });

  test("a cross-tenant write is refused by the database itself", async () => {
    await assert.rejects(
      sql.begin(async (tx) => {
        await tx`SELECT set_config('app.customer_id', 'acme', true)`;
        await tx`SET LOCAL ROLE wrangler_tenant`;
        return tx`
          INSERT INTO job_steps (job_id, customer_id, kind, text, actor)
          VALUES (${acmeJob}, 'globex', 'think', 'smuggled', 'attacker')`;
      }),
      /row-level security/i,
      "pinned to acme, a write naming globex has to be refused by Postgres",
    );
  });

  test("every tenant table with a customer_id is actually policed", async () => {
    const rows = await sql`
      SELECT c.relname
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relrowsecurity
        AND EXISTS (
          SELECT 1 FROM information_schema.columns col
          WHERE col.table_name = c.relname AND col.column_name = 'customer_id')
        AND NOT EXISTS (SELECT 1 FROM pg_policy p WHERE p.polrelid = c.oid)`;
    // RLS on with no policy denies everything, which is safe — but it is also a
    // table no tenant can ever read, so it is a decision worth being explicit
    // about rather than a thing that happened.
    const unpoliced = rows.map((r) => r.relname).sort();
    assert.deepEqual(
      unpoliced,
      ["call_log", "people", "person_scopes", "proposals", "threads"],
      "a customer-scoped table changed its policy status — decide which it is",
    );
  });
});

/**
 * Removing a client has to take effect now, not in a week.
 *
 * Sessions are signed cookies with a seven day life and no server-side state,
 * because the middleware runs at the edge and cannot reach Postgres. That
 * decides who is asking; it cannot decide whether they still work here. Deleting
 * a client, or moving them to a different customer, left their existing cookie
 * working — still pinned to the old customer — until it expired on its own.
 */
describe("a removed client stops working immediately", () => {
  let cookie2 = "";
  before(async () => {
    await sql`DELETE FROM people WHERE email = 'gone@acme.test'`;
    await sql`
      INSERT INTO people (id, name, handle, email, kind, customer_id)
      VALUES ('p-gone','Leaving Soon','leaving','gone@acme.test','client','acme')`;
    const raw = `wr_sess_gone_${Date.now()}`;
    const { createHash } = await import("node:crypto");
    const hash = createHash("sha256").update(raw).digest("hex");
    await sql`
      INSERT INTO login_links (token_hash, email, expires_at)
      VALUES (${hash}, 'gone@acme.test', now() + interval '15 minutes')`;
    const res = await fetch(`${BASE}/api/auth/magic/callback?token=${raw}`, { redirect: "manual" });
    const v = /wrangler_session=([^;]+)/.exec(res.headers.get("set-cookie") || "")?.[1];
    cookie2 = v ? `wrangler_session=${v}` : "";
  });

  const asThem = (path) =>
    fetch(`${BASE}${path}`, { headers: { cookie: cookie2, "Content-Type": "application/json" } });

  test("they can read their leads while they still work here", async () => {
    const res = await asThem("/api/client/leads");
    assert.equal(res.status, 200, "a current client should be able to read their own leads");
  });

  test("deleting them takes effect on the very next request", async () => {
    await sql`DELETE FROM people WHERE email = 'gone@acme.test'`;
    const res = await asThem("/api/client/leads");
    assert.equal(res.status, 403, "the cookie is still signed and still unexpired — the row is what decides");
  });

  test("and a revoked client is refused too", async () => {
    await sql`
      INSERT INTO people (id, name, handle, email, kind, customer_id, status)
      VALUES ('p-gone','Leaving Soon','leaving','gone@acme.test','client','acme','revoked')`;
    const res = await asThem("/api/client/leads");
    assert.equal(res.status, 403);
    await sql`DELETE FROM people WHERE email = 'gone@acme.test'`;
  });
});

/**
 * Two kinds of agent, and an honest map of what each can reach.
 *
 * A customer running four businesses arrives with a tool sprawl — two mailboxes,
 * three calendars, Teams, WhatsApp, Asana, SharePoint, an ERP. The first useful
 * artefact is the list, not the integrations, so a dependency is recorded
 * whether or not the OS can connect it. What must never happen is a tidy screen
 * implying an integration that does not exist.
 */
describe("customer copilots and their dependency map", () => {
  let copilot = "";
  before(async () => {
    await sql`DELETE FROM people WHERE handle IN ('test-copilot','test-builder')`;
  });

  test("a copilot is created against a customer, with a brief", async () => {
    const res = await api("/api/people", {
      method: "POST",
      body: JSON.stringify({
        name: "test-copilot", kind: "agent", agentKind: "copilot", customerId: "acme",
        brief: "Run four businesses out of one inbox.",
      }),
    });
    assert.equal(res.status, 200);
    copilot = res.body.id;
    const [row] = await sql`SELECT agent_kind, brief, role FROM people WHERE id = ${copilot}`;
    assert.equal(row.agent_kind, "copilot");
    assert.match(row.brief, /four businesses/);
  });

  test("a copilot is not given a push credential — it has no repo to push to", async () => {
    const grants = await sql`SELECT tool FROM person_tools WHERE person_id = ${copilot}`;
    const tools = grants.map((g) => g.tool);
    assert.ok(!tools.includes("checkout"), "a copilot must not be handed a repo credential");
  });

  test("a build agent still is", async () => {
    const res = await api("/api/people", {
      method: "POST",
      body: JSON.stringify({ name: "test-builder", kind: "agent", agentKind: "build", customerId: "acme" }),
    });
    const grants = await sql`SELECT tool FROM person_tools WHERE person_id = ${res.body.id}`;
    assert.ok(grants.map((g) => g.tool).includes("checkout"));
  });

  test("dependencies are recorded even where no connector exists", async () => {
    for (const [provider, label] of [["odoo", "Accounting"], ["m365_mail", "Synergy"], ["sms", "Personal"]]) {
      const res = await api(`/api/people/${copilot}/connections`, {
        method: "POST",
        body: JSON.stringify({ provider, label }),
      });
      assert.equal(res.status, 200, `${provider} should be recordable`);
    }
    const { body } = await api(`/api/people/${copilot}/connections`);
    assert.equal(body.connections.length, 3);
    // Every new dependency starts as needed. Nothing declares itself working.
    assert.ok(body.connections.every((c) => c.status === "needed"));
    const odoo = body.connections.find((c) => c.provider === "odoo");
    assert.equal(odoo.available, false, "we cannot talk to Odoo yet and must say so");
    assert.ok(odoo.buildNote, "and say what it would take");
  });

  test("an unknown system is refused rather than silently stored", async () => {
    const res = await api(`/api/people/${copilot}/connections`, {
      method: "POST",
      body: JSON.stringify({ provider: "telepathy" }),
    });
    assert.equal(res.status, 400);
  });

  test("a connector that does not exist cannot mark itself connected", async () => {
    const { body } = await api(`/api/people/${copilot}/connections`);
    const odoo = body.connections.find((c) => c.provider === "odoo");
    const res = await api(`/api/people/${copilot}/connections`, {
      method: "PATCH",
      body: JSON.stringify({ id: odoo.id, status: "connected" }),
    });
    assert.equal(res.status, 409, "this is how a screen starts lying about what works");
    assert.match(res.body.error, /no connector in the OS yet/);
  });

  test("but a human who wired it up by hand can say so, deliberately", async () => {
    const { body } = await api(`/api/people/${copilot}/connections`);
    const odoo = body.connections.find((c) => c.provider === "odoo");
    const res = await api(`/api/people/${copilot}/connections`, {
      method: "PATCH",
      body: JSON.stringify({ id: odoo.id, status: "connected", iConnectedItMyself: true }),
    });
    assert.equal(res.status, 200);
  });

  test("something the OS really can do needs no such claim", async () => {
    const { body } = await api(`/api/people/${copilot}/connections`);
    const smsRow = body.connections.find((c) => c.provider === "sms");
    assert.equal(smsRow.available, true);
    const res = await api(`/api/people/${copilot}/connections`, {
      method: "PATCH",
      body: JSON.stringify({ id: smsRow.id, status: "connected" }),
    });
    assert.equal(res.status, 200);
  });
});

/**
 * The self-test has to ask, not infer.
 *
 * "The key is set" and "the key works" are different claims. Every failure of
 * this project has lived in that gap — a Docker image missing a dependency, a
 * Railway field that did not exist, a worker idling on Opus. So the checks are
 * real requests, and a check must never report ok from an env var alone.
 */
describe("the self-test reports what vendors say, not what we assume", () => {
  test("with nothing configured, nothing claims to work", async () => {
    const { status, body } = await api("/api/selftest");
    assert.equal(status, 200);
    const byId = Object.fromEntries(body.checks.map((c) => [c.id, c]));
    // Postgres is genuinely reachable in the suite, so it is the one ok.
    assert.equal(byId.database.state, "ok");
    for (const id of ["anthropic", "stripe", "twilio", "github_app", "resend"]) {
      assert.notEqual(byId[id].state, "ok", `${id} has no credentials and must not report ok`);
      assert.ok(byId[id].costs, `${id} must say what stops working without it`);
    }
  });

  test("a stranger cannot read which vendors we use", async () => {
    const saved = cookie;
    cookie = "";
    const res = await api("/api/selftest");
    cookie = saved;
    assert.equal(res.status, 401);
  });

  test("no check has a side effect", async () => {
    const src = await import("node:fs/promises").then((fs) =>
      fs.readFile(new URL("../src/lib/selftest.ts", import.meta.url), "utf8"),
    );
    // A self-test that sends a text or charges a card is not a self-test.
    assert.ok(!/method:\s*"POST"/.test(src), "every check must be a read");
    assert.ok(!/Messages\.json|\/v1\/charges|\/pulls/.test(src), "no sending, charging or writing");
  });
});

/**
 * The customer's copilot chat.
 *
 * It answers from what it can see and holds no capability to do anything else.
 * That is the whole safety model rather than a limitation of it: once a copilot
 * reads a customer's mail it is reading text any stranger can write, and an
 * instruction hidden in an email is indistinguishable from an instruction from
 * the customer. You cannot prompt your way out of that — you can only make sure
 * the thing reading it cannot send, spend or delete.
 */
describe("a customer can talk to their own copilot and nobody else's", () => {
  let acmeCookie2 = "";
  let globexCookie2 = "";

  async function signIn(email) {
    const raw = `wr_sess_cp_${email.replace(/\W/g, "")}_${Date.now()}${Math.random()}`;
    const { createHash } = await import("node:crypto");
    const hash = createHash("sha256").update(raw).digest("hex");
    await sql`
      INSERT INTO login_links (token_hash, email, expires_at)
      VALUES (${hash}, ${email}, now() + interval '15 minutes')`;
    const res = await fetch(`${BASE}/api/auth/magic/callback?token=${raw}`, { redirect: "manual" });
    const v = /wrangler_session=([^;]+)/.exec(res.headers.get("set-cookie") || "")?.[1];
    return v ? `wrangler_session=${v}` : "";
  }
  const as = (c, path, init = {}) =>
    fetch(`${BASE}${path}`, { ...init, redirect: "manual", headers: { "Content-Type": "application/json", cookie: c, ...(init.headers || {}) } });

  before(async () => {
    await sql`DELETE FROM copilot_messages WHERE customer_id IN ('acme','globex')`;
    await sql`DELETE FROM people WHERE id IN ('cp-acme-user','cp-globex-user','A_cp_acme','A_cp_globex')`;
    await sql`
      INSERT INTO people (id, name, handle, email, kind, customer_id) VALUES
        ('cp-acme-user','Ann','ann','ann@acme.test','client','acme'),
        ('cp-globex-user','Gus','gus','gus@globex.test','client','globex')`;
    await sql`
      INSERT INTO people (id, name, handle, kind, customer_id, agent_kind, brief) VALUES
        ('A_cp_acme','acme-copilot','acme-copilot','agent','acme','copilot','Acme brief'),
        ('A_cp_globex','globex-copilot','globex-copilot','agent','globex','copilot','Globex brief')`;
    acmeCookie2 = await signIn("ann@acme.test");
    globexCookie2 = await signIn("gus@globex.test");
  });

  test("each customer is shown their own copilot", async () => {
    const mine = await (await as(acmeCookie2, "/api/client/copilot")).json();
    const theirs = await (await as(globexCookie2, "/api/client/copilot")).json();
    assert.equal(mine.copilot.name, "acme-copilot");
    assert.equal(theirs.copilot.name, "globex-copilot");
    // The lookup must filter in the query. Picking any person for the customer
    // and then asking whether it happened to be a copilot returns nothing
    // whenever a client user sorts first — which is most of the time.
    assert.ok(!JSON.stringify(mine).includes("globex"), "no trace of the other customer");
  });

  test("without a model key it says so instead of failing silently", async () => {
    const res = await as(acmeCookie2, "/api/client/copilot");
    const body = await res.json();
    assert.equal(body.ready, false);
    assert.match(body.why, /model key/);
    const post = await as(acmeCookie2, "/api/client/copilot", {
      method: "POST",
      body: JSON.stringify({ body: "who is waiting on me?" }),
    });
    assert.equal(post.status, 503, "a chat that cannot answer must refuse, not hang");
  });

  test("one customer cannot read another's conversation", async () => {
    await sql`
      INSERT INTO copilot_messages (id, customer_id, who, body)
      VALUES ('cm-secret','globex','them','the globex secret')`;
    const mine = await (await as(acmeCookie2, "/api/client/copilot")).json();
    assert.ok(!JSON.stringify(mine).includes("globex secret"), "RLS must hide the other thread");
  });

  test("an operator has no business on the client copilot route", async () => {
    const res = await api("/api/client/copilot");
    assert.equal(res.status, 403);
  });

  test("the copilot holds no capability to act", async () => {
    const src = await import("node:fs/promises").then((fs) =>
      fs.readFile(new URL("../src/lib/copilot.ts", import.meta.url), "utf8"),
    );
    // No tools, and nothing that sends. If a future edit gives it one, this
    // fails — which is the point, because the prompt alone protects nothing.
    for (const forbidden of ["sendSms", "placeCall", "openPullRequest", "depositCheckout", "tools:"]) {
      assert.ok(!src.includes(forbidden), `the copilot must not be able to ${forbidden}`);
    }
    // And it must tell the model that what it reads is data, not orders.
    assert.match(src, /data, not instructions/);
  });
});

/**
 * A customer-facing product needs a way to let a customer in.
 *
 * The client desk and the copilot both shipped before this did, which meant the
 * only way to create a client was raw SQL — a customer-facing product no
 * customer could reach.
 */
describe("inviting a customer, and removing them", () => {
  before(async () => {
    await sql`DELETE FROM people WHERE email IN ('invited@acme.test','dupe@acme.test')`;
  });

  test("a client can be created against a customer", async () => {
    const res = await api("/api/people", {
      method: "POST",
      body: JSON.stringify({ name: "Invited Person", email: "invited@acme.test", kind: "client", customerId: "acme" }),
    });
    assert.equal(res.status, 200);
    const [row] = await sql`SELECT kind, customer_id, email, role FROM people WHERE email = 'invited@acme.test'`;
    assert.equal(row.kind, "client");
    assert.equal(row.customer_id, "acme", "a client is pinned to a customer like an agent is");
  });

  test("a client is granted no MCP tools — they are a login, not a session", async () => {
    const [row] = await sql`SELECT id FROM people WHERE email = 'invited@acme.test'`;
    const tools = await sql`SELECT count(*)::int AS n FROM person_tools WHERE person_id = ${row.id}`;
    assert.equal(tools[0].n, 0);
  });

  test("without an address there is no way in, so it is refused", async () => {
    const res = await api("/api/people", {
      method: "POST",
      body: JSON.stringify({ name: "No Address", kind: "client", customerId: "acme" }),
    });
    assert.equal(res.status, 400);
    assert.match(res.body.error, /email/);
  });

  test("without a customer they would belong to nobody", async () => {
    const res = await api("/api/people", {
      method: "POST",
      body: JSON.stringify({ name: "Orphan", email: "dupe@acme.test", kind: "client" }),
    });
    assert.equal(res.status, 400);
  });

  test("one address cannot be two people", async () => {
    const res = await api("/api/people", {
      method: "POST",
      body: JSON.stringify({ name: "Twin", email: "invited@acme.test", kind: "client", customerId: "globex" }),
    });
    assert.equal(res.status, 409, "otherwise a magic link is ambiguous about who signed in");
  });

  test("they can sign in, and removing them ends it on the next request", async () => {
    const raw = `wr_sess_invited_${Date.now()}`;
    const { createHash } = await import("node:crypto");
    const hash = createHash("sha256").update(raw).digest("hex");
    await sql`
      INSERT INTO login_links (token_hash, email, expires_at)
      VALUES (${hash}, 'invited@acme.test', now() + interval '15 minutes')`;
    const res = await fetch(`${BASE}/api/auth/magic/callback?token=${raw}`, { redirect: "manual" });
    const v = /wrangler_session=([^;]+)/.exec(res.headers.get("set-cookie") || "")?.[1];
    const c = `wrangler_session=${v}`;
    assert.ok(v, "the invited client could sign in");

    const before = await fetch(`${BASE}/api/client/leads`, { headers: { cookie: c } });
    assert.equal(before.status, 200);

    const [row] = await sql`SELECT id FROM people WHERE email = 'invited@acme.test'`;
    const del = await api(`/api/people/${row.id}`, { method: "DELETE" });
    assert.equal(del.status, 200);

    const after = await fetch(`${BASE}/api/client/leads`, { headers: { cookie: c } });
    assert.equal(after.status, 403, "the cookie is still signed and unexpired — the row is what decides");
  });
});

/**
 * A customer can bring their own Anthropic key.
 *
 * Not their Claude subscription: `--bare`, which stops their own repository
 * injecting hooks and CLAUDE.md into the agent, never reads OAuth or the
 * keychain, so a subscription means giving up that wall — and a consumer
 * subscription is not priced for unattended automation resold as a service.
 *
 * A key also shrinks the blast radius. The agent container has arbitrary code
 * execution and used to hold the agency key, which bills for every customer. A
 * pass carrying one customer's key can leak one customer's key.
 */
describe("a customer's own model key", () => {
  test("a malformed key never reaches Anthropic", async () => {
    const res = await api("/api/customers/acme/anthropic", {
      method: "POST",
      body: JSON.stringify({ key: "hunter2" }),
    });
    assert.equal(res.status, 400);
    assert.match(res.body.error, /sk-ant-/);
  });

  test("a well-formed but rejected key is not stored", async () => {
    const res = await api("/api/customers/acme/anthropic", {
      method: "POST",
      body: JSON.stringify({ key: "sk-ant-deliberately-invalid" }),
    });
    assert.equal(res.status, 400);
    assert.match(res.body.error, /rejected/i);
    // A stored key that does not work is worse than none: every pass for that
    // customer fails on it instead of falling back.
    const [row] = await sql`
      SELECT count(*)::int AS n FROM connections WHERE customer_id = 'acme' AND provider = 'anthropic'`;
    assert.equal(row.n, 0);
  });

  test("the key itself is never returned by the API", async () => {
    const res = await api("/api/customers/acme/anthropic");
    assert.equal(res.status, 200);
    const said = JSON.stringify(res.body);
    assert.ok(!said.includes("sk-ant-"), "only a prefix, never the key");
  });

  test("with no customer key the agency pays, and the floor says so", async () => {
    await sql`DELETE FROM people WHERE id = 'A_bill'`;
    await sql`DELETE FROM jobs WHERE title = 'Billing job'`;
    const token = "wr_sess_billing00000000000000000000";
    const { createHash } = await import("node:crypto");
    const hash = createHash("sha256").update(token).digest("hex");
    await sql`
      INSERT INTO people (id, name, handle, kind, customer_id, token_hash, status)
      VALUES ('A_bill','bill-bot','bill-bot','agent','acme',${hash},'connected')`;
    await api("/api/floor", {
      method: "POST",
      body: JSON.stringify({ title: "Billing job", customerId: "acme", budgetDollars: 5 }),
    });
    const r = await fetch(`${BASE}/api/agent/next`, { headers: { Authorization: `Bearer ${token}` } });
    const body = await r.json();
    assert.equal(body.billedTo, "agency");
    assert.equal(body.apiKey, null, "no customer key means none is handed to the container");
  });

  test("a stranger cannot read whether a customer brought a key", async () => {
    const saved = cookie;
    cookie = "";
    const res = await api("/api/customers/acme/anthropic");
    cookie = saved;
    assert.equal(res.status, 401);
  });
});

/**
 * Importing a CRM export, from the OS.
 *
 * The first version of this was a CLI script needing a production connection
 * string in a shell — which is the thing this OS exists to avoid, and the
 * reason the first import landed in a local database instead of the real one.
 */
describe("a CRM export can be imported from the OS", () => {
  const csv = [
    "Record ID,record,Deal stage,Deal value,Deal MRR Value,Deal One-Time Value,Product,Deal owner",
    "aaa-1,Won Shop,Won 🎉,9000,9000,,AI Engineering,Van",
    "bbb-2,Talking Shop,Book Discovery Meeting,1500,150,,Creator Management,Van",
    "ccc-3,Offer Shop,Offer Sent,5000,,5000,Website,Bry",
    "ddd-4,A Partner,Partners,,,,,Van",
    "eee-5,,Lead,100,,,,Van",
  ].join("\n");

  before(async () => {
    await sql`DELETE FROM proposal_items WHERE proposal_id IN (SELECT id FROM proposals WHERE created_by='deals import')`;
    await sql`DELETE FROM proposals WHERE created_by = 'deals import'`;
    await sql`DELETE FROM agency_leads WHERE source = 'deals import'`;
    await sql`DELETE FROM memories WHERE source = 'deals import'`;
    await sql`DELETE FROM partners WHERE id LIKE 'P\\_%'`;
    await sql`DELETE FROM customers WHERE id = 'won-shop'`;
  });

  test("a preview writes nothing", async () => {
    const res = await api("/api/import/deals", { method: "POST", body: JSON.stringify({ csv }) });
    assert.equal(res.status, 200);
    assert.equal(res.body.wrote, null);
    const p = res.body.preview;
    assert.equal(p.customers, 1);
    // Five rows, one of them nameless: it is skipped, not guessed at, so two
    // leads rather than three.
    assert.equal(p.leads, 2);
    assert.equal(p.partners, 1);
    assert.equal(p.skipped.length, 1, "the nameless row is skipped, not guessed at");
    assert.equal(p.customers + p.leads + p.partners + p.skipped.length, p.total, "every row is accounted for");
    const [row] = await sql`SELECT count(*)::int AS n FROM agency_leads WHERE source = 'deals import'`;
    assert.equal(row.n, 0, "a preview that writes is not a preview");
  });

  test("a file that is not a deals export is refused with what it found", async () => {
    const res = await api("/api/import/deals", {
      method: "POST",
      body: JSON.stringify({ csv: "name,favourite colour\nBob,blue" }),
    });
    assert.equal(res.status, 400);
    assert.match(res.body.error, /does not look like a deals export/);
  });

  test("importing writes exactly what the preview said", async () => {
    const res = await api("/api/import/deals", { method: "POST", body: JSON.stringify({ csv, write: true }) });
    assert.equal(res.status, 200);
    assert.equal(res.body.wrote.customers, 1);
    assert.equal(res.body.wrote.leads, 2);
    assert.equal(res.body.wrote.partners, 1);

    const [won] = await sql`SELECT name FROM customers WHERE id = 'won-shop'`;
    assert.equal(won.name, "Won Shop", "a won deal is a customer");
    const stages = await sql`SELECT stage FROM agency_leads WHERE source = 'deals import' ORDER BY stage`;
    assert.deepEqual(stages.map((s) => s.stage), ["proposal", "talking"]);
  });

  test("a deal worth money gets a DRAFT proposal, never a sent one", async () => {
    const rows = await sql`SELECT status, once_cents, monthly_cents, token FROM proposals WHERE created_by = 'deals import'`;
    assert.ok(rows.length >= 2);
    for (const r of rows) {
      assert.equal(r.status, "draft");
      // A sent proposal has a live signable link. Importing a spreadsheet must
      // not create thirty of those.
      assert.equal(r.token, null);
    }
    const once = rows.find((r) => r.once_cents === 500000);
    assert.ok(once, "a one-time value became a one-time line");
  });

  test("no jobs are created — a spreadsheet row is not a decision to spend", async () => {
    const [row] = await sql`
      SELECT count(*)::int AS n FROM jobs WHERE customer_id = 'won-shop'`;
    assert.equal(row.n, 0);
  });

  test("running it again changes nothing", async () => {
    const before = await sql`SELECT count(*)::int AS n FROM agency_leads WHERE source = 'deals import'`;
    const res = await api("/api/import/deals", { method: "POST", body: JSON.stringify({ csv, write: true }) });
    assert.equal(res.body.wrote.leads, 0);
    assert.ok(res.body.wrote.already > 0);
    const after = await sql`SELECT count(*)::int AS n FROM agency_leads WHERE source = 'deals import'`;
    assert.equal(after[0].n, before[0].n);
  });

  test("a stranger cannot import anything", async () => {
    const saved = cookie;
    cookie = "";
    const res = await api("/api/import/deals", { method: "POST", body: JSON.stringify({ csv, write: true }) });
    cookie = saved;
    assert.equal(res.status, 401);
  });
});

/**
 * A CRM export is Excel more often than CSV — and frequently named .csv while
 * being Excel. That is exactly how the first import failed: the name said csv,
 * the bytes said PK, and the user got a screenful of zip mojibake.
 */
describe("the importer reads Excel, not just CSV", () => {
  // A minimal real .xlsx, built here rather than fetched, so the test proves the
  // reader against the actual format.
  let deflateRawSync;
  before(async () => {
    ({ deflateRawSync } = await import("node:zlib"));
  });

  function makeXlsx(rows) {
    const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const col = (n) => {
      let s = "";
      for (n += 1; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s;
      return s;
    };
    const sheet =
      `<?xml version="1.0"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>` +
      rows
        .map(
          (r, i) =>
            `<row r="${i + 1}">` +
            r.map((c, j) => `<c r="${col(j)}${i + 1}" t="inlineStr"><is><t>${esc(c)}</t></is></c>`).join("") +
            `</row>`,
        )
        .join("") +
      `</sheetData></worksheet>`;

    const files = [["xl/worksheets/sheet1.xml", Buffer.from(sheet, "utf8")]];
    const locals = [];
    const central = [];
    let offset = 0;
    for (const [name, content] of files) {
      const body = deflateRawSync(content);
      const nameBuf = Buffer.from(name, "utf8");
      const lh = Buffer.alloc(30);
      lh.writeUInt32LE(0x04034b50, 0); lh.writeUInt16LE(20, 4); lh.writeUInt16LE(8, 8);
      lh.writeUInt32LE(0, 14); lh.writeUInt32LE(body.length, 18);
      lh.writeUInt32LE(content.length, 22); lh.writeUInt16LE(nameBuf.length, 26);
      locals.push(lh, nameBuf, body);
      const ch = Buffer.alloc(46);
      ch.writeUInt32LE(0x02014b50, 0); ch.writeUInt16LE(20, 6); ch.writeUInt16LE(8, 10);
      ch.writeUInt32LE(body.length, 20); ch.writeUInt32LE(content.length, 24);
      ch.writeUInt16LE(nameBuf.length, 28); ch.writeUInt32LE(offset, 42);
      central.push(ch, nameBuf);
      offset += lh.length + nameBuf.length + body.length;
    }
    const localBuf = Buffer.concat(locals);
    const centralBuf = Buffer.concat(central);
    const eocd = Buffer.alloc(22);
    eocd.writeUInt32LE(0x06054b50, 0);
    eocd.writeUInt16LE(files.length, 8); eocd.writeUInt16LE(files.length, 10);
    eocd.writeUInt32LE(centralBuf.length, 12); eocd.writeUInt32LE(localBuf.length, 16);
    return Buffer.concat([localBuf, centralBuf, eocd]);
  }

  const rows = [
    ["Record ID", "record", "Deal stage", "Deal value", "Deal MRR Value", "Product"],
    ["x-1", "Excel Won Co", "Won 🎉", "4000", "4000", "AI Engineering"],
    ["x-2", "Excel Lead Co", "Offer Sent", "2000", "", "Website"],
  ];

  before(async () => {
    await sql`DELETE FROM agency_leads WHERE id LIKE 'L\\_x-%'`;
    await sql`DELETE FROM customers WHERE id = 'excel-won-co'`;
  });

  test("an .xlsx is detected by its bytes and read", async () => {
    const b64 = makeXlsx(rows).toString("base64");
    const res = await api("/api/import/deals", { method: "POST", body: JSON.stringify({ csvB64: b64 }) });
    assert.equal(res.status, 200, `preview failed: ${JSON.stringify(res.body).slice(0, 200)}`);
    assert.equal(res.body.preview.total, 2);
    assert.equal(res.body.preview.customers, 1);
    assert.equal(res.body.preview.leads, 1);
  });

  test("a plain CSV still works through the same field", async () => {
    const csv = rows.map((r) => r.join(",")).join("\n");
    const b64 = Buffer.from(csv, "utf8").toString("base64");
    const res = await api("/api/import/deals", { method: "POST", body: JSON.stringify({ csvB64: b64 }) });
    assert.equal(res.status, 200);
    assert.equal(res.body.preview.total, 2);
  });

  test("a file with no rows says so", async () => {
    const b64 = Buffer.from("just some words, not a spreadsheet", "utf8").toString("base64");
    const res = await api("/api/import/deals", { method: "POST", body: JSON.stringify({ csvB64: b64 }) });
    assert.equal(res.status, 400);
    assert.match(res.body.error, /no rows/);
  });

  test("a real CSV of the wrong shape is refused with the columns it found", async () => {
    const b64 = Buffer.from("name,favourite colour\nBob,blue\nAnn,red", "utf8").toString("base64");
    const res = await api("/api/import/deals", { method: "POST", body: JSON.stringify({ csvB64: b64 }) });
    assert.equal(res.status, 400);
    assert.match(res.body.error, /does not look like a deals export/);
    // Naming what it saw is the difference between a dead end and a next step.
    assert.match(res.body.error, /favourite colour/);
  });
});

/**
 * The layer above the agency.
 *
 * Everything agency-level — leads, proposals, partners, customers — used to sit
 * in one pool because there was exactly one agency. That is correct for one and
 * a total leak for two, so the wall has to exist before the second account signs
 * up rather than after.
 */
describe("one agency cannot see another's pipeline", () => {
  let rivalCookie = "";

  before(async () => {
    await sql`DELETE FROM agency_leads WHERE company IN ('House Lead','Rival Lead')`;
    await sql`DELETE FROM people WHERE email = 'boss@rival.test'`;
    await sql`DELETE FROM tenants WHERE id = 'rival-agency'`;
    await sql`
      INSERT INTO tenants (id, name, can_build, plan)
      VALUES ('rival-agency','Rival Agency', false, 'crm')`;
    await sql`
      INSERT INTO people (id, name, handle, email, kind, tenant_id, tenant_role)
      VALUES ('U_rival','Rival Boss','rivalboss','boss@rival.test','operator','rival-agency','admin')`;

    const raw = `wr_sess_rival_${Date.now()}`;
    const { createHash } = await import("node:crypto");
    const hash = createHash("sha256").update(raw).digest("hex");
    await sql`
      INSERT INTO login_links (token_hash, email, expires_at)
      VALUES (${hash}, 'boss@rival.test', now() + interval '15 minutes')`;
    const res = await fetch(`${BASE}/api/auth/magic/callback?token=${raw}`, { redirect: "manual" });
    const v = /wrangler_session=([^;]+)/.exec(res.headers.get("set-cookie") || "")?.[1];
    rivalCookie = v ? `wrangler_session=${v}` : "";
  });

  const asRival = (path, init = {}) =>
    fetch(`${BASE}${path}`, {
      ...init,
      redirect: "manual",
      headers: { "Content-Type": "application/json", cookie: rivalCookie, ...(init.headers || {}) },
    });

  test("a tenant's own staff can sign in at all", async () => {
    assert.ok(rivalCookie, "an operator with a people row must be able to sign in, not only a client");
  });

  test("the house creates a lead; the rival cannot see it", async () => {
    const mine = await api("/api/leads", {
      method: "POST",
      body: JSON.stringify({ company: "House Lead", stage: "new", value: 1000 }),
    });
    assert.equal(mine.status, 200);

    const theirs = await (await asRival("/api/leads")).json();
    const names = (theirs.leads ?? []).map((l) => l.company);
    assert.ok(!names.includes("House Lead"), "another agency's pipeline must be invisible");
  });

  test("and the rival's lead is invisible to the house", async () => {
    const made = await asRival("/api/leads", {
      method: "POST",
      body: JSON.stringify({ company: "Rival Lead", stage: "new", value: 500 }),
    });
    assert.equal(made.status, 200);
    const [row] = await sql`SELECT tenant_id FROM agency_leads WHERE company = 'Rival Lead'`;
    assert.equal(row.tenant_id, "rival-agency", "a write is stamped from the session, never from the body");

    const mine = await api("/api/leads");
    const names = mine.body.leads.map((l) => l.company);
    assert.ok(!names.includes("Rival Lead"));
  });

  test("a CRM-only tenant is refused the build side outright", async () => {
    const res = await asRival("/api/floor");
    assert.ok(res.status === 401 || res.status === 403, `expected a refusal, got ${res.status}`);
  });

  test("the house still has the build side", async () => {
    const res = await api("/api/floor");
    assert.equal(res.status, 200);
  });

  test("a suspended tenant stops working immediately", async () => {
    await sql`UPDATE tenants SET status = 'suspended' WHERE id = 'rival-agency'`;
    const res = await asRival("/api/leads");
    assert.equal(res.status, 401, "a suspended account stops now, not when its cookie expires");
    await sql`UPDATE tenants SET status = 'active' WHERE id = 'rival-agency'`;
  });
});

/**
 * The owner's panel.
 *
 * Creating agency accounts belongs to whoever owns the product. An account that
 * could list the others is not an account, it is a shared database with a
 * filter on it.
 */
describe("only the house administers the platform", () => {
  let rival = "";
  before(async () => {
    await sql`DELETE FROM people WHERE email IN ('boss@second.test','dupe@second.test')`;
    await sql`DELETE FROM tenants WHERE id IN ('second-agency','third-agency')`;
    await sql`INSERT INTO tenants (id, name, can_build) VALUES ('second-agency','Second Agency', false)`;
    await sql`
      INSERT INTO people (id, name, handle, email, kind, tenant_id, tenant_role)
      VALUES ('U_second','Second Boss','secondboss','boss@second.test','operator','second-agency','admin')`;
    const raw = `wr_sess_second_${Date.now()}`;
    const { createHash } = await import("node:crypto");
    const hash = createHash("sha256").update(raw).digest("hex");
    await sql`
      INSERT INTO login_links (token_hash, email, expires_at)
      VALUES (${hash}, 'boss@second.test', now() + interval '15 minutes')`;
    const res = await fetch(`${BASE}/api/auth/magic/callback?token=${raw}`, { redirect: "manual" });
    const v = /wrangler_session=([^;]+)/.exec(res.headers.get("set-cookie") || "")?.[1];
    rival = v ? `wrangler_session=${v}` : "";
  });

  const asRival = (path, init = {}) =>
    fetch(`${BASE}${path}`, {
      ...init, redirect: "manual",
      headers: { "Content-Type": "application/json", cookie: rival, ...(init.headers || {}) },
    });

  test("the house sees every account", async () => {
    const { status, body } = await api("/api/tenants");
    assert.equal(status, 200);
    const ids = body.tenants.map((t) => t.id);
    assert.ok(ids.includes("ai-wrangler"));
    assert.ok(ids.includes("second-agency"));
  });

  test("an agency admin cannot even see that other accounts exist", async () => {
    const res = await asRival("/api/tenants");
    assert.equal(res.status, 403);
  });

  test("and cannot open one", async () => {
    const res = await asRival("/api/tenants", {
      method: "POST",
      body: JSON.stringify({ name: "Third Agency", adminEmail: "x@third.test" }),
    });
    assert.equal(res.status, 403);
    const [row] = await sql`SELECT count(*)::int AS n FROM tenants WHERE id = 'third-agency'`;
    assert.equal(row.n, 0);
  });

  test("nor give themselves the build side", async () => {
    const res = await asRival("/api/tenants", {
      method: "PATCH",
      body: JSON.stringify({ id: "second-agency", canBuild: true }),
    });
    assert.equal(res.status, 403);
    const [row] = await sql`SELECT can_build FROM tenants WHERE id = 'second-agency'`;
    assert.equal(row.can_build, false, "an account that can grant itself capabilities has none");
  });

  test("a new account starts without the build side unless asked", async () => {
    const res = await api("/api/tenants", {
      method: "POST",
      body: JSON.stringify({ name: "Third Agency", adminName: "Third Boss", adminEmail: "boss@third.test" }),
    });
    assert.equal(res.status, 200);
    const [t] = await sql`SELECT can_build, status FROM tenants WHERE id = 'third-agency'`;
    assert.equal(t.can_build, false, "the build half is sold, not defaulted on");
    assert.equal(t.status, "active");
    // And their admin exists, in their account, as an admin of it and not of ours.
    const [p] = await sql`SELECT tenant_id, tenant_role, kind FROM people WHERE email = 'boss@third.test'`;
    assert.equal(p.tenant_id, "third-agency");
    assert.equal(p.tenant_role, "admin");
    assert.equal(p.kind, "operator");
  });

  test("an address already on the platform cannot start a second account", async () => {
    const res = await api("/api/tenants", {
      method: "POST",
      body: JSON.stringify({ name: "Fourth Agency", adminEmail: "boss@third.test" }),
    });
    assert.equal(res.status, 409, "a magic link has to know who just signed in");
  });

  test("the house cannot lock itself out of its own product", async () => {
    for (const body of [{ status: "suspended" }, { canBuild: false }]) {
      const res = await api("/api/tenants", { method: "PATCH", body: JSON.stringify({ id: "ai-wrangler", ...body }) });
      assert.equal(res.status, 400);
    }
    const [t] = await sql`SELECT can_build, status FROM tenants WHERE id = 'ai-wrangler'`;
    assert.equal(t.can_build, true);
    assert.equal(t.status, "active");
  });
});

/**
 * Van's own Claude Code, acting across the platform.
 *
 * The build tools work one customer's repository; these work the agency itself.
 * What makes them safe to grant is that every query is pinned to the tenant on
 * the person's row — a tool that accepted an account id would be a tool for
 * reading somebody else's business.
 */
describe("the platform over MCP", () => {
  const token = "wr_sess_platform000000000000000000";
  let leadId = "";

  before(async () => {
    await sql`DELETE FROM people WHERE id = 'U_mcpvan'`;
    await sql`DELETE FROM agency_leads WHERE company IN ('MCP Test Shop','Other Tenant Shop')`;
    await sql`DELETE FROM tenants WHERE id = 'other-agency'`;
    await sql`INSERT INTO tenants (id, name, can_build) VALUES ('other-agency','Other Agency', false)`;
    const { createHash } = await import("node:crypto");
    const hash = createHash("sha256").update(token).digest("hex");
    await sql`
      INSERT INTO people (id, name, handle, email, kind, tenant_id, tenant_role, token_hash, status)
      VALUES ('U_mcpvan','MCP Van','mcpvan','mcpvan@aiwrangler.co','operator','ai-wrangler','owner',${hash},'connected')`;
    await sql`
      INSERT INTO person_tools (person_id, tool) VALUES
        ('U_mcpvan','list_leads'),('U_mcpvan','read_lead'),('U_mcpvan','add_lead'),
        ('U_mcpvan','move_lead'),('U_mcpvan','draft_proposal')`;
    // A lead belonging to a different agency entirely.
    await sql`
      INSERT INTO agency_leads (id, tenant_id, company, stage, value_cents)
      VALUES ('L_other','other-agency','Other Tenant Shop','new',999)`;
  });

  const call = async (name, args = {}, tok = token) => {
    const r = await fetch(`${BASE}/api/mcp`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tok}`,
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
      },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name, arguments: args } }),
    });
    const d = await r.json();
    return { text: d.result?.content?.[0]?.text ?? "", isError: Boolean(d.result?.isError) };
  };

  test("only granted tools are offered", async () => {
    const r = await fetch(`${BASE}/api/mcp`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Accept: "application/json, text/event-stream" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" }),
    });
    const names = (await r.json()).result.tools.map((t) => t.name);
    assert.ok(names.includes("list_leads"));
    assert.ok(!names.includes("list_customers"), "not granted, so not offered");
  });

  test("a tool that was not granted is refused even if it exists", async () => {
    const out = await call("list_customers");
    assert.ok(out.isError);
    assert.match(out.text, /not granted/);
  });

  test("it can add a lead, and the row is stamped with the session's tenant", async () => {
    const out = await call("add_lead", { company: "MCP Test Shop", contact: "Ray", value_monthly: "1200" });
    assert.ok(!out.isError, out.text);
    const [row] = await sql`SELECT id, tenant_id, value_cents, stage FROM agency_leads WHERE company = 'MCP Test Shop'`;
    leadId = row.id;
    assert.equal(row.tenant_id, "ai-wrangler", "never from an argument");
    assert.equal(row.value_cents, 120000);
    assert.equal(row.stage, "new");
  });

  test("a proposal drafted over MCP is a draft with no live link", async () => {
    const out = await call("draft_proposal", {
      lead_id: leadId, title: "Rebuild", once_dollars: "6500", monthly_dollars: "1200",
    });
    assert.ok(!out.isError, out.text);
    const [q] = await sql`SELECT status, token, once_cents, monthly_cents FROM proposals WHERE lead_id = ${leadId}`;
    assert.equal(q.status, "draft");
    // Sending is a human decision, because a sent proposal is signable.
    assert.equal(q.token, null);
    assert.equal(q.once_cents, 650000);
  });

  test("another agency's lead is refused exactly like one that does not exist", async () => {
    const theirs = await call("read_lead", { lead_id: "L_other" });
    const missing = await call("read_lead", { lead_id: "L_does_not_exist" });
    assert.ok(theirs.isError && missing.isError);
    // Byte-identical but for the id, so a pipeline cannot be enumerated by
    // watching which error comes back.
    assert.equal(theirs.text.replace("L_other", "X"), missing.text.replace("L_does_not_exist", "X"));
  });

  test("nor can it be moved, or listed", async () => {
    const moved = await call("move_lead", { lead_id: "L_other", stage: "won" });
    assert.ok(moved.isError);
    const [row] = await sql`SELECT stage FROM agency_leads WHERE id = 'L_other'`;
    assert.equal(row.stage, "new", "another agency's pipeline must not move");
    const listed = await call("list_leads", { q: "Other Tenant" });
    assert.ok(!listed.text.includes("Other Tenant Shop"));
  });

  test("a build agent is refused the platform tools outright", async () => {
    const agentTok = "wr_sess_agentnoplatform0000000000000";
    const { createHash } = await import("node:crypto");
    const hash = createHash("sha256").update(agentTok).digest("hex");
    await sql`DELETE FROM people WHERE id = 'A_noplat'`;
    await sql`
      INSERT INTO people (id, name, handle, kind, customer_id, tenant_id, token_hash, status)
      VALUES ('A_noplat','noplat','noplat','agent','acme','ai-wrangler',${hash},'connected')`;
    await sql`INSERT INTO person_tools (person_id, tool) VALUES ('A_noplat','list_leads')`;
    const out = await call("list_leads", {}, agentTok);
    assert.ok(out.isError);
    assert.match(out.text, /for people, not for build agents/);
  });
});

/**
 * What an agent reports about itself, from wherever it runs.
 *
 * A provider's uptime API says the box is powered on. That is the wrong signal:
 * during the $20 incident the box was on the whole time, idling on Opus thirty
 * times an hour, and any uptime dashboard would have been green throughout. So
 * the worker reports in, outbound, and carries what "working" means.
 */
describe("agents report their own health", () => {
  const token = "wr_sess_hb0000000000000000000000000";
  before(async () => {
    await sql`DELETE FROM agent_health WHERE person_id = 'A_hb'`;
    await sql`DELETE FROM people WHERE id = 'A_hb'`;
    const { createHash } = await import("node:crypto");
    const hash = createHash("sha256").update(token).digest("hex");
    await sql`
      INSERT INTO people (id, name, handle, kind, customer_id, tenant_id, token_hash, status, agent_kind)
      VALUES ('A_hb','box-one','box-one','agent','acme','ai-wrangler',${hash},'connected','build')`;
  });

  const beat = (body) =>
    fetch(`${BASE}/api/agent/heartbeat`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

  test("a worker can report from any host, with no inbound port", async () => {
    const res = await beat({
      host: "srv-vps-1", cliVersion: "2.1.236", uptimeS: 900, passes: 3,
      state: "ok", lastCostUsd: 0.21, spentUsd: 1.4, ceilingUsd: 25, bare: true, resuming: true,
      detail: "J1 · sonnet",
    });
    assert.equal(res.status, 200);
    const { body } = await api("/api/agent/heartbeat");
    const me = body.agents.find((a) => a.id === "A_hb");
    assert.equal(me.state, "ok");
    assert.equal(me.host, "srv-vps-1");
    assert.equal(me.passes, 3);
    assert.equal(me.spentUsd, 1.4);
  });

  test("silence is its own state, not a stale ok", async () => {
    await sql`UPDATE agent_health SET at = now() - interval '2 hours' WHERE person_id = 'A_hb'`;
    const { body } = await api("/api/agent/heartbeat");
    const me = body.agents.find((a) => a.id === "A_hb");
    // The last report said ok. That was two hours ago, and a box that has
    // stopped talking is the thing you most need to see.
    assert.equal(me.state, "silent");
    assert.ok(me.secondsAgo > 3600);
  });

  test("an agent that never reported reads as never, not as fine", async () => {
    await sql`DELETE FROM agent_health WHERE person_id = 'A_hb'`;
    const { body } = await api("/api/agent/heartbeat");
    const me = body.agents.find((a) => a.id === "A_hb");
    assert.equal(me.state, "never");
  });

  test("only an agent may report agent health", async () => {
    const human = "wr_sess_hbhuman00000000000000000000";
    const { createHash } = await import("node:crypto");
    const hash = createHash("sha256").update(human).digest("hex");
    await sql`DELETE FROM people WHERE id = 'U_hb'`;
    await sql`
      INSERT INTO people (id, name, handle, kind, tenant_id, token_hash, status)
      VALUES ('U_hb','A Human','ahuman','operator','ai-wrangler',${hash},'connected')`;
    const res = await fetch(`${BASE}/api/agent/heartbeat`, {
      method: "POST",
      headers: { Authorization: `Bearer ${human}`, "Content-Type": "application/json" },
      body: JSON.stringify({ state: "ok" }),
    });
    assert.equal(res.status, 403);
  });

  test("nonsense numbers are dropped rather than stored", async () => {
    await beat({ state: "ok", uptimeS: -5, spentUsd: "banana", passes: 99999999999 });
    const [row] = await sql`SELECT uptime_s, spent_usd, passes FROM agent_health WHERE person_id = 'A_hb'`;
    assert.equal(row.uptime_s, null);
    assert.equal(Number(row.spent_usd), 0);
    assert.equal(row.passes, 0);
  });

  test("a CRM-only tenant has no fleet to look at", async () => {
    await sql`DELETE FROM tenants WHERE id = 'nofleet'`;
    await sql`INSERT INTO tenants (id, name, can_build) VALUES ('nofleet','No Fleet', false)`;
    await sql`DELETE FROM people WHERE email = 'nf@nofleet.test'`;
    await sql`
      INSERT INTO people (id, name, handle, email, kind, tenant_id, tenant_role)
      VALUES ('U_nf','NF','nf','nf@nofleet.test','operator','nofleet','admin')`;
    const raw = `wr_sess_nf_${Date.now()}`;
    const { createHash } = await import("node:crypto");
    const hash = createHash("sha256").update(raw).digest("hex");
    await sql`
      INSERT INTO login_links (token_hash, email, expires_at)
      VALUES (${hash}, 'nf@nofleet.test', now() + interval '15 minutes')`;
    const login = await fetch(`${BASE}/api/auth/magic/callback?token=${raw}`, { redirect: "manual" });
    const v = /wrangler_session=([^;]+)/.exec(login.headers.get("set-cookie") || "")?.[1];
    const res = await fetch(`${BASE}/api/agent/heartbeat`, { headers: { cookie: `wrangler_session=${v}` } });
    assert.equal(res.status, 403, "the fleet is part of the build half");
  });
});

describe("the feedback widget stays on our side of the product", () => {
  test("it is inside the agency shell, not the layout", async () => {
    const shell = await import("node:fs/promises").then((fs) =>
      fs.readFile(new URL("../src/components/os/Shell.tsx", import.meta.url), "utf8"),
    );
    const layout = await import("node:fs/promises").then((fs) =>
      fs.readFile(new URL("../src/app/layout.tsx", import.meta.url), "utf8"),
    );
    assert.match(shell, /markerConfig/, "the widget lives in the shell");
    // In the layout it would render on every page, including the one where a
    // lead types their name to sign an agreement.
    assert.ok(!/markerConfig/.test(layout), "not in the root layout");

    // And it must sit after the bare early-return, so client and signing pages
    // never reach it.
    const bareReturn = shell.indexOf("if (bare) {");
    const widget = shell.indexOf("markerConfig");
    assert.ok(bareReturn > -1 && widget > bareReturn, "the bare branch returns before the widget");
  });
});

/**
 * Maintaining a client's agent without a terminal.
 *
 * A managed agent runs on somebody else's behalf, on a box the client never
 * sees, and keeping it alive is our job. The verbs are a fixed set on purpose:
 * a channel that can run arbitrary shell on a client's machine is a backdoor
 * that keeps a nice log.
 */
describe("a client's agent can be maintained from the OS", () => {
  const token = "wr_sess_maint00000000000000000000000";
  before(async () => {
    await sql`DELETE FROM agent_commands WHERE person_id IN ('A_maint','A_other')`;
    await sql`DELETE FROM people WHERE id IN ('A_maint','A_other')`;
    const { createHash } = await import("node:crypto");
    const hash = createHash("sha256").update(token).digest("hex");
    await sql`
      INSERT INTO people (id, name, handle, kind, customer_id, tenant_id, token_hash, status, agent_kind)
      VALUES ('A_maint','maint-box','maint-box','agent','acme','ai-wrangler',${hash},'connected','copilot')`;
    await sql`
      INSERT INTO people (id, name, handle, kind, customer_id, tenant_id, status, agent_kind)
      VALUES ('A_other','other-box','other-box','agent','globex','ai-wrangler','connected','build')`;
  });

  const queue = (command, args) =>
    api("/api/agent/commands", { method: "POST", body: JSON.stringify({ agent: "A_maint", command, args }) });
  const collect = () =>
    fetch(`${BASE}/api/agent/commands`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json());

  test("only the listed verbs are accepted", async () => {
    const ok = await queue("restart");
    assert.equal(ok.status, 200);
    for (const bad of ["rm -rf /", "exec", "; reboot", ""]) {
      const res = await queue(bad);
      assert.equal(res.status, 400, `"${bad}" must not be queueable`);
    }
  });

  test("the worker collects them once, so a second worker does not repeat them", async () => {
    const first = await collect();
    assert.ok(first.commands.length >= 1);
    const second = await collect();
    assert.equal(second.commands.length, 0, "taken means taken");
  });

  test("it reports how it went, and only on its own commands", async () => {
    await queue("diagnose");
    const [cmd] = (await collect()).commands;
    const mine = await fetch(`${BASE}/api/agent/commands`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ id: cmd.id, ok: true, result: "up 900s" }),
    });
    assert.equal(mine.status, 200);

    await sql`
      INSERT INTO agent_commands (id, person_id, command, issued_by)
      VALUES ('X_notmine','A_other','restart','someone')`;
    const theirs = await fetch(`${BASE}/api/agent/commands`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ id: "X_notmine", ok: true, result: "not mine" }),
    });
    assert.equal(theirs.status, 404);
    const [row] = await sql`SELECT status FROM agent_commands WHERE id = 'X_notmine'`;
    assert.equal(row.status, "queued", "another agent's queue must not be answerable");
  });

  test("an update version is a version, not a command line", async () => {
    // The worker only ever runs `npm install -g @anthropic-ai/claude-code@<arg>`,
    // and it checks the arg against a semver pattern first — a version taken on
    // trust is shell injection with extra steps, on a client's machine.
    const worker = await import("node:fs/promises").then((fs) =>
      fs.readFile(new URL("../../worker/run.mjs", import.meta.url), "utf8"),
    );
    assert.match(worker, /SEMVER\s*=\s*\/\^\[0-9\]\+\\\.\[0-9\]\+\\\.\[0-9\]\+\$\//);
    assert.match(worker, /SEMVER\.test\(want\)/);
    // And nothing anywhere runs a shell string from a command.
    assert.ok(!/exec\(|execSync\(/.test(worker), "no shell string execution in the worker");
  });

  test("an agent on another account cannot be commanded", async () => {
    await sql`DELETE FROM tenants WHERE id = 'notmine-agency'`;
    await sql`INSERT INTO tenants (id, name, can_build) VALUES ('notmine-agency','Not Mine', true)`;
    await sql`UPDATE people SET tenant_id = 'notmine-agency' WHERE id = 'A_other'`;
    const res = await api("/api/agent/commands", {
      method: "POST",
      body: JSON.stringify({ agent: "A_other", command: "restart" }),
    });
    assert.equal(res.status, 404, "same refusal as one that does not exist");
    await sql`UPDATE people SET tenant_id = 'ai-wrangler' WHERE id = 'A_other'`;
  });
});
