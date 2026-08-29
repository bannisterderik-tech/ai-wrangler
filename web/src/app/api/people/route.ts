import { NextResponse } from "next/server";
import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { fail, guardTenant, operator } from "@/lib/api";
import { customerInTenant } from "@/lib/tenant-scope";
import { audit, jobs, people, personScopes, personTools } from "@/lib/schema";
import { TOOLS } from "@/lib/mcp-tools";
import { PLATFORM_TOOLS } from "@/lib/mcp-platform";
import { slug } from "@/lib/crypto";
import { isAgentKind } from "@/lib/connectors";

/** Everyone on the floor, with what their session is allowed to touch. */
export async function GET() {
  const t = await guardTenant();
  if ("error" in t) return t.error;

  const [rows, scopes, tools, counts] = await Promise.all([
    // Operators and agents only. A client user is a person row too, but they
    // sign in to their own CRM and have no MCP session — listing them here
    // invites minting them a token that could never do anything.
    db
      .select()
      .from(people)
      .where(and(eq(people.tenantId, t.tenantId), inArray(people.kind, ["operator", "agent"])))
      .orderBy(asc(people.createdAt)),
    db.select().from(personScopes),
    db.select().from(personTools),
    db
      .select({ ownerId: jobs.ownerId, n: sql<number>`count(*)::int` })
      .from(jobs)
      .groupBy(jobs.ownerId),
  ]);

  return NextResponse.json({
    // Both sets, so the grants screen can offer the platform tools too. What a
    // session may actually call is still its own grant list.
    tools: [...TOOLS, ...PLATFORM_TOOLS].map((t) => ({ name: t.name, description: t.description })),
    people: rows.map((p) => ({
      id: p.id,
      name: p.name,
      handle: p.handle,
      kind: p.kind,
      agentKind: p.agentKind ?? (p.kind === "agent" ? "build" : null),
      brief: p.brief,
      customerId: p.customerId,
      role: p.role,
      approver: p.approver,
      machine: p.machine,
      status: p.status,
      clientVersion: p.clientVersion,
      connectedAt: p.connectedAt,
      // Never the token itself — only enough to recognise which one is installed.
      tokenPrefix: p.tokenPrefix,
      hasToken: Boolean(p.tokenHash),
      // An agent's scope is its column. Nobody maintains a list for it.
      scope: p.kind === "agent" ? (p.customerId ? [p.customerId] : []) : scopes.filter((s) => s.personId === p.id).map((s) => s.customerId),
      grants: tools.filter((t) => t.personId === p.id).map((t) => t.tool),
      claimed: counts.find((c) => c.ownerId === p.id)?.n ?? 0,
    })),
  });
}

/**
 * Add a teammate, or an agent.
 *
 * A teammate is a person and works across the customers you scope them to. An
 * agent is per project and must name its customer — the schema refuses one
 * without, because an agent that can reach a second customer is the thing this
 * product exists to prevent.
 */
export async function POST(req: Request) {
  const t = await guardTenant();
  if ("error" in t) return t.error;
  const actor = (await operator())?.name || "you";
  try {
    const body = await req.json().catch(() => ({}));
    const name = String(body.name || "").trim();
    if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });

    // Three kinds. "client" was missing entirely, which meant the customer-facing
    // desk and copilot existed and no customer could be given a way in — the
    // only way to create one was raw SQL.
    const kind = body.kind === "agent" ? "agent" : body.kind === "client" ? "client" : "operator";
    const customerId = String(body.customerId || "").trim();
    const email = String(body.email || "").trim().toLowerCase();

    if ((kind === "agent" || kind === "client") && !customerId) {
      return NextResponse.json(
        { error: kind === "agent" ? "an agent belongs to one customer — pick the project" : "which customer is this person from?" },
        { status: 400 },
      );
    }
    // Not getCustomer: that would happily attach an agent to another agency's
    // customer, which is the whole shape of the bug this audit is closing.
    if ((kind === "agent" || kind === "client") && !(await customerInTenant(t.tenantId, customerId))) {
      return NextResponse.json({ error: "no such customer" }, { status: 404 });
    }
    // A client signs in by magic link and has no other route in, so an address
    // is not optional for them the way it is for a teammate.
    if (kind === "client" && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return NextResponse.json({ error: "a client signs in by email — give a real address" }, { status: 400 });
    }
    if (email) {
      const [taken] = await db
        .select()
        .from(people)
        .where(sql`lower(${people.email}) = ${email}`)
        .limit(1);
      if (taken) return NextResponse.json({ error: `${email} is already on the floor` }, { status: 409 });
    }

    const handle = slug(String(body.handle || name)).slice(0, 24) || "teammate";
    const id = kind === "agent" ? `A_${handle}` : kind === "client" ? `C_${handle}` : `U_${handle}`;

    const [existing] = await db.select().from(people).where(eq(people.handle, handle)).limit(1);
    if (existing) return NextResponse.json({ error: `${handle} is already on the floor` }, { status: 409 });

    await db.insert(people).values({
      id,
      name,
      handle,
      kind,
      // A client belongs to a customer just as firmly as an agent does — it is
      // what pins their session and every row they can read.
      customerId: kind === "agent" || kind === "client" ? customerId : null,
      email: email || null,
      // build works a repo; copilot works the customer's own business.
      agentKind: kind === "agent" ? (isAgentKind(String(body.agentKind)) ? String(body.agentKind) : "build") : null,
      brief: String(body.brief || "").trim() || null,
      role:
        kind === "agent"
          ? String(body.agentKind) === "copilot"
            ? "Customer copilot"
            : "Build agent"
          : kind === "client"
            ? "Customer"
            : String(body.role || "Build wrangler"),
      approver: false,
      machine: "not connected yet",
      status: "invited",
    });
    // A new session can look, claim, read its project and report. Writing to a
    // branch and asking for a human decision stay ungranted on purpose.
    //
    // read_project and checkout are in the default set because without them a
    // new agent cannot even see its own house rules or get a clone URL, and the
    // first thing anyone did was grant them by hand. checkout hands out a
    // credential, but one scoped to a repo this session is already allowed to
    // work on — the wall is the binding, not the grant.
    const grants =
      kind === "client"
        ? []
        : ["list_jobs", "claim_job", "read_bound_repo", "read_project", "post_step"];
    // Only a build agent gets a push credential. A copilot has no repository to
    // push to, and handing it one would be a capability nobody asked for.
    if (kind === "agent" && String(body.agentKind) !== "copilot") grants.push("checkout");
    if (grants.length) await db.insert(personTools).values(grants.map((tool) => ({ personId: id, tool })));
    await db.insert(audit).values({ customerId: null, actor, action: "added teammate", target: handle, at: new Date() });
    return NextResponse.json({ ok: true, id });
  } catch (e) {
    return fail(e);
  }
}
