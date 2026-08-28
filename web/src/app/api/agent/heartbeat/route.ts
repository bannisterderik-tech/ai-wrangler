import { NextResponse } from "next/server";
import { desc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { fail, guardBuild } from "@/lib/api";
import { agentHealth, jobs, people } from "@/lib/schema";
import { sessionFromHeader, touchSession } from "@/lib/session-token";

const STATES = ["ok", "idle", "stuck", "unbilled", "stopped"];

/**
 * A worker saying what it is doing.
 *
 * Outbound, so it works on any host — a Hostinger VPS, a Railway container, a
 * box under a desk — with no inbound port, no provider token and no firewall
 * hole. And it carries the things that mean "working" rather than "powered on":
 * a provider's uptime API would have shown green for the whole of the $20
 * incident.
 */
export async function POST(req: Request) {
  const session = await sessionFromHeader(req.headers.get("authorization"));
  if (!session) return NextResponse.json({ error: "unknown session" }, { status: 401 });
  if (session.kind !== "agent") {
    return NextResponse.json({ error: "only an agent reports its own health" }, { status: 403 });
  }
  try {
    const b = await req.json().catch(() => ({}));
    const num = (v: unknown, max = 1e9) => {
      const n = Number(v);
      return Number.isFinite(n) && n >= 0 && n <= max ? n : null;
    };
    const state = STATES.includes(String(b.state)) ? String(b.state) : "ok";

    const row = {
      personId: session.id,
      host: String(b.host || "").slice(0, 120) || null,
      cliVersion: String(b.cliVersion || "").slice(0, 60) || null,
      uptimeS: num(b.uptimeS, 3.2e7),
      passes: num(b.passes, 1e6) ?? 0,
      lastPassAt: b.lastPassAt ? new Date(String(b.lastPassAt)) : null,
      lastCostUsd: num(b.lastCostUsd, 10_000)?.toFixed(4) ?? null,
      spentUsd: (num(b.spentUsd, 1e6) ?? 0).toFixed(4),
      ceilingUsd: num(b.ceilingUsd, 1e6)?.toFixed(4) ?? null,
      state,
      detail: String(b.detail || "").slice(0, 400) || null,
      bare: typeof b.bare === "boolean" ? b.bare : null,
      resuming: typeof b.resuming === "boolean" ? b.resuming : null,
      at: new Date(),
    };
    await db.insert(agentHealth).values(row).onConflictDoUpdate({ target: agentHealth.personId, set: row });
    await touchSession(session.id, row.cliVersion);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return fail(e);
  }
}

/** The fleet, for the operator. Silence is a state, so it is computed here. */
export async function GET() {
  const g = await guardBuild();
  if ("error" in g) return g.error;
  try {
    const agents = await db.select().from(people).where(eq(people.kind, "agent"));
    const mine = agents.filter((a) => a.tenantId === g.tenantId);
    if (!mine.length) return NextResponse.json({ agents: [] });
    const health = await db
      .select()
      .from(agentHealth)
      .where(inArray(agentHealth.personId, mine.map((a) => a.id)))
      .orderBy(desc(agentHealth.at));
    const byId = new Map(health.map((h) => [h.personId, h]));

    return NextResponse.json({
      agents: mine.map((a) => {
        const h = byId.get(a.id);
        const secondsAgo = h ? Math.round((Date.now() - h.at.getTime()) / 1000) : null;
        // A worker that has stopped reporting is not "ok" just because its last
        // report said so. Silence is the signal that matters most.
        const silent = secondsAgo !== null && secondsAgo > 1800;
        return {
          id: a.id,
          name: a.name,
          agentKind: a.agentKind ?? "build",
          customerId: a.customerId,
          heard: h ? h.at : null,
          secondsAgo,
          state: !h ? "never" : silent ? "silent" : h.state,
          host: h?.host ?? null,
          cliVersion: h?.cliVersion ?? null,
          passes: h?.passes ?? 0,
          lastCostUsd: h?.lastCostUsd ? Number(h.lastCostUsd) : null,
          spentUsd: h?.spentUsd ? Number(h.spentUsd) : 0,
          ceilingUsd: h?.ceilingUsd ? Number(h.ceilingUsd) : null,
          detail: h?.detail ?? null,
          bare: h?.bare ?? null,
          resuming: h?.resuming ?? null,
        };
      }),
    });
  } catch (e) {
    return fail(e);
  }
}

void jobs;
