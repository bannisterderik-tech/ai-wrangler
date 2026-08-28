import { NextResponse } from "next/server";
import { asc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { fail, guard, operator } from "@/lib/api";
import { audit, jobs, people, personScopes, personTools } from "@/lib/schema";
import { TOOLS } from "@/lib/mcp-tools";
import { slug } from "@/lib/crypto";
import { getCustomer } from "@/lib/customers";

/** Everyone on the floor, with what their session is allowed to touch. */
export async function GET() {
  const denied = await guard();
  if (denied) return denied;

  const [rows, scopes, tools, counts] = await Promise.all([
    // Operators and agents only. A client user is a person row too, but they
    // sign in to their own CRM and have no MCP session — listing them here
    // invites minting them a token that could never do anything.
    db.select().from(people).where(inArray(people.kind, ["operator", "agent"])).orderBy(asc(people.createdAt)),
    db.select().from(personScopes),
    db.select().from(personTools),
    db
      .select({ ownerId: jobs.ownerId, n: sql<number>`count(*)::int` })
      .from(jobs)
      .groupBy(jobs.ownerId),
  ]);

  return NextResponse.json({
    tools: TOOLS.map((t) => ({ name: t.name, description: t.description })),
    people: rows.map((p) => ({
      id: p.id,
      name: p.name,
      handle: p.handle,
      kind: p.kind,
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
  const denied = await guard();
  if (denied) return denied;
  const actor = (await operator())?.name || "you";
  try {
    const body = await req.json().catch(() => ({}));
    const name = String(body.name || "").trim();
    if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });

    const kind = body.kind === "agent" ? "agent" : "operator";
    const customerId = String(body.customerId || "").trim();
    if (kind === "agent" && !customerId) {
      return NextResponse.json({ error: "an agent belongs to one customer — pick the project" }, { status: 400 });
    }
    if (kind === "agent" && !(await getCustomer(customerId))) {
      return NextResponse.json({ error: "no such customer" }, { status: 404 });
    }

    const handle = slug(String(body.handle || name)).slice(0, 24) || "teammate";
    const id = kind === "agent" ? `A_${handle}` : `U_${handle}`;

    const [existing] = await db.select().from(people).where(eq(people.handle, handle)).limit(1);
    if (existing) return NextResponse.json({ error: `${handle} is already on the floor` }, { status: 409 });

    await db.insert(people).values({
      id,
      name,
      handle,
      kind,
      customerId: kind === "agent" ? customerId : null,
      role: kind === "agent" ? "Build agent" : String(body.role || "Build wrangler"),
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
    const grants = ["list_jobs", "claim_job", "read_bound_repo", "read_project", "post_step"];
    if (kind === "agent") grants.push("checkout");
    await db.insert(personTools).values(grants.map((tool) => ({ personId: id, tool })));
    await db.insert(audit).values({ customerId: null, actor, action: "added teammate", target: handle, at: new Date() });
    return NextResponse.json({ ok: true, id });
  } catch (e) {
    return fail(e);
  }
}
