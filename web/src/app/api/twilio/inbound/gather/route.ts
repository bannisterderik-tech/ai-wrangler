import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { agencyLeads, orchLog, receptionistCalls } from "@/lib/schema";
import { newId } from "@/lib/customers";
import { readInbound, twiml } from "@/lib/twilio-inbound";
import { meter } from "@/lib/numbers";
import { raiseEvent } from "@/lib/agent-events";
import { configFor, decide, overCap, readTranscript, type Turn } from "@/lib/receptionist";
import { handOver, sayAndListen, signOff } from "@/lib/receptionist-twiml";

/**
 * One turn of a call the assistant is handling.
 *
 * Twilio is stateless between webhooks — this arrives as a fresh request
 * carrying only the CallSid — so the conversation is read from and written back
 * to the database on every turn.
 *
 * Every path out of here ends with a person, a voicemail, or a clean goodbye.
 * There is no branch that leaves somebody listening to silence, because the one
 * thing this must never do is lose the call it exists to catch.
 */
export async function POST(req: Request) {
  const read = await readInbound(req, "/api/twilio/inbound/gather");
  if ("refusal" in read) return read.refusal;
  const { params, who } = read;

  const callSid = params.CallSid ?? "";
  const heard = (params.SpeechResult ?? "").trim();

  if (!who || !callSid) return twiml(signOff("Sorry, something went wrong. Please call again."));

  const config = await configFor(who.customerId);
  const [call] = await db
    .select()
    .from(receptionistCalls)
    .where(eq(receptionistCalls.callSid, callSid))
    .limit(1);

  if (!config || !call) {
    return twiml(handOver("Let me put you through.", config?.forwardTo ?? null, who.number));
  }

  const transcript = readTranscript(call.transcriptJson);
  const forward = config.forwardTo;

  // Nothing said. Twilio posts here anyway because of actionOnEmptyResult, so
  // this is a real silence rather than a dropped webhook — one nudge, then a
  // person, rather than asking a silent line the same question forever.
  if (!heard) {
    if (call.turns >= 1) {
      await close(call.id, "transferred", transcript);
      return twiml(handOver("I did not catch that. Let me put you through.", forward, who.number));
    }
    await bump(call.id, call.turns + 1, transcript);
    return twiml(sayAndListen("Sorry, I did not catch that. What do you need help with?", url(req)));
  }

  transcript.push({ who: "them", text: heard.slice(0, 500) });

  // The bounds, checked before a model is asked anything. A caller reaching
  // either of these gets a person, not an apology.
  if (call.turns + 1 >= config.maxTurns) {
    await close(call.id, "transferred", transcript);
    return twiml(handOver("Let me get you to someone who can help properly.", forward, who.number));
  }
  if (await overCap(config)) {
    await close(call.id, "transferred", transcript);
    return twiml(handOver("Let me put you through to someone.", forward, who.number));
  }

  const { decision, costMillicents } = await decide(config, transcript.slice(0, -1), heard);
  transcript.push({ who: "it", text: decision.say });

  if (costMillicents > 0) {
    await meter({
      customerId: who.customerId,
      tenantId: who.tenantId,
      kind: "ai",
      quantity: 1,
      unit: "turns",
      costMillicents,
      // One row per turn, so a redelivered webhook does not bill the same
      // sentence twice.
      ref: `${callSid}:${call.turns + 1}`,
      detail: "receptionist",
    });
  }

  const found = {
    callerName: decision.callerName ?? call.callerName ?? null,
    jobSummary: decision.jobSummary ?? call.jobSummary ?? null,
    callback: decision.callback ?? call.callback ?? call.fromNumber ?? null,
    urgent: decision.urgent || call.urgent,
  };

  if (decision.next === "transfer") {
    await close(call.id, "transferred", transcript, found, costMillicents);
    await captureLead(call.id, who, found, transcript, true);
    return twiml(handOver(decision.say, forward, who.number));
  }

  if (decision.next === "capture") {
    await close(call.id, "captured", transcript, found, costMillicents);
    await captureLead(call.id, who, found, transcript, false);
    return twiml(signOff(decision.say));
  }

  await bump(call.id, call.turns + 1, transcript, found, costMillicents);
  return twiml(sayAndListen(decision.say, url(req)));
}

const url = (req: Request) => new URL(req.url).pathname;

type Found = { callerName: string | null; jobSummary: string | null; callback: string | null; urgent: boolean };

async function bump(id: string, turns: number, transcript: Turn[], found?: Found, cost = 0) {
  await db
    .update(receptionistCalls)
    .set({
      turns,
      transcriptJson: JSON.stringify(transcript.slice(-40)),
      updatedAt: new Date(),
      ...(found ?? {}),
      ...(cost ? { costMillicents: cost } : {}),
    })
    .where(eq(receptionistCalls.id, id));
}

async function close(id: string, outcome: string, transcript: Turn[], found?: Found, cost = 0) {
  await db
    .update(receptionistCalls)
    .set({
      outcome,
      transcriptJson: JSON.stringify(transcript.slice(-40)),
      updatedAt: new Date(),
      ...(found ?? {}),
      ...(cost ? { costMillicents: cost } : {}),
    })
    .where(eq(receptionistCalls.id, id));
}

/**
 * Put the call in front of a human, in the CRM.
 *
 * The whole point: a call answered at eleven at night is a job on the board in
 * the morning, not a voicemail somebody might listen to. Written once — a
 * redelivered webhook must not create a second lead for one call.
 */
async function captureLead(
  id: string,
  who: { customerId: string; tenantId: string; customerName: string },
  found: Found,
  transcript: Turn[],
  urgent: boolean,
) {
  const [row] = await db.select().from(receptionistCalls).where(eq(receptionistCalls.id, id)).limit(1);
  if (!row || row.leadId) return;

  const leadId = "L" + newId().slice(0, 10);
  await db.insert(agencyLeads).values({
    id: leadId,
    tenantId: who.tenantId,
    company: found.callerName || found.callback || "Caller",
    contact: found.callerName ?? null,
    phone: found.callback ?? null,
    stage: "lead",
    source: "answered by the assistant",
    note:
      (found.jobSummary ? `${found.jobSummary}\n\n` : "") +
      transcript.map((t) => `${t.who === "them" ? "Them" : "Us"}: ${t.text}`).join("\n"),
  });
  await db.update(receptionistCalls).set({ leadId }).where(eq(receptionistCalls.id, id));

  await db.insert(orchLog).values({
    customerId: who.customerId,
    tag: "you",
    text:
      `${urgent ? "URGENT — " : ""}The assistant took a call` +
      `${found.callerName ? ` from ${found.callerName}` : ""}` +
      `${found.jobSummary ? `: ${found.jobSummary}` : ""}` +
      `${found.callback ? ` · call back on ${found.callback}` : ""}`,
    at: new Date(),
  });
  await raiseEvent({
    customerId: who.customerId,
    kind: "lead",
    summary: `${urgent ? "Urgent: " : ""}the assistant took a call${found.jobSummary ? ` — ${found.jobSummary}` : ""}`,
    source: "receptionist",
    refId: leadId,
  });
}
