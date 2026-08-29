import { db } from "@/lib/db";
import { callLog } from "@/lib/schema";
import { escapeXml } from "@/lib/twilio";
import { readInbound, twiml } from "@/lib/twilio-inbound";
import { raiseEvent } from "@/lib/agent-events";
import { getAgencyKey } from "@/lib/keys";

/**
 * Somebody rang a customer's number.
 *
 * Today this forwards to whoever the shop answers on and records that the call
 * happened. It is deliberately the simplest thing that does not drop a call:
 * a missed call at a trades business is worth about $1,200, so an unfinished
 * clever answer here is far worse than a boring working one.
 *
 * This is also where the receptionist will live. Everything it needs is now
 * true — the call is attributed to one customer before a word is spoken, which
 * was impossible while every shop shared one number.
 */
export async function POST(req: Request) {
  const read = await readInbound(req, "/api/twilio/inbound/voice");
  if ("refusal" in read) return read.refusal;
  const { params, who } = read;

  if (!who) {
    // A number nobody has bound. Say so plainly rather than hanging up on a
    // real person who dialled a number we own.
    return twiml("<Say>This number is not in service. Please check the number and try again.</Say>");
  }

  const from = params.From ?? "";
  await db.insert(callLog).values({
    tenantId: who.tenantId,
    customerId: who.customerId,
    toNumber: who.number,
    fromNumber: from || null,
    direction: "in",
    outcome: "ringing",
    actor: "inbound",
    note: `Inbound to ${who.label}`,
    ref: params.CallSid ?? null,
  });

  // Their copilot hears about it now, not when somebody opens a screen.
  await raiseEvent({
    customerId: who.customerId,
    kind: "call",
    summary: `A call came in${from ? ` from ${from}` : ""} on ${who.number}.`,
    source: "twilio",
    refId: params.CallSid ?? null,
  });

  const forward = (await getAgencyKey("callback_number")) ?? process.env.OPERATOR_CALLBACK_NUMBER ?? "";
  if (!forward) {
    return twiml(
      "<Say>Thanks for calling. Nobody is available to take your call right now, " +
        "so please leave a message after the tone.</Say>" +
        '<Record maxLength="120" playBeep="true" />',
    );
  }
  // answerOnBridge so the caller hears ringing rather than silence, and the
  // caller id stays the shop's own number the person actually dialled.
  return twiml(
    `<Dial callerId="${escapeXml(who.number)}" answerOnBridge="true" timeout="20">` +
      `<Number>${escapeXml(forward)}</Number></Dial>` +
      "<Say>Sorry, we could not reach anyone. Please leave a message.</Say>" +
      '<Record maxLength="120" playBeep="true" />',
  );
}
