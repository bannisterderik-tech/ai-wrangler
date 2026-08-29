import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { guardBuild } from "@/lib/api";
import { inbox, jobs, orchLog } from "@/lib/schema";
import { newId } from "@/lib/customers";
import { customerInTenant } from "@/lib/tenant-scope";

// Turning a message into a job puts an agent and a spend cap on it, so this is
// the build half of the product, not the CRM half.
export async function POST(_req: Request, ctx: RouteContext<"/api/inbox/[id]/wrangle">) {
  const t = await guardBuild();
  if ("error" in t) return t.error;
  const { id } = await ctx.params;
  const [row] = await db.select().from(inbox).where(eq(inbox.id, id)).limit(1);
  // Another agency's message reads as not found — the same answer as one that
  // never existed, so the refusal never confirms it is there.
  if (!row || !(await customerInTenant(t.tenantId, row.customerId))) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  await db.update(inbox).set({ status: "tasked" }).where(eq(inbox.id, id));
  const jobId = "R" + newId().slice(0, 8);
  await db.insert(jobs).values({
    id: jobId,
    customerId: row.customerId,
    title: row.task,
    status: "queued",
    harness: "claude-code-mcp",
    tier: "Medium brain",
    spentCents: 0,
    budgetCents: 1000,
    cache: 60,
    transcriptJson: JSON.stringify([
      { kind: "note", text: `From inbox (${row.via}): ${row.fromName}` },
      { kind: "think", text: row.text },
    ]),
    createdAt: new Date(),
  });
  await db.insert(orchLog).values({
    customerId: row.customerId,
    tag: "assign",
    text: `inbox → task “${row.task}”`,
    at: new Date(),
  });
  return NextResponse.json({ ok: true, jobId });
}
