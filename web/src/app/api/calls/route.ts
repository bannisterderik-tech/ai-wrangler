import { NextResponse } from "next/server";
import { isOpen } from "@/lib/stages";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { fail, guard, operator } from "@/lib/api";
import { agencyLeads, callLog } from "@/lib/schema";

const OUTCOMES = ["dialled", "answered", "voicemail", "no-answer"];

/** The call board: who to ring, and what happened last time. */
export async function GET() {
  const denied = await guard();
  if (denied) return denied;
  const [leads, calls] = await Promise.all([
    db.select().from(agencyLeads).orderBy(desc(agencyLeads.createdAt)),
    db.select().from(callLog).orderBy(desc(callLog.at)).limit(200),
  ]);
  return NextResponse.json({
    outcomes: OUTCOMES,
    // Only people with a number are callable. A board full of rows you cannot
    // ring is a board nobody uses.
    board: leads
      .filter((l) => l.phone && isOpen(l.stage))
      .map((l) => ({
        id: l.id, company: l.company, contact: l.contact, phone: l.phone,
        city: l.city, stage: l.stage, value: l.valueCents / 100,
        lastCall: calls.find((c) => c.leadId === l.id)?.at ?? null,
        calls: calls.filter((c) => c.leadId === l.id).length,
      })),
    recent: calls.slice(0, 40).map((c) => ({
      id: c.id, leadId: c.leadId, to: c.toNumber, outcome: c.outcome,
      seconds: c.seconds, note: c.note, actor: c.actor, at: c.at,
    })),
  });
}

/** Log what happened. Twilio dials from the browser until per-customer DIDs exist. */
export async function POST(req: Request) {
  const denied = await guard();
  if (denied) return denied;
  const actor = (await operator())?.name || "you";
  try {
    const body = await req.json().catch(() => ({}));
    const leadId = String(body.leadId || "").trim() || null;
    const outcome = OUTCOMES.includes(String(body.outcome)) ? String(body.outcome) : "dialled";
    if (leadId) {
      const [lead] = await db.select().from(agencyLeads).where(eq(agencyLeads.id, leadId)).limit(1);
      if (!lead) return NextResponse.json({ error: "no such lead" }, { status: 404 });
      await db.update(agencyLeads).set({ lastTouchAt: new Date() }).where(eq(agencyLeads.id, leadId));
    }
    await db.insert(callLog).values({
      leadId,
      toNumber: String(body.to || "").trim() || null,
      outcome,
      seconds: Math.max(0, Number(body.seconds) || 0),
      note: String(body.note || "").trim() || null,
      actor,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return fail(e);
  }
}
