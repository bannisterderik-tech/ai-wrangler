import { NextResponse } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { fail, guardTenant, operator } from "@/lib/api";
import { agencyLeads, audit, customers, memories, partners } from "@/lib/schema";
import { newId } from "@/lib/customers";
import { slug } from "@/lib/crypto";

const money = (c: number) => `$${(c / 100).toLocaleString()}`;

/**
 * Turn leads into what they actually are.
 *
 * A lead who bought is a customer. A lead who turned out to be another agency
 * is a partner. Neither is a stage change — they belong in a different table
 * with a different life.
 *
 * Said plainly because it matters: converting here is a HUMAN saying so. The
 * other route to becoming a customer is the deposit webhook, where money
 * actually moved, and that one is the trustworthy one. This exists for the
 * deals that closed offline or arrived in an import, and it records itself as a
 * person's decision rather than pretending a payment happened.
 */
export async function POST(req: Request) {
  const t = await guardTenant();
  if ("error" in t) return t.error;
  const actor = (await operator())?.name || "you";
  try {
    const body = await req.json().catch(() => ({}));
    const ids: string[] = Array.isArray(body.ids) ? body.ids.map(String).slice(0, 200) : [];
    const into = String(body.into || "");
    if (!ids.length) return NextResponse.json({ error: "pick at least one lead" }, { status: 400 });
    if (!["customer", "partner"].includes(into)) {
      return NextResponse.json({ error: "convert into a customer or a partner" }, { status: 400 });
    }

    // Scoped: only this account's leads, and the same refusal for anything else.
    const rows = await db
      .select()
      .from(agencyLeads)
      .where(and(inArray(agencyLeads.id, ids), eq(agencyLeads.tenantId, t.tenantId)));
    if (!rows.length) return NextResponse.json({ error: "none of those are on this account" }, { status: 404 });

    const made: { id: string; name: string; was: string }[] = [];
    const skipped: { name: string; why: string }[] = [];

    for (const l of rows) {
      if (into === "customer") {
        const id = slug(l.company).slice(0, 60) || `customer-${newId().slice(0, 6)}`;
        // Customer ids are global slugs, so "acme" can already belong to
        // another agency. Checking only our own tenant would report a customer
        // made that the insert then quietly dropped on the primary key.
        const [existing] = await db.select().from(customers).where(eq(customers.id, id)).limit(1);
        if (existing && existing.tenantId !== t.tenantId) {
          skipped.push({ name: l.company, why: "that name is taken — add them by hand" });
          continue;
        }
        if (existing) {
          skipped.push({ name: l.company, why: "already a customer" });
        } else {
          await db.insert(customers).values({ id, name: l.company, tenantId: t.tenantId }).onConflictDoNothing();
          made.push({ id, name: l.company, was: l.stage });
        }
        // What we know about them, carried across, so the record does not start
        // empty the moment they become worth something.
        const note = [
          l.contact ? `Their contact is ${l.contact}.` : "",
          l.phone ? `Phone ${l.phone}.` : "",
          l.trade ? `They do ${l.trade}.` : "",
          l.valueCents ? `Agreed at ${money(l.valueCents)}/mo.` : "",
          l.note ?? "",
        ]
          .filter(Boolean)
          .join(" ");
        if (note) {
          await db
            .insert(memories)
            .values({
              id: `M_${l.id}`,
              customerId: id,
              text: note.slice(0, 1000),
              kind: "note",
              source: `converted from a lead by ${actor}`,
            })
            .onConflictDoNothing();
        }
        await db.update(agencyLeads).set({ stage: "won" }).where(eq(agencyLeads.id, l.id));
      } else {
        const id = `P_${slug(l.company).slice(0, 40) || newId().slice(0, 8)}`;
        const [existing] = await db.select().from(partners).where(eq(partners.id, id)).limit(1);
        if (existing) {
          skipped.push({ name: l.company, why: "already a partner" });
          continue;
        }
        await db.insert(partners).values({
          id,
          tenantId: t.tenantId,
          name: l.company,
          operatorName: l.contact,
          email: l.email,
          phone: l.phone,
          territory: l.city,
          tier: "operator",
          status: "applied",
          note: `Converted from a lead by ${actor}.${l.note ? ` ${l.note}` : ""}`.slice(0, 500),
        });
        // Out of the pipeline: a partner is not a deal we are trying to close,
        // and leaving them in would inflate what is in play.
        await db.update(agencyLeads).set({ stage: "won" }).where(eq(agencyLeads.id, l.id));
        made.push({ id, name: l.company, was: l.stage });
      }
    }

    await db.insert(audit).values({
      customerId: null,
      actor,
      // Recorded as a decision, not as a payment.
      action: `converted ${made.length} lead(s) into ${into}s by hand`,
      target: made.map((m) => m.name).join(", ").slice(0, 300) || null,
      at: new Date(),
    });

    return NextResponse.json({ ok: true, made, skipped });
  } catch (e) {
    return fail(e);
  }
}
