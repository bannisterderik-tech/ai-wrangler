import { NextResponse } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { fail, guard, operator } from "@/lib/api";
import { approvals, audit, jobSteps, jobs, people } from "@/lib/schema";

/** Operator actions on one job: take it, hand it over, or decide its gate. */
export async function POST(req: Request, ctx: RouteContext<"/api/floor/[id]">) {
  const denied = await guard();
  if (denied) return denied;
  const { id } = await ctx.params;
  const who = await operator();
  const actor = who?.name || "you";

  try {
    const [job] = await db.select().from(jobs).where(eq(jobs.id, id)).limit(1);
    if (!job) return NextResponse.json({ error: "no such job" }, { status: 404 });

    const body = await req.json().catch(() => ({}));
    const action = String(body.action || "");
    const note = async (kind: string, text: string) =>
      db.insert(jobSteps).values({ jobId: job.id, customerId: job.customerId, kind, text, actor });
    const trail = async (a: string, target?: string) =>
      db.insert(audit).values({ customerId: job.customerId, actor, action: a, target: target ?? job.id, at: new Date() });

    if (action === "claim" || action === "assign") {
      const target = action === "assign" ? String(body.personId || "") : String(body.personId || "");
      if (!target) return NextResponse.json({ error: "personId required" }, { status: 400 });
      const [p] = await db.select().from(people).where(eq(people.id, target)).limit(1);
      if (!p) return NextResponse.json({ error: "no such person" }, { status: 404 });
      // Same conditional update the MCP tool uses, so the UI cannot jump the queue.
      const won = await db
        .update(jobs)
        .set({ ownerId: target, claimedAt: new Date() })
        .where(and(eq(jobs.id, job.id), isNull(jobs.ownerId)))
        .returning({ id: jobs.id });
      if (!won.length && job.ownerId !== target) {
        return NextResponse.json({ error: "someone else is holding this job" }, { status: 409 });
      }
      await trail("assigned job", `${job.id} → ${p.handle}`);
      return NextResponse.json({ ok: true });
    }

    if (action === "release") {
      await db.update(jobs).set({ ownerId: null, claimedAt: null }).where(eq(jobs.id, job.id));
      await trail("released job");
      return NextResponse.json({ ok: true });
    }

    if (action === "approve" || action === "reject") {
      const gateId = String(body.gateId || "");
      const [gate] = await db.select().from(approvals).where(eq(approvals.id, gateId)).limit(1);
      if (!gate || gate.jobId !== job.id) return NextResponse.json({ error: "no such gate" }, { status: 404 });
      if (gate.status !== "pending") return NextResponse.json({ error: "already decided" }, { status: 409 });
      const decided = action === "approve" ? "approved" : "rejected";
      await db
        .update(approvals)
        .set({ status: decided, decidedAt: new Date(), decidedBy: actor })
        .where(eq(approvals.id, gate.id));
      await db.update(jobs).set({ status: action === "approve" ? "working" : "blocked" }).where(eq(jobs.id, job.id));
      await note(action === "approve" ? "done" : "gate", `${decided} by ${actor}: ${gate.title}`);
      await trail(`${decided} approval`, gate.title);
      return NextResponse.json({ ok: true });
    }

    // claim_job refuses a job at its cap and tells the operator "a human has to
    // raise the cap before it moves again". Until now that operation did not
    // exist anywhere in the codebase, so the message was a lie and the only
    // cure was SQL.
    if (action === "raise-cap") {
      const to = Number(body.budgetDollars);
      if (!Number.isFinite(to) || to <= 0) {
        return NextResponse.json({ error: "what should the new cap be, in dollars?" }, { status: 400 });
      }
      if (to > 500) {
        return NextResponse.json({ error: "that cap is over $500 — raise the ceiling in code if you mean it" }, { status: 400 });
      }
      const cents = Math.round(to * 100);
      if (cents <= job.spentCents) {
        return NextResponse.json(
          { error: `it has already spent $${(job.spentCents / 100).toFixed(2)}. A new cap has to be more than that.` },
          { status: 400 },
        );
      }
      await db
        .update(jobs)
        // Back on the board and unowned: the session that hit the wall is long
        // gone, and leaving it owned makes the job unclaimable by anyone.
        .set({ budgetCents: cents, status: "queued", ownerId: null, claimedAt: null })
        .where(eq(jobs.id, job.id));
      await note("think", `${actor} raised the cap to $${to.toFixed(2)}. Back on the board.`);
      await db.insert(audit).values({
        customerId: job.customerId, actor, action: "raised a job cap", target: `${job.id} · $${to.toFixed(2)}`, at: new Date(),
      });
      return NextResponse.json({ ok: true });
    }

    if (action === "stop") {
      await db.update(jobs).set({ status: "blocked" }).where(eq(jobs.id, job.id));
      await note("gate", `Stopped by ${actor}. Nothing was merged or sent.`);
      await trail("stopped job");
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "unknown action" }, { status: 400 });
  } catch (e) {
    return fail(e);
  }
}
