import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { fail, guard, operator } from "@/lib/api";
import { audit, orchLog } from "@/lib/schema";
import { agentsPaused, setAgentsPaused } from "@/lib/switches";

export async function GET() {
  const denied = await guard();
  if (denied) return denied;
  return NextResponse.json(await agentsPaused());
}

/** Stop every agent, or let them go again. */
export async function POST(req: Request) {
  const denied = await guard();
  if (denied) return denied;
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
