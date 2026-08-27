import { NextResponse } from "next/server";
import { asc, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { guard } from "@/lib/api";
import { approvals, changes, customers, jobSteps, jobs, people } from "@/lib/schema";

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
    people: crew.map((p) => ({ id: p.id, name: p.name, handle: p.handle, status: p.status })),
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
  });
}
