import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { fail, operator, guardTenant } from "@/lib/api";
import { agencyLeads, audit } from "@/lib/schema";
import { newId } from "@/lib/customers";

// A prospect is a lead you have not engaged yet. One pipeline, one table:
// two would drift, and the day they drift the same shop is in both.
import { DEFAULT_STAGE, stageFrom, STAGE_IDS, STAGES } from "@/lib/stages";

/** The agency's own pipeline — shops buying web and technology from us. */
export async function GET() {
  const t = await guardTenant();
  if ("error" in t) return t.error;
  // Scoped, not just authorised. A guard that lets you in without saying which
  // rows are yours is a guard that hands you everybody's.
  const rows = await db
    .select()
    .from(agencyLeads)
    .where(eq(agencyLeads.tenantId, t.tenantId))
    .orderBy(desc(agencyLeads.createdAt));
  return NextResponse.json({
    stages: STAGE_IDS,
    stageMeta: STAGES,
    leads: rows.map((l) => ({
      id: l.id,
      company: l.company,
      contact: l.contact,
      phone: l.phone,
      email: l.email,
      city: l.city,
      trade: l.trade,
      source: l.source,
      stage: l.stage,
      value: l.valueCents / 100,
      note: l.note,
      createdAt: l.createdAt,
    })),
  });
}

export async function POST(req: Request) {
  const t = await guardTenant();
  if ("error" in t) return t.error;
  const actor = (await operator())?.name || "you";
  try {
    const body = await req.json().catch(() => ({}));
    const company = String(body.company || "").trim();
    if (!company) return NextResponse.json({ error: "who are they?" }, { status: 400 });
    // stageFrom, not an exact-id check: the MCP tools and anything written
    // against the old six-stage names still send "talking" and "proposal", and
    // translating those beats silently filing them at the top of the pipeline.
    const stage = body.stage ? stageFrom(body.stage) : DEFAULT_STAGE;
    const value = Number(body.value);
    const id = "L" + newId().slice(0, 8);
    await db.insert(agencyLeads).values({
      id,
      tenantId: t.tenantId,
      company,
      contact: String(body.contact || "").trim() || null,
      phone: String(body.phone || "").trim() || null,
      email: String(body.email || "").trim() || null,
      city: String(body.city || "").trim() || null,
      trade: String(body.trade || "").trim() || null,
      source: String(body.source || "").trim() || null,
      stage,
      valueCents: Number.isFinite(value) && value > 0 ? Math.round(value * 100) : 0,
      note: String(body.note || "").trim() || null,
    });
    await db.insert(audit).values({ customerId: null, actor, action: "added a lead", target: company, at: new Date() });
    return NextResponse.json({ ok: true, id });
  } catch (e) {
    return fail(e);
  }
}

/** Move a lead along, or record that you touched it. */
export async function PATCH(req: Request) {
  const t = await guardTenant();
  if ("error" in t) return t.error;
  const actor = (await operator())?.name || "you";
  try {
    const body = await req.json().catch(() => ({}));
    const id = String(body.id || "");
    const [lead] = await db
      .select()
      .from(agencyLeads)
      .where(and(eq(agencyLeads.id, id), eq(agencyLeads.tenantId, t.tenantId)))
      .limit(1);
    if (!lead) return NextResponse.json({ error: "no such lead" }, { status: 404 });

    const patch: Record<string, unknown> = { lastTouchAt: new Date() };
    if (body.stage !== undefined) {
      if (!STAGE_IDS.includes(String(body.stage))) return NextResponse.json({ error: "unknown stage" }, { status: 400 });
      patch.stage = String(body.stage);
    }
    if (body.note !== undefined) patch.note = String(body.note).slice(0, 4000) || null;
    if (body.value !== undefined) {
      const v = Number(body.value);
      patch.valueCents = Number.isFinite(v) && v > 0 ? Math.round(v * 100) : 0;
    }
    await db.update(agencyLeads).set(patch).where(eq(agencyLeads.id, id));
    if (patch.stage) {
      await db.insert(audit).values({
        customerId: null, actor, action: `lead → ${patch.stage}`, target: lead.company, at: new Date(),
      });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return fail(e);
  }
}
