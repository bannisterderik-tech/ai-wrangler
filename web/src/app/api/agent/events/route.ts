import { NextResponse } from "next/server";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { fail, guardBuild } from "@/lib/api";
import { agentEvents } from "@/lib/schema";
import { sessionFromHeader } from "@/lib/session-token";
import { agentsPaused } from "@/lib/switches";
import { EVENT_KINDS } from "@/lib/agent-events";

/**
 * What woke a copilot, or what an operator can see waiting for it.
 *
 * This is the cheap half of the loop. A copilot with nothing to react to costs
 * one HTTP request; only an event turns into a model run. That is the whole
 * difference from the worker, which paid for a session every two minutes to be
 * told there was nothing.
 */
export async function GET(req: Request) {
  const session = await sessionFromHeader(req.headers.get("authorization"));
  if (session) {
    if (session.kind !== "agent") {
      return NextResponse.json({ error: "only an agent collects its own events" }, { status: 403 });
    }
    // The stop switch is checked here too, so pausing the floor also stops
    // event-driven work — not only the job-driven kind.
    const stopped = await agentsPaused();
    if (stopped.paused) {
      return NextResponse.json({ stop: true, reason: stopped.reason ?? "agents are paused", events: [] });
    }
    const queued = await db
      .select()
      .from(agentEvents)
      .where(and(eq(agentEvents.personId, session.id), eq(agentEvents.status, "queued")))
      .orderBy(asc(agentEvents.createdAt))
      .limit(20);
    if (queued.length) {
      await db
        .update(agentEvents)
        .set({ status: "taken", takenAt: new Date() })
        .where(inArray(agentEvents.id, queued.map((e) => e.id)));
    }
    return NextResponse.json({
      events: queued.map((e) => ({
        id: e.id, kind: e.kind, source: e.source, refId: e.refId,
        summary: e.summary, payload: e.payload, at: e.createdAt,
      })),
    });
  }

  const g = await guardBuild();
  if ("error" in g) return g.error;
  try {
    const personId = new URL(req.url).searchParams.get("agent") || "";
    const rows = await db
      .select()
      .from(agentEvents)
      .where(eq(agentEvents.personId, personId))
      .orderBy(desc(agentEvents.createdAt))
      .limit(30);
    return NextResponse.json({ kinds: EVENT_KINDS, events: rows });
  } catch (e) {
    return fail(e);
  }
}

/** The copilot saying what it did about one. */
export async function PATCH(req: Request) {
  const session = await sessionFromHeader(req.headers.get("authorization"));
  if (!session || session.kind !== "agent") {
    return NextResponse.json({ error: "unknown session" }, { status: 401 });
  }
  try {
    const body = await req.json().catch(() => ({}));
    const id = String(body.id || "");
    const [row] = await db.select().from(agentEvents).where(eq(agentEvents.id, id)).limit(1);
    if (!row || row.personId !== session.id) {
      return NextResponse.json({ error: "not your event" }, { status: 404 });
    }
    const status = ["done", "ignored", "failed"].includes(String(body.status)) ? String(body.status) : "done";
    await db
      .update(agentEvents)
      .set({ status, doneAt: new Date(), result: String(body.result || "").slice(0, 600) || null })
      .where(eq(agentEvents.id, id));
    return NextResponse.json({ ok: true });
  } catch (e) {
    return fail(e);
  }
}
