import { NextResponse } from "next/server";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { fail, guard, operator } from "@/lib/api";
import { agentConnections, audit, people } from "@/lib/schema";
import { newId } from "@/lib/customers";
import { CATEGORIES, CONNECTORS, connector } from "@/lib/connectors";
import { encrypt } from "@/lib/crypto";

const STATUSES = ["needed", "connected", "blocked", "dropped"];

/** What this agent needs to reach, and what we can actually reach today. */
export async function GET(_req: Request, ctx: RouteContext<"/api/people/[id]/connections">) {
  const denied = await guard();
  if (denied) return denied;
  try {
    const { id } = await ctx.params;
    const rows = await db
      .select()
      .from(agentConnections)
      .where(eq(agentConnections.personId, id))
      .orderBy(asc(agentConnections.createdAt));
    return NextResponse.json({
      catalog: CONNECTORS,
      categories: CATEGORIES,
      connections: rows.map((r) => {
        const c = connector(r.provider);
        return {
          id: r.id,
          provider: r.provider,
          name: c?.name ?? r.provider,
          category: c?.category ?? "work",
          gives: c?.gives ?? null,
          // The honest bit: what it would take, and whether it exists yet.
          available: c?.available ?? false,
          buildNote: c?.note ?? null,
          label: r.label,
          status: r.status,
          note: r.note,
          // Whether a credential exists, never the credential. The only place
          // it is ever decrypted is on its way to that copilot's own machine.
          hasSecret: Boolean(r.encryptedSecret),
          secretKind: r.secretKind,
          secretSetAt: r.secretSetAt,
          deliveredAt: r.deliveredAt,
        };
      }),
    });
  } catch (e) {
    return fail(e);
  }
}

/** Add a dependency to this agent's map. */
export async function POST(req: Request, ctx: RouteContext<"/api/people/[id]/connections">) {
  const denied = await guard();
  if (denied) return denied;
  const actor = (await operator())?.name || "you";
  try {
    const { id } = await ctx.params;
    const [person] = await db.select().from(people).where(eq(people.id, id)).limit(1);
    if (!person) return NextResponse.json({ error: "no such agent" }, { status: 404 });
    if (person.kind !== "agent") {
      return NextResponse.json({ error: "only an agent has connections" }, { status: 400 });
    }
    const body = await req.json().catch(() => ({}));
    const provider = String(body.provider || "").trim();
    if (!connector(provider)) return NextResponse.json({ error: "unknown connector" }, { status: 400 });

    await db
      .insert(agentConnections)
      .values({
        id: "C" + newId().slice(0, 8),
        personId: id,
        provider,
        label: String(body.label || "").trim() || null,
        // A new dependency is "needed" until somebody actually connects it.
        // Nothing here may declare itself connected.
        status: "needed",
        note: String(body.note || "").trim() || null,
      })
      .onConflictDoNothing();
    await db.insert(audit).values({
      customerId: person.customerId, actor, action: "added an agent dependency",
      target: `${person.name} · ${provider}`, at: new Date(),
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return fail(e);
  }
}

export async function PATCH(req: Request, ctx: RouteContext<"/api/people/[id]/connections">) {
  const denied = await guard();
  if (denied) return denied;
  try {
    const { id } = await ctx.params;
    const body = await req.json().catch(() => ({}));
    const rowId = String(body.id || "");
    if (body.remove === true) {
      await db.delete(agentConnections).where(and(eq(agentConnections.id, rowId), eq(agentConnections.personId, id)));
      return NextResponse.json({ ok: true });
    }
    // Storing the credential that actually reaches the system.
    if (typeof body.secret === "string") {
      const [row] = await db.select().from(agentConnections).where(eq(agentConnections.id, rowId)).limit(1);
      if (!row || row.personId !== id) return NextResponse.json({ error: "no such connection" }, { status: 404 });
      const secret = body.secret.trim();
      if (!secret) {
        await db
          .update(agentConnections)
          .set({ encryptedSecret: null, secretKind: null, secretSetAt: null, deliveredAt: null })
          .where(eq(agentConnections.id, rowId));
        return NextResponse.json({ ok: true, hasSecret: false });
      }
      await db
        .update(agentConnections)
        .set({
          encryptedSecret: encrypt(secret),
          secretKind: ["token", "password", "oauth_refresh", "json"].includes(String(body.secretKind))
            ? String(body.secretKind)
            : "token",
          secretSetAt: new Date(),
          // A new credential has not reached the box yet, whatever the old one did.
          deliveredAt: null,
        })
        .where(eq(agentConnections.id, rowId));
      await db.insert(audit).values({
        customerId: null,
        actor: (await operator())?.name || "you",
        action: "stored a credential for an agent",
        // The provider, never the value.
        target: `${row.provider}${row.label ? ` · ${row.label}` : ""}`,
        at: new Date(),
      });
      return NextResponse.json({ ok: true, hasSecret: true });
    }

    const status = String(body.status || "");
    if (!STATUSES.includes(status)) return NextResponse.json({ error: "unknown status" }, { status: 400 });
    const [row] = await db.select().from(agentConnections).where(eq(agentConnections.id, rowId)).limit(1);
    if (!row || row.personId !== id) return NextResponse.json({ error: "no such connection" }, { status: 404 });
    // Marking something connected that the OS cannot connect is how a screen
    // starts lying. It is allowed, but only deliberately, and it is recorded.
    if (status === "connected" && !connector(row.provider)?.available && !body.iConnectedItMyself) {
      return NextResponse.json(
        {
          error:
            `${connector(row.provider)?.name ?? row.provider} has no connector in the OS yet, so this cannot mark itself connected. ` +
            `If you wired it up by hand, say so and it will be recorded as that.`,
        },
        { status: 409 },
      );
    }
    await db
      .update(agentConnections)
      .set({ status, note: body.note !== undefined ? String(body.note).trim() || null : row.note })
      .where(eq(agentConnections.id, rowId));
    return NextResponse.json({ ok: true });
  } catch (e) {
    return fail(e);
  }
}
