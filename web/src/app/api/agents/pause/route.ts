import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { fail, operator, guardBuild } from "@/lib/api";
import { audit, orchLog } from "@/lib/schema";
import { agentsPaused, setAgentsPaused } from "@/lib/switches";

export async function GET() {
  // The build half. A CRM-only account is refused it outright rather than
  // shown an empty floor and left to wonder.
  const b = await guardBuild();
  if ("error" in b) return b.error;
  return NextResponse.json(await agentsPaused());
}

/** Stop every agent, or let them go again. */
export async function POST(req: Request) {
  // The build half. A CRM-only account is refused it outright rather than
  // shown an empty floor and left to wonder.
  const b = await guardBuild();
  if ("error" in b) return b.error;
  const actor = (await operator())?.name || "you";
  try {
    const body = await req.json().catch(() => ({}));
    const paused = body.paused !== false;
    await setAgentsPaused(paused, actor, String(body.reason || ""));
    await db.insert(orchLog).values({
      customerId: null,
      tag: paused ? "paused" : "you",
      text: paused ? `${actor} stopped every agent.` : `${actor} let the agents run again.`,
      at: new Date(),
    });
    await db.insert(audit).values({
      customerId: null,
      actor,
      action: paused ? "stopped every agent" : "restarted the agents",
      target: null,
      at: new Date(),
    });
    return NextResponse.json({ ok: true, ...(await agentsPaused()) });
  } catch (e) {
    return fail(e);
  }
}
