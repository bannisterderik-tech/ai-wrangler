import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { audit, receptionistCalls, receptionists } from "@/lib/schema";
import { fail, guardTenant, operator } from "@/lib/api";
import { customerIdsFor, customerInTenant, ownedBy } from "@/lib/tenant-scope";
import { numbersFor } from "@/lib/numbers";
import { aiConfigured } from "@/lib/ai";

const MODES = ["always", "after_hours", "on_no_answer"];

/** Who is answering the phone, and what they took. */
export async function GET() {
  const t = await guardTenant();
  if ("error" in t) return t.error;
  try {
    const ids = await customerIdsFor(t.tenantId);
    const [rows, calls, numbers] = await Promise.all([
      db.select().from(receptionists).where(ownedBy(receptionists.customerId, ids)),
      db
        .select()
        .from(receptionistCalls)
        .where(ownedBy(receptionistCalls.customerId, ids))
        .orderBy(desc(receptionistCalls.createdAt))
        .limit(40),
      numbersFor(t.tenantId),
    ]);
    return NextResponse.json({
      // It cannot answer anything without a model, and saying so beats a switch
      // that turns on and silently does nothing.
      ready: aiConfigured(),
      modes: MODES,
      receptionists: rows,
      // A receptionist with no number has no phone to answer.
      numbers: numbers.map((n) => ({ customerId: n.customerId, customerName: n.customerName, number: n.number })),
      calls: calls.map((c) => ({
        id: c.id, customerId: c.customerId, from: c.fromNumber, outcome: c.outcome,
        turns: c.turns, callerName: c.callerName, jobSummary: c.jobSummary,
        callback: c.callback, urgent: c.urgent, leadId: c.leadId,
        cost: c.costMillicents / 100000, at: c.createdAt,
      })),
    });
  } catch (e) {
    return fail(e);
  }
}

export async function POST(req: Request) {
  const t = await guardTenant();
  if ("error" in t) return t.error;
  const actor = (await operator())?.name || "you";
  try {
    const body = await req.json().catch(() => ({}));
    const customerId = String(body.customerId || "").trim();
    const c = await customerInTenant(t.tenantId, customerId);
    if (!c) return NextResponse.json({ error: "no such customer" }, { status: 404 });

    const str = (v: unknown, n = 400) => (v === undefined ? undefined : String(v ?? "").trim().slice(0, n) || null);
    const hours = body.hours ? JSON.stringify(body.hours).slice(0, 500) : undefined;
    const values = {
      customerId,
      tenantId: t.tenantId,
      enabled: body.enabled === true,
      mode: MODES.includes(String(body.mode)) ? String(body.mode) : "on_no_answer",
      businessName: str(body.businessName, 120) ?? c.name,
      greeting: str(body.greeting, 300),
      brief: str(body.brief, 1000),
      hoursJson: hours,
      forwardTo: str(body.forwardTo, 40),
      urgentWords: str(body.urgentWords, 400),
      // Bounded here as well as in the reader: a phone call cannot be allowed
      // to cost whatever a number in a form says it can.
      maxTurns: Math.max(2, Math.min(20, Number(body.maxTurns) || 8)),
      monthlyCapCents: Math.max(0, Math.min(500000, Math.round(Number(body.monthlyCap) * 100) || 2000)),
      updatedAt: new Date(),
    };

    await db.insert(receptionists).values(values).onConflictDoUpdate({
      target: receptionists.customerId,
      set: { ...values, customerId: undefined },
    });
    await db.insert(audit).values({
      customerId,
      actor,
      action: values.enabled ? `switched the assistant on (${values.mode})` : "switched the assistant off",
      target: c.name,
      at: new Date(),
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return fail(e);
  }
}
