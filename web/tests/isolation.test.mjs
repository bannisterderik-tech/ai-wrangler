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
