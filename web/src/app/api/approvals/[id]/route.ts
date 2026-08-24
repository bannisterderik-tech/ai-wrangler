import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { approvals, audit, jobs, orchLog } from "@/lib/schema";

export async function POST(req: Request, ctx: RouteContext<"/api/approvals/[id]">) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const action = body.action === "approve" ? "approve" : "reject";
  const row = db.select().from(approvals).where(eq(approvals.id, id)).get();
  if (!row) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (row.status !== "pending") {
    return NextResponse.json({ error: "already resolved" }, { status: 409 });
  }

  db.update(approvals)
    .set({ status: action === "approve" ? "approved" : "rejected" })
    .where(eq(approvals.id, id))
    .run();

  if (row.jobId) {
    const job = db.select().from(jobs).where(eq(jobs.id, row.jobId)).get();
    const transcript = job?.transcriptJson ? JSON.parse(job.transcriptJson) : [];
    transcript.push({
      kind: "you",
      text:
        action === "approve" ? "You: yes, do it." : `You: send it back. ${body.note || "Not like this."}`,
    });
    db.update(jobs)
      .set({
        status: action === "approve" ? "working" : "queued",
        transcriptJson: JSON.stringify(transcript),
      })
      .where(eq(jobs.id, row.jobId))
      .run();
  }

  db.insert(orchLog)
    .values({
      customerId: row.customerId,
      tag: action === "approve" ? "you" : "paused",
      text: action === "approve" ? `approved: ${row.title}` : `sent back: ${row.title}`,
      at: new Date(),
    })
    .run();
  db.insert(audit)
    .values({
      customerId: row.customerId,
      actor: "you",
      action: action === "approve" ? "approved change" : "rejected change",
      target: row.title,
      at: new Date(),
    })
    .run();

  return NextResponse.json({ ok: true });
}
