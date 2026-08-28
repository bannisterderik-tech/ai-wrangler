import { NextResponse } from "next/server";
import { and, asc, count, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { fail, guardOwner, operator } from "@/lib/api";
import { agencyLeads, audit, customers, people, tenants } from "@/lib/schema";
import { HOUSE } from "@/lib/auth";
import { slug } from "@/lib/crypto";

/**
 * The owner's view: every agency account on the platform.
 *
 * Only the house sees this. An account that could list the others is not an
 * account, it is a shared database with a filter on it.
 */
export async function GET() {
  const denied = await guardOwner();
  if (denied) return denied;
  try {
    const rows = await db.select().from(tenants).orderBy(asc(tenants.createdAt));
    const out = [];
    for (const t of rows) {
      const [staff] = await db
        .select({ n: count() })
        .from(people)
        .where(and(eq(people.tenantId, t.id), eq(people.kind, "operator")));
      const [clients] = await db.select({ n: count() }).from(customers).where(eq(customers.tenantId, t.id));
      const [leads] = await db.select({ n: count() }).from(agencyLeads).where(eq(agencyLeads.tenantId, t.id));
      out.push({
        id: t.id, name: t.name, canBuild: t.canBuild, status: t.status, plan: t.plan, note: t.note,
        createdAt: t.createdAt, isHouse: t.id === HOUSE,
        staff: staff?.n ?? 0, customers: clients?.n ?? 0, leads: leads?.n ?? 0,
      });
    }
    return NextResponse.json({ tenants: out });
  } catch (e) {
    return fail(e);
  }
}

/** Open an account, and give one person a way into it. */
export async function POST(req: Request) {
  const denied = await guardOwner();
  if (denied) return denied;
  const actor = (await operator())?.name || "you";
  try {
    const body = await req.json().catch(() => ({}));
    const name = String(body.name || "").trim();
    const email = String(body.adminEmail || "").trim().toLowerCase();
    const adminName = String(body.adminName || "").trim();
    if (!name) return NextResponse.json({ error: "what is the agency called?" }, { status: 400 });
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return NextResponse.json({ error: "who runs it? Give a real email — that is how they sign in." }, { status: 400 });
    }
    const id = slug(name).slice(0, 40);
    if (!id) return NextResponse.json({ error: "that name does not make a usable id" }, { status: 400 });

    const [taken] = await db.select().from(tenants).where(eq(tenants.id, id)).limit(1);
    if (taken) return NextResponse.json({ error: `${name} is already an account here` }, { status: 409 });
    const [dupe] = await db.select().from(people).where(sql`lower(${people.email}) = ${email}`).limit(1);
    if (dupe) return NextResponse.json({ error: `${email} already signs in here` }, { status: 409 });

    await db.insert(tenants).values({
      id,
      name,
      // Off unless it is sold. The building half is a separate product, and a
      // default of "on" is how a CRM customer ends up with an agent.
      canBuild: body.canBuild === true,
      plan: String(body.plan || "").trim() || "crm",
      note: String(body.note || "").trim() || null,
    });

    // Their first person, and an admin of their own account — not of ours.
    await db.insert(people).values({
      id: `U_${id}_${slug(adminName || email.split("@")[0]).slice(0, 16)}`,
      name: adminName || email.split("@")[0],
      handle: slug(`${id}-${adminName || email.split("@")[0]}`).slice(0, 40),
      email,
      kind: "operator",
      tenantId: id,
      tenantRole: "admin",
      role: "Agency admin",
      status: "invited",
    });

    await db.insert(audit).values({
      customerId: null, actor, action: "opened an agency account", target: `${name} · ${email}`, at: new Date(),
    });
    return NextResponse.json({ ok: true, id });
  } catch (e) {
    return fail(e);
  }
}

/** Turn the build half on or off, or suspend an account. */
export async function PATCH(req: Request) {
  const denied = await guardOwner();
  if (denied) return denied;
  const actor = (await operator())?.name || "you";
  try {
    const body = await req.json().catch(() => ({}));
    const id = String(body.id || "");
    const [t] = await db.select().from(tenants).where(eq(tenants.id, id)).limit(1);
    if (!t) return NextResponse.json({ error: "no such account" }, { status: 404 });
    if (t.id === HOUSE && (body.status === "suspended" || body.canBuild === false)) {
      // Locking yourself out of your own product is not a feature.
      return NextResponse.json({ error: "the house account cannot suspend or de-build itself" }, { status: 400 });
    }
    const patch: Record<string, unknown> = {};
    if (body.canBuild !== undefined) patch.canBuild = body.canBuild === true;
    if (body.status !== undefined) {
      if (!["active", "suspended"].includes(String(body.status))) {
        return NextResponse.json({ error: "unknown status" }, { status: 400 });
      }
      patch.status = String(body.status);
    }
    if (body.plan !== undefined) patch.plan = String(body.plan).trim() || null;
    if (!Object.keys(patch).length) return NextResponse.json({ error: "nothing to change" }, { status: 400 });
    await db.update(tenants).set(patch).where(eq(tenants.id, id));
    await db.insert(audit).values({
      customerId: null, actor, action: "changed an agency account",
      target: `${t.name} · ${JSON.stringify(patch)}`, at: new Date(),
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return fail(e);
  }
}
