import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { callLog } from "@/lib/schema";
import { readInbound } from "@/lib/twilio-inbound";
import { callCost, meter } from "@/lib/numbers";

/**
 * How a call ended, and what it cost.
 *
 * Twilio sends this when the call completes, which is the only point the
 * duration is known. It is also the first rebillable line in the product: you
 * cannot mark up what you never measured, and until numbers were per-customer
 * there was nothing to attribute a minute to.
 *
 * Twilio retries this callback, so the meter row carries the CallSid behind a
 * unique index — a redelivery updates nothing and counts nothing twice.
 */
export async function POST(req: Request) {
  const read = await readInbound(req, "/api/twilio/inbound/status");
  if ("refusal" in read) return read.refusal;
  const { params, who } = read;

  const sid = params.CallSid ?? "";
  const seconds = Number(params.CallDuration ?? 0) || 0;
  const status = params.CallStatus ?? "";

  if (sid) {
    await db
      .update(callLog)
      .set({
        seconds,
        outcome: status === "completed" ? "answered" : status === "no-answer" ? "no-answer" : status || "ended",
      })
      .where(eq(callLog.ref, sid));
  }

  if (who && seconds > 0) {
    await meter({
      customerId: who.customerId,
      tenantId: who.tenantId,
      kind: "call",
      quantity: seconds,
      unit: "seconds",
      costMillicents: callCost(seconds),
      ref: sid || null,
      detail: `${status} · ${params.From ?? ""} → ${params.To ?? ""}`,
    });
  }

  return NextResponse.json({ ok: true });
}
