import { db } from "@/lib/db";
import { callLog } from "@/lib/schema";
import { escapeXml } from "@/lib/twilio";
import { readInbound, twiml } from "@/lib/twilio-inbound";
import { raiseEvent } from "@/lib/agent-events";
import { getAgencyKey } from "@/lib/keys";
import { answersNow, callRecord, configFor, opening, overCap } from "@/lib/receptionist";
import { sayAndListen } from "@/lib/receptionist-twiml";

/**
 * Somebody rang a customer's number.
 *
 * Three ways this goes, which is how the trade actually runs it:
 *
 *   always       — the assistant picks up every call.
 *   after_hours  — humans in the day, the assistant at night and weekends.
 *   on_no_answer — ring the humans first; whatever they miss falls through to
 *                  the assistant rather than to voicemail.
 *
 * The last one is the default, and it is the one that earns its keep: the
 * office keeps answering exactly as it did, and the calls that used to become
 * voicemail become jobs instead.
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

  const config = await configFor(who.customerId);
  const forward =
    config?.forwardTo ||
    (await getAgencyKey("callback_number")) ||
    process.env.OPERATOR_CALLBACK_NUMBER ||
    "";

  // Answering straight away, if that is what they asked for and it is affordable.
  if (config && answersNow(config) && !(await overCap(config))) {
    await callRecord(params.CallSid ?? "", who, from);
    return twiml(sayAndListen(opening(config), "/api/twilio/inbound/gather", config.brief ?? undefined));
  }

  const catches = Boolean(config?.enabled && config.mode === "on_no_answer");

  if (!forward) {
    // Nobody to ring. The assistant is better than a beep if it is switched on.
    if (catches && config && !(await overCap(config))) {
      await callRecord(params.CallSid ?? "", who, from);
      return twiml(sayAndListen(opening(config), "/api/twilio/inbound/gather", config.brief ?? undefined));
    }
    return twiml(
      "<Say>Thanks for calling. Nobody is available to take your call right now, " +
        "so please leave a message after the tone.</Say>" +
        '<Record maxLength="120" playBeep="true" />',
    );
  }

  // Ring the humans. `action` is where Twilio goes when the <Dial> ends — which
  // includes nobody answering — so that is where the assistant catches it.
  const afterDial = catches ? ` action="/api/twilio/inbound/missed" method="POST"` : "";
  return twiml(
    `<Dial callerId="${escapeXml(who.number)}" answerOnBridge="true" timeout="20"${afterDial}>` +
      `<Number>${escapeXml(forward)}</Number></Dial>` +
      (catches
        ? ""
        : "<Say>Sorry, we could not reach anyone. Please leave a message.</Say>" +
          '<Record maxLength="120" playBeep="true" />'),
  );
}
