import { eq } from "drizzle-orm";
import { db } from "./db";
import { floorSwitches } from "./schema";

/**
 * The stop switch.
 *
 * Stopping the agents used to mean deleting a Railway service — the one thing
 * this OS exists to make unnecessary, and the thing you most want at 2am when a
 * container is spending money on nothing.
 *
 * It is a database row, not an environment variable, so it takes effect on the
 * next poll rather than the next deploy. Every agent asks the floor what to do
 * before it starts a paid session; this is the floor answering "don't".
 */
export const AGENTS_PAUSED = "agents_paused";

export async function agentsPaused(): Promise<{ paused: boolean; reason: string | null; at: Date | null }> {
  try {
    const [row] = await db.select().from(floorSwitches).where(eq(floorSwitches.id, AGENTS_PAUSED)).limit(1);
    return { paused: Boolean(row?.onAt), reason: row?.reason ?? null, at: row?.onAt ?? null };
  } catch {
    // A switch we cannot read is not a reason to start spending. Fail stopped.
    return { paused: true, reason: "the floor could not read its own stop switch", at: null };
  }
}

export async function setAgentsPaused(paused: boolean, actor: string, reason?: string) {
  await db
    .insert(floorSwitches)
    .values({
      id: AGENTS_PAUSED,
      onAt: paused ? new Date() : null,
      reason: paused ? reason?.slice(0, 300) || "stopped from the OS" : null,
      actor,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: floorSwitches.id,
      set: {
        onAt: paused ? new Date() : null,
        reason: paused ? reason?.slice(0, 300) || "stopped from the OS" : null,
        actor,
        updatedAt: new Date(),
      },
    });
}
