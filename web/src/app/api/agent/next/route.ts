import { NextResponse } from "next/server";
import { and, desc, eq, inArray, isNull, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { jobs } from "@/lib/schema";
import { sessionFromHeader } from "@/lib/session-token";
import { brainFromTier } from "@/lib/brains";

/**
 * Which job this session would pick up next, and how much brain it asked for.
 *
 * The worker has to know the model before it starts Claude Code — `--model` is
 * an argument, not something a running session can change. But the job is chosen
 * *inside* that session, so the container was starting every pass on one fixed
 * model and a job's tier could never mean anything. This endpoint closes that
 * loop: the worker asks first, then starts the right size of brain.
 *
 * It is a read. It claims nothing — the agent still claims through the MCP
 * server, under the same scope rules, and may well end up on a different job if
 * another session gets there first. Being wrong about that costs one pass at the
 * wrong tier, not a wall.
 */
export async function GET(req: Request) {
  const session = await sessionFromHeader(req.headers.get("authorization"));
  if (!session) return NextResponse.json({ error: "unknown session" }, { status: 401 });
  if (session.kind !== "agent") {
    return NextResponse.json({ error: "only a project agent asks for work this way" }, { status: 403 });
  }
  if (!session.scope.length) return NextResponse.json({ job: null, reason: "no customers in scope" });

  const rows = await db
    .select()
    .from(jobs)
    .where(
      and(
        inArray(jobs.customerId, session.scope),
        // Something it already holds and has not finished, or something free.
        or(eq(jobs.ownerId, session.id), isNull(jobs.ownerId)),
        inArray(jobs.status, ["queued", "working", "thinking"]),
      ),
    )
    .orderBy(desc(jobs.createdAt));

  // A job at its cap is not work — claim_job refuses it. Offering it here would
  // start a pass whose only possible outcome is a refusal.
  const workable = rows.filter((j) => j.spentCents < j.budgetCents);
  // Whatever it already holds comes first; an agent should finish before it starts.
  const job = workable.find((j) => j.ownerId === session.id) ?? workable[0] ?? null;
  if (!job) {
    const held = rows.length - workable.length;
    return NextResponse.json({
      job: null,
      reason: held ? `${held} job${held === 1 ? " is" : "s are"} at their cap` : "nothing on the board",
    });
  }

  const b = brainFromTier(job.tier);
  return NextResponse.json({
    job: { id: job.id, title: job.title, held: job.ownerId === session.id },
    brain: b.id,
    model: b.model,
    remaining: (job.budgetCents - job.spentCents) / 100,
  });
}
