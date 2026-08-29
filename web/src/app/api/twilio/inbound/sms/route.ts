import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { messages, threads } from "@/lib/schema";
import { newId } from "@/lib/customers";
import { readInbound, twiml } from "@/lib/twilio-inbound";
import { meter, smsCost } from "@/lib/numbers";
import { raiseEvent } from "@/lib/agent-events";

/**
 * A text to a customer's number.
 *
 * It lands in that customer's conversation — the same threads the desk shows —
 * so an inbound text and an outbound one are one conversation rather than two
 * halves nobody can line up.
 */
export async function POST(req: Request) {
  const read = await readInbound(req, "/api/twilio/inbound/sms");
  if ("refusal" in read) return read.refusal;
  const { params, who } = read;
  if (!who) return twiml("");

  const from = params.From ?? "";
  const body = (params.Body ?? "").slice(0, 4000);

  // Continue the conversation with this person if there is one, rather than
  // starting a new thread on every message.
  const [existing] = await db
    .select()
    .from(threads)
    .where(and(eq(threads.customerId, who.customerId), eq(threads.phone, from)))
    .orderBy(desc(threads.lastAt))
    .limit(1);

  let threadId = existing?.id;
  if (!threadId) {
    threadId = "T" + newId().slice(0, 8);
    await db.insert(threads).values({
      id: threadId,
      tenantId: who.tenantId,
      customerId: who.customerId,
      who: from || "Unknown number",
      channel: "sms",
      phone: from || null,
    });
  }

  await db.insert(messages).values({
    threadId,
    direction: "in",
    channel: "sms",
    body,
    actor: from || "them",
  });
  await db.update(threads).set({ lastAt: new Date(), unread: true }).where(eq(threads.id, threadId));

  // Inbound segments are billed too, so they are metered too.
  await meter({
    customerId: who.customerId,
    tenantId: who.tenantId,
    kind: "sms",
    quantity: Number(params.NumSegments ?? 1) || 1,
    unit: "segments",
    costMillicents: smsCost(Number(params.NumSegments ?? 1) || 1),
    ref: params.MessageSid ?? null,
    detail: `in from ${from}`,
  });

  await raiseEvent({
    customerId: who.customerId,
    kind: "message",
    summary: `A text came in${from ? ` from ${from}` : ""}: ${body.slice(0, 140)}`,
    source: "twilio",
    refId: params.MessageSid ?? null,
  });

  // Empty TwiML: no auto-reply. A machine answering a real person's text
  // without anyone deciding to is worse than a slightly slower human.
  return twiml("");
}
