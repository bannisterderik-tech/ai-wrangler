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
