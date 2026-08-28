import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { withCustomer } from "@/lib/db";
import { clientSession } from "@/lib/api";
import { leadEvents, leads } from "@/lib/schema";

/**
 * A client's own leads.
 *
 * Every read here goes through withCustomer, which drops to the wrangler_tenant
 * role with app.customer_id pinned. If this handler were written wrong — a
 * missing where clause, the wrong id — Postgres still returns nothing but their
 * own rows. That is the point of wall three, and this is the first route where
 * it is load-bearing rather than proven.
 */
export async function GET() {
  // Re-checked against the people table, not taken from the cookie: a client
  // who has been removed or moved must stop working immediately, not in a week.
  const who = await clientSession();
  if (!who) return NextResponse.json({ error: "not yours" }, { status: 403 });
  const session = who.session;

  const data = await withCustomer(who.customerId, async (tx) => {
    const rows = await tx.select().from(leads).orderBy(desc(leads.createdAt));
    const events = await tx.select().from(leadEvents).orderBy(desc(leadEvents.at));
    return { rows, events };
  });

  return NextResponse.json({
    you: { name: session.name, email: session.sub },
    leads: data.rows.map((l) => ({
      id: l.id,
      name: l.name,
      phone: l.phone,
      email: l.email,
      source: l.source,
      stage: l.stage,
      value: l.valueCents / 100,
      note: l.note,
      createdAt: l.createdAt,
      timeline: data.events
        .filter((e) => e.leadId === l.id)
        .map((e) => ({ kind: e.kind, direction: e.direction, body: e.body, at: e.at, actor: e.actor })),
    })),
  });
}

/** Log a call, a text or a note against a lead. */
export async function POST(req: Request) {
  // Re-checked against the people table, not taken from the cookie: a client
  // who has been removed or moved must stop working immediately, not in a week.
  const who = await clientSession();
  if (!who) return NextResponse.json({ error: "not yours" }, { status: 403 });
  const session = who.session;

  const body = await req.json().catch(() => ({}));
  const leadId = String(body.leadId || "");
  const kind = String(body.kind || "note");
  if (!leadId || !["call", "sms", "email", "note"].includes(kind)) {
    return NextResponse.json({ error: "leadId and a valid kind are required" }, { status: 400 });
  }

  const ok = await withCustomer(who.customerId, async (tx) => {
    // RLS makes this lookup the authorisation check: a lead belonging to anyone
    // else simply does not exist inside this transaction.
    const [lead] = await tx.select().from(leads).where(eq(leads.id, leadId)).limit(1);
    if (!lead) return false;
    await tx.insert(leadEvents).values({
      customerId: who.customerId,
      leadId,
      kind,
      direction: String(body.direction) === "in" ? "in" : "out",
      body: String(body.body || "").slice(0, 4000) || null,
      actor: session.name,
    });
    await tx.update(leads).set({ lastTouchAt: new Date() }).where(eq(leads.id, leadId));
    return true;
  });

  if (!ok) return NextResponse.json({ error: "no such lead" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
