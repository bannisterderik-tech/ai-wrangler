import { NextResponse } from "next/server";
import { asc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { fail, guard, operator } from "@/lib/api";
import { audit, jobs, people, personScopes, personTools } from "@/lib/schema";
import { TOOLS } from "@/lib/mcp-tools";
import { slug } from "@/lib/crypto";

/** Everyone on the floor, with what their session is allowed to touch. */
export async function GET() {
  const denied = await guard();
  if (denied) return denied;

  const [rows, scopes, tools, counts] = await Promise.all([
    db.select().from(people).orderBy(asc(people.createdAt)),
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
      role: p.role,
      approver: p.approver,
      machine: p.machine,
      status: p.status,
      clientVersion: p.clientVersion,
      connectedAt: p.connectedAt,
      // Never the token itself — only enough to recognise which one is installed.
      tokenPrefix: p.tokenPrefix,
      hasToken: Boolean(p.tokenHash),
      scope: scopes.filter((s) => s.personId === p.id).map((s) => s.customerId),
      grants: tools.filter((t) => t.personId === p.id).map((t) => t.tool),
      claimed: counts.find((c) => c.ownerId === p.id)?.n ?? 0,
    })),
  });
}

/** Add a teammate. They get no token until you mint one. */
export async function POST(req: Request) {
  const denied = await guard();
  if (denied) return denied;
  const actor = (await operator())?.name || "you";
  try {
    const body = await req.json().catch(() => ({}));
    const name = String(body.name || "").trim();
    if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });
    const handle = slug(String(body.handle || name)).slice(0, 24) || "teammate";
    const id = `U_${handle}`;

    const [existing] = await db.select().from(people).where(eq(people.handle, handle)).limit(1);
    if (existing) return NextResponse.json({ error: `${handle} is already on the floor` }, { status: 409 });

    await db.insert(people).values({
      id,
      name,
      handle,
      role: String(body.role || "Build wrangler"),
      approver: false,
      machine: "not connected yet",
      status: "invited",
    });
    // A new session can look and claim. Writing and asking are granted on purpose.
    await db
      .insert(personTools)
      .values(["list_jobs", "claim_job", "read_bound_repo", "post_step"].map((tool) => ({ personId: id, tool })));
    await db.insert(audit).values({ customerId: null, actor, action: "added teammate", target: handle, at: new Date() });
    return NextResponse.json({ ok: true, id });
  } catch (e) {
    return fail(e);
  }
}
