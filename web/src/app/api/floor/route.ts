import { NextResponse } from "next/server";
import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { approvals, audit, boundResources, changes, customers, jobSteps, jobs, people } from "@/lib/schema";
import { fail, guard, operator } from "@/lib/api";
import { newId } from "@/lib/customers";
import { BRAINS, DEFAULT_BRAIN, brainFromTier } from "@/lib/brains";

/**
 * The floor in one payload. A job carries its own gate and its own diff, because
 * Needs you and Changes were only ever views of the same object.
 */
export async function GET() {
  const denied = await guard();
  if (denied) return denied;

  const [rows, steps, gates, diffs, custs, crew] = await Promise.all([
    db.select().from(jobs).orderBy(desc(jobs.createdAt)),
    db.select().from(jobSteps).orderBy(asc(jobSteps.id)),
    db.select().from(approvals).orderBy(desc(approvals.createdAt)),
    db.select().from(changes).orderBy(desc(changes.createdAt)),
    db.select().from(customers),
    db.select().from(people),
  ]);

  const name = (id: string | null) => custs.find((c) => c.id === id)?.name ?? id ?? "—";

  return NextResponse.json({
    customers: custs.map((c) => ({ id: c.id, name: c.name })),
    people: crew.map((p) => ({
      id: p.id,
      name: p.name,
      handle: p.handle,
      status: p.status,
      kind: p.kind,
      customerId: p.customerId,
    })),
    jobs: rows.map((j) => {
      const gate = gates.find((a) => a.jobId === j.id && a.status === "pending") ?? gates.find((a) => a.jobId === j.id);
      const diff = diffs.find((c) => c.repo && j.repo && c.repo === j.repo && c.branch === j.branch);
      const owner = crew.find((p) => p.id === j.ownerId);
      return {
        id: j.id,
        title: j.title,
        status: j.status,
        customerId: j.customerId,
        customer: name(j.customerId),
        owner: owner ? { id: owner.id, handle: owner.handle, name: owner.name } : null,
        agent: j.agent,
        repo: j.repo,
        branch: j.branch,
        previewUrl: j.previewUrl,
        goal: j.goal,
        scope: j.scopeNote,
        risk: j.risk,
        spent: j.spentCents / 100,
        budget: j.budgetCents / 100,
        tier: brainFromTier(j.tier).id,
        brain: brainFromTier(j.tier).label,
        steps: steps
          .filter((s) => s.jobId === j.id)
          .map((s) => ({ kind: s.kind, text: s.text, actor: s.actor, at: s.at })),
        gate: gate
          ? {
              id: gate.id,
              title: gate.title,
              what: gate.why,
              blast: gate.blast,
              cost: gate.cost,
              guard: gate.guard,
              askedBy: gate.askedBy,
              irreversible: gate.irreversible,
              status: gate.status,
            }
          : null,
        change: diff
          ? { id: diff.id, title: diff.title, repo: diff.repo, branch: diff.branch, status: diff.status, diff: diff.diff }
          : null,
      };
    }),
    // The picker renders from here, so the tiers and their trade-offs live in
    // one file rather than being retyped into a form.
    brains: BRAINS.map((b) => ({ id: b.id, label: b.label, rate: b.rate, good: b.good, bad: b.bad })),
    defaultBrain: DEFAULT_BRAIN,
  });
}

/**
 * Give an agent a job.
 *
 * The cap is the point. An agent stops at it and asks rather than deciding the
 * work was worth more than you said, so it is required and it is in dollars —
 * not a tier whose meaning you have to remember.
 *
 * The repo comes from the bindings, never from this form: a job may only ever
 * name a repo bound to its own customer, and the way to guarantee that is to
 * not offer a text box.
 */
export async function POST(req: Request) {
  const denied = await guard();
  if (denied) return denied;
  const who = await operator();
  const actor = who?.name || "you";

  try {
    const body = await req.json().catch(() => ({}));
    const title = String(body.title || "").trim();
    const customerId = String(body.customerId || "").trim();
    const goal = String(body.goal || "").trim();
    const budget = Number(body.budgetDollars);
    const ownerId = String(body.ownerId || "").trim() || null;
    // How much brain to buy. Picked when the job is opened, because that is when
    // somebody knows whether this is a heading change or a rebuild.
    const picked = brainFromTier(String(body.tier || "") || DEFAULT_BRAIN);

    if (!title) return NextResponse.json({ error: "give it a title" }, { status: 400 });
    if (!customerId) return NextResponse.json({ error: "pick the project" }, { status: 400 });
    if (!Number.isFinite(budget) || budget <= 0) {
      return NextResponse.json({ error: "set a spend cap in dollars" }, { status: 400 });
    }
    if (budget > 500) {
      return NextResponse.json({ error: "that cap is over $500 — raise the ceiling in code if you mean it" }, { status: 400 });
    }

    const [customer] = await db.select().from(customers).where(eq(customers.id, customerId)).limit(1);
    if (!customer) return NextResponse.json({ error: "no such customer" }, { status: 404 });

    // If exactly one repo is bound, use it. More than one is a choice a human
    // should make on Our GitHub, not one this form should guess at.
    const repos = await db
      .select()
      .from(boundResources)
      .where(and(eq(boundResources.customerId, customerId), eq(boundResources.provider, "github")));
    const repo = repos.length === 1 ? repos[0].resourceId : null;

    // An owner has to be able to see this customer, or it is a job nobody can work.
    if (ownerId) {
      const [owner] = await db.select().from(people).where(eq(people.id, ownerId)).limit(1);
      if (!owner) return NextResponse.json({ error: "no such person" }, { status: 404 });
      if (owner.kind === "agent" && owner.customerId !== customerId) {
        return NextResponse.json(
          { error: `${owner.name} is an agent for a different project and cannot be given this.` },
          { status: 400 },
        );
      }
    }

    const id = "J" + newId().slice(0, 8);
    await db.insert(jobs).values({
      id,
      customerId,
      title,
      status: ownerId ? "thinking" : "queued",
      ownerId,
      claimedAt: ownerId ? new Date() : null,
      agent: ownerId ? undefined : null,
      repo,
      goal: goal || title,
      scopeNote: String(body.scope || "").trim() || null,
      risk: "Opened by a human. Production is still a separate approval.",
      budgetCents: Math.round(budget * 100),
      spentCents: 0,
      tier: picked.id,
    });
    await db.insert(jobSteps).values({
      jobId: id,
      customerId,
      kind: "think",
      text: ownerId
        ? `Opened by ${actor} and handed straight to an agent. ${picked.label} · cap $${budget.toFixed(2)}.`
        : `Opened by ${actor}. On the board for any scoped session to claim. ${picked.label} · cap $${budget.toFixed(2)}.`,
      actor,
    });
    await db.insert(audit).values({
      customerId,
      actor,
      action: "opened a job",
      target: `${id} · $${budget.toFixed(2)}`,
      at: new Date(),
    });

    return NextResponse.json({ ok: true, id, repo, tier: picked.id });
  } catch (e) {
    return fail(e);
  }
}
