import { NextResponse } from "next/server";
import { and, desc, eq, inArray } from "drizzle-orm";
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
  await touchSession(session.id);

  const body = await req.json().catch(() => ({}));
  const usd = Number(body.usd);
  if (!Number.isFinite(usd) || usd < 0 || usd > 10_000) {
    return NextResponse.json({ error: "usd must be a positive number of dollars" }, { status: 400 });
  }
  const cents = Math.round(usd * 100);

  // The job this session is holding. If it finished and released everything,
  // the money is still real, so it lands on the last job it held.
  const held = await db
    .select()
    .from(jobs)
    .where(and(eq(jobs.ownerId, session.id), inArray(jobs.status, ["working", "thinking", "blocked", "queued"])))
    .orderBy(desc(jobs.claimedAt))
    .limit(1);
  const job = held[0];
  if (!job) return NextResponse.json({ ok: true, attributed: false, spent: 0, budget: 0, over: false });

  const spent = job.spentCents + cents;
  await db.update(jobs).set({ spentCents: spent }).where(eq(jobs.id, job.id));

  const over = spent >= job.budgetCents;
  if (over) {
    // Stop it here, in the row, so the next pass is refused by the floor and not
    // by a sentence in a prompt the model is free to reason its way past.
    await db.update(jobs).set({ status: "blocked" }).where(eq(jobs.id, job.id));
    await db.insert(orchLog).values({
      customerId: job.customerId,
      tag: "paused",
      text: `${job.title} hit its $${(job.budgetCents / 100).toFixed(2)} cap — $${(spent / 100).toFixed(2)} spent. Held.`,
      at: new Date(),
    });
  }

  return NextResponse.json({
    ok: true,
    attributed: true,
    job: job.id,
    spent: spent / 100,
    budget: job.budgetCents / 100,
    over,
  });
}
