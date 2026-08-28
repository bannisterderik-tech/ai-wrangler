import { NextResponse } from "next/server";
import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { fail, guard, operator } from "@/lib/api";
import { agencyLeads, customers, messages, threads } from "@/lib/schema";
import { newId } from "@/lib/customers";

const CHANNELS = ["sms", "email", "call", "note"];

/** Every conversation, with whoever it is with. */
export async function GET() {
  const denied = await guard();
  if (denied) return denied;
  const [rows, msgs, custs, leads] = await Promise.all([
    db.select().from(threads).orderBy(desc(threads.lastAt)),
    db.select().from(messages).orderBy(asc(messages.id)),
    db.select().from(customers),
    db.select().from(agencyLeads),
  ]);
  return NextResponse.json({
    channels: CHANNELS,
    customers: custs.map((c) => ({ id: c.id, name: c.name })),
    leads: leads.map((l) => ({ id: l.id, company: l.company, phone: l.phone })),
    threads: rows.map((t) => ({
      id: t.id, who: t.who, subject: t.subject, channel: t.channel, phone: t.phone, email: t.email,
      customer: custs.find((c) => c.id === t.customerId)?.name ?? null,
      lead: leads.find((l) => l.id === t.leadId)?.company ?? null,
      unread: t.unread,
      lastAt: t.lastAt,
      messages: msgs
        .filter((m) => m.threadId === t.id)
        .map((m) => ({ direction: m.direction, channel: m.channel, body: m.body, actor: m.actor, at: m.at })),
    })),
  });
}

/** Start a conversation, or add to one. */
export async function POST(req: Request) {
  const denied = await guard();
  if (denied) return denied;
  const actor = (await operator())?.name || "you";
  try {
    const body = await req.json().catch(() => ({}));
    const text = String(body.body || "").trim();
    if (!text) return NextResponse.json({ error: "nothing to send" }, { status: 400 });
    const channel = CHANNELS.includes(String(body.channel)) ? String(body.channel) : "sms";

    let threadId = String(body.threadId || "").trim();
    if (!threadId) {
      const who = String(body.who || "").trim();
      if (!who) return NextResponse.json({ error: "who is it with?" }, { status: 400 });
      threadId = "T" + newId().slice(0, 8);
      await db.insert(threads).values({
        id: threadId,
        who,
        subject: String(body.subject || "").trim() || null,
        channel,
        phone: String(body.phone || "").trim() || null,
        email: String(body.email || "").trim() || null,
        customerId: String(body.customerId || "").trim() || null,
        leadId: String(body.leadId || "").trim() || null,
      });
    } else {
      const [t] = await db.select().from(threads).where(eq(threads.id, threadId)).limit(1);
      if (!t) return NextResponse.json({ error: "no such thread" }, { status: 404 });
    }

    await db.insert(messages).values({
      threadId,
      direction: String(body.direction) === "in" ? "in" : "out",
      channel,
      body: text.slice(0, 4000),
      actor,
    });
    // Reading a thread is what clears it, and writing into one means you read it.
    await db.update(threads).set({ lastAt: new Date(), unread: false }).where(eq(threads.id, threadId));

    return NextResponse.json({ ok: true, threadId });
  } catch (e) {
    return fail(e);
  }
}
