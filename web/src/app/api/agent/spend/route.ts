import { NextResponse } from "next/server";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { jobs, orchLog } from "@/lib/schema";
import { sessionFromHeader, touchSession } from "@/lib/session-token";

/**
 * What a pass actually cost, reported by the worker rather than by the agent.
 *
 * The model is not asked how much it spent. The container reads the number the
 * harness prints when the pass ends and posts it here against whatever job that
 * session is holding. A cap the spender maintains is not a cap.
 */
export async function POST(req: Request) {
  const session = await sessionFromHeader(req.headers.get("authorization"));
  if (!session) return NextResponse.json({ error: "unknown session" }, { status: 401 });
  // A teammate's own Claude Code is not billed to a job — only a project agent
  // reports spend. Without this, any session could push $10,000 onto whatever
  // job an operator last claimed.
  if (session.kind !== "agent") {
    return NextResponse.json({ error: "only a project agent reports spend" }, { status: 403 });
  }
  await touchSession(session.id);

  const body = await req.json().catch(() => ({}));
  const usd = Number(body.usd);
  if (!Number.isFinite(usd) || usd < 0 || usd > 10_000) {
    return NextResponse.json({ error: "usd must be a positive number of dollars" }, { status: 400 });
  }
  const cents = Math.round(usd * 100);

  // The worker names the job it was told to work. Inferring it from "whatever
  // this session most recently claimed" had two holes: open_work creates a job
  // with claimedAt=now, so an agent could redirect its own bill onto a fresh
  // $0 budget; and a job that finished ('done') or was released (ownerId null)
  // matched nothing at all, so every SUCCESSFUL pass was recorded as free.
  const named = String(body.jobId || "").trim();
  let job = null;
  if (named) {
    const [row] = await db.select().from(jobs).where(eq(jobs.id, named)).limit(1);
    // Scope still applies: an agent may only bill a job for its own customer.
    if (row && session.scope.includes(row.customerId)) job = row;
  }
  if (!job) {
    const held = await db
      .select()
      .from(jobs)
      .where(and(eq(jobs.ownerId, session.id), inArray(jobs.status, ["working", "thinking", "blocked", "queued"])))
      .orderBy(desc(jobs.claimedAt))
      .limit(1);
    job = held[0] ?? null;
  }
  if (!job) {
    return NextResponse.json(
      { ok: true, attributed: false, reason: "no job matched — this spend was not recorded", spent: 0, budget: 0, over: false },
    );
  }

  // One statement, so two workers reporting at once cannot each read the old
  // value and write their own total over the other's.
  const [updated] = await db
    .update(jobs)
    .set({ spentCents: sql`${jobs.spentCents} + ${cents}` })
    .where(eq(jobs.id, job.id))
    .returning({ spentCents: jobs.spentCents, budgetCents: jobs.budgetCents });
  const spent = updated.spentCents;

  const over = spent >= updated.budgetCents;
  if (over) {
    // Stop it here, in the row, so the next pass is refused by the floor and not
    // by a sentence in a prompt the model is free to reason its way past.
    await db.update(jobs).set({ status: "blocked" }).where(eq(jobs.id, job.id));
    await db.insert(orchLog).values({
      customerId: job.customerId,
      tag: "paused",
      text: `${job.title} hit its $${(updated.budgetCents / 100).toFixed(2)} cap — $${(spent / 100).toFixed(2)} spent. Held.`,
      at: new Date(),
    });
  }

  return NextResponse.json({
    ok: true,
    attributed: true,
    job: job.id,
    spent: spent / 100,
    budget: updated.budgetCents / 100,
    over,
  });
}
