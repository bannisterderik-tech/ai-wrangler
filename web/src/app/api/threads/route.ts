import { NextResponse } from "next/server";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { fail, guardTenant, operator } from "@/lib/api";
import { agencyLeads, customers, messages, threads } from "@/lib/schema";
import { newId } from "@/lib/customers";
import { customerInTenant } from "@/lib/tenant-scope";

const CHANNELS = ["sms", "email", "call", "note"];

/** Every conversation, with whoever it is with. */
export async function GET() {
  const t = await guardTenant();
  if ("error" in t) return t.error;
  // threads carries tenant_id; messages does not, so they are fetched by the
  // thread ids this agency owns rather than read whole and filtered after.
  const [rows, custs, leads] = await Promise.all([
    db.select().from(threads).where(eq(threads.tenantId, t.tenantId)).orderBy(desc(threads.lastAt)),
    db.select().from(customers).where(eq(customers.tenantId, t.tenantId)),
    db.select().from(agencyLeads).where(eq(agencyLeads.tenantId, t.tenantId)),
  ]);
  const threadIds = rows.map((r) => r.id);
  const msgs = threadIds.length
    ? await db.select().from(messages).where(inArray(messages.threadId, threadIds)).orderBy(asc(messages.id))
    : [];
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
  const t = await guardTenant();
  if ("error" in t) return t.error;
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
      const customerId = String(body.customerId || "").trim() || null;
      // Attaching a conversation to a customer has to mean one of yours.
      if (customerId && !(await customerInTenant(t.tenantId, customerId))) {
        return NextResponse.json({ error: "no such customer" }, { status: 404 });
      }
      threadId = "T" + newId().slice(0, 8);
      await db.insert(threads).values({
        id: threadId,
        // Stamped from the session, never from the body. Without this every
        // thread any agency started landed in the house account.
        tenantId: t.tenantId,
        who,
        subject: String(body.subject || "").trim() || null,
        channel,
        phone: String(body.phone || "").trim() || null,
        email: String(body.email || "").trim() || null,
        customerId,
        leadId: String(body.leadId || "").trim() || null,
      });
    } else {
      // Named `existing`, not `t` — the old name shadowed the guard, so the
      // tenant was out of scope exactly where it needed checking.
      const [existing] = await db
        .select()
        .from(threads)
        .where(and(eq(threads.id, threadId), eq(threads.tenantId, t.tenantId)))
        .limit(1);
      if (!existing) return NextResponse.json({ error: "no such thread" }, { status: 404 });
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
