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
