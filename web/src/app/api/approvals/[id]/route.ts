import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { guard, operator } from "@/lib/api";
import { approvals, audit, jobs, orchLog } from "@/lib/schema";

export async function POST(req: Request, ctx: RouteContext<"/api/approvals/[id]">) {
  const denied = await guard();
  if (denied) return denied;
  const who = (await operator())?.name || "you";
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const action = body.action === "approve" ? "approve" : "reject";
  const [row] = await db.select().from(approvals).where(eq(approvals.id, id)).limit(1);
  if (!row) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (row.status !== "pending") {
    return NextResponse.json({ error: "already resolved" }, { status: 409 });
  }

  // Only the first resolver wins — two tabs cannot approve the same thing twice.
  const claimed = await db
    .update(approvals)
    .set({ status: action === "approve" ? "approved" : "rejected" })
    .where(eq(approvals.id, id))
    .returning({ id: approvals.id });
  if (!claimed.length) return NextResponse.json({ error: "already resolved" }, { status: 409 });

  if (row.jobId) {
    const [job] = await db.select().from(jobs).where(eq(jobs.id, row.jobId)).limit(1);
    const transcript = job?.transcriptJson ? JSON.parse(job.transcriptJson) : [];
    transcript.push({
      kind: "you",
      text:
        action === "approve" ? "You: yes, do it." : `You: send it back. ${body.note || "Not like this."}`,
    });
    await db
      .update(jobs)
      .set({
        status: action === "approve" ? "working" : "queued",
        transcriptJson: JSON.stringify(transcript),
      })
      .where(eq(jobs.id, row.jobId));
  }

  await db.insert(orchLog).values({
    customerId: row.customerId,
    tag: action === "approve" ? "you" : "paused",
    text: action === "approve" ? `approved: ${row.title}` : `sent back: ${row.title}`,
    at: new Date(),
  });
  await db.insert(audit).values({
    customerId: row.customerId,
    actor: who,
    action: action === "approve" ? "approved change" : "rejected change",
    target: row.title,
    at: new Date(),
  });

  return NextResponse.json({ ok: true });
}
