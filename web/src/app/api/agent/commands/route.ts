import { NextResponse } from "next/server";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { fail, guardBuild, operator } from "@/lib/api";
import { agentCommands, audit, people } from "@/lib/schema";
import { newId } from "@/lib/customers";
import { sessionFromHeader } from "@/lib/session-token";

/**
 * Maintaining a client's agent without a terminal.
 *
 * A managed agent runs on somebody else's behalf, on a box the client never
 * sees, and keeping it alive is our job. Restarting it, moving it to a newer
 * Claude Code, changing how often it wakes — each is a click's worth of intent
 * and used to be a shell session's worth of risk.
 *
 * The verbs are a fixed set. A channel that can run arbitrary shell on a
 * client's box is not maintenance, it is a backdoor that keeps a nice log.
 */
export const COMMANDS = {
  restart: "Stop and come back up. The supervisor restarts it.",
  update: "Move to a newer Claude Code, then restart.",
  reload: "Re-read settings from the floor without restarting.",
  run_now: "Do a pass immediately instead of waiting for the next cycle.",
  pause: "Stop taking work, stay running.",
  resume: "Start taking work again.",
  diagnose: "Report an extended snapshot of what it can see.",
} as const;

/** The worker asking what it has been told to do. */
export async function GET(req: Request) {
  const session = await sessionFromHeader(req.headers.get("authorization"));
  if (session) {
    if (session.kind !== "agent") {
      return NextResponse.json({ error: "only an agent collects its own commands" }, { status: 403 });
    }
    const queued = await db
      .select()
      .from(agentCommands)
      .where(and(eq(agentCommands.personId, session.id), eq(agentCommands.status, "queued")))
      .orderBy(asc(agentCommands.issuedAt))
      .limit(5);
    if (queued.length) {
      await db
        .update(agentCommands)
        .set({ status: "taken", takenAt: new Date() })
        .where(inArray(agentCommands.id, queued.map((c) => c.id)));
    }
    return NextResponse.json({
      commands: queued.map((c) => ({ id: c.id, command: c.command, args: c.args })),
    });
  }

  // Or an operator looking at the history for one agent.
  const g = await guardBuild();
  if ("error" in g) return g.error;
  try {
    const personId = new URL(req.url).searchParams.get("agent") || "";
    const rows = await db
      .select()
      .from(agentCommands)
      .where(eq(agentCommands.personId, personId))
      .orderBy(desc(agentCommands.issuedAt))
      .limit(20);
    return NextResponse.json({
      verbs: Object.entries(COMMANDS).map(([id, what]) => ({ id, what })),
      commands: rows,
    });
  } catch (e) {
    return fail(e);
  }
}

/** An operator telling an agent to do something. */
export async function POST(req: Request) {
  const g = await guardBuild();
  if ("error" in g) return g.error;
  const actor = (await operator())?.name || "you";
  try {
    const body = await req.json().catch(() => ({}));
    const personId = String(body.agent || "");
    const command = String(body.command || "");
    if (!(command in COMMANDS)) {
      return NextResponse.json(
        { error: `unknown command. It is one of: ${Object.keys(COMMANDS).join(", ")}` },
        { status: 400 },
      );
    }
    const [person] = await db.select().from(people).where(eq(people.id, personId)).limit(1);
    // Scoped: an agent belongs to a tenant, and one account cannot reach into
    // another's fleet.
    if (!person || person.kind !== "agent" || person.tenantId !== g.tenantId) {
      return NextResponse.json({ error: "no such agent on this account" }, { status: 404 });
    }
    const id = "X" + newId().slice(0, 8);
    await db.insert(agentCommands).values({
      id, personId, command,
      args: String(body.args || "").slice(0, 200) || null,
      issuedBy: actor,
    });
    await db.insert(audit).values({
      customerId: person.customerId, actor, action: `told an agent to ${command}`, target: person.name, at: new Date(),
    });
    return NextResponse.json({ ok: true, id, note: COMMANDS[command as keyof typeof COMMANDS] });
  } catch (e) {
    return fail(e);
  }
}

/** The worker reporting how it went. */
export async function PATCH(req: Request) {
  const session = await sessionFromHeader(req.headers.get("authorization"));
  if (!session || session.kind !== "agent") {
    return NextResponse.json({ error: "unknown session" }, { status: 401 });
  }
  try {
    const body = await req.json().catch(() => ({}));
    const id = String(body.id || "");
    const [row] = await db.select().from(agentCommands).where(eq(agentCommands.id, id)).limit(1);
    if (!row || row.personId !== session.id) {
      return NextResponse.json({ error: "not your command" }, { status: 404 });
    }
    await db
      .update(agentCommands)
      .set({
        status: body.ok === false ? "failed" : "done",
        doneAt: new Date(),
        result: String(body.result || "").slice(0, 500) || null,
      })
      .where(eq(agentCommands.id, id));
    return NextResponse.json({ ok: true });
  } catch (e) {
    return fail(e);
  }
}
