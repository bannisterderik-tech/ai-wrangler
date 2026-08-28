import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { fail, operator, guardTenant } from "@/lib/api";
import { agencyLeads, audit, proposalItems, proposals } from "@/lib/schema";
import { newId } from "@/lib/customers";
import { totals } from "@/lib/proposals";

/** Proposals for a lead, newest first. */
export async function GET(req: Request) {
  const t = await guardTenant();
  if ("error" in t) return t.error;
  try {
    const leadId = new URL(req.url).searchParams.get("leadId");
    const mine = eq(proposals.tenantId, t.tenantId);
    const rows = leadId
      ? await db.select().from(proposals).where(and(mine, eq(proposals.leadId, leadId))).orderBy(desc(proposals.createdAt))
      : await db.select().from(proposals).where(mine).orderBy(desc(proposals.createdAt)).limit(50);

    const out = [];
    for (const p of rows) {
      const items = await db.select().from(proposalItems).where(eq(proposalItems.proposalId, p.id));
      out.push({
        id: p.id,
        leadId: p.leadId,
        title: p.title,
        status: p.status,
        currency: p.currency,
        depositKind: p.depositKind,
        depositPct: p.depositPct,
        depositFlatCents: p.depositCents,
        sentAt: p.sentAt,
        viewedAt: p.viewedAt,
        customerId: p.customerId,
        ...totals(items, p),
      });
    }
    return NextResponse.json({ proposals: out });
  } catch (e) {
    return fail(e);
  }
}

/** Start a proposal on a lead. It opens as a draft — sending is a separate act. */
export async function POST(req: Request) {
  const t = await guardTenant();
  if ("error" in t) return t.error;
  const who = (await operator())?.name || "you";
  try {
    const body = await req.json().catch(() => ({}));
    const leadId = String(body.leadId || "").trim();
    const title = String(body.title || "").trim();
    if (!leadId) return NextResponse.json({ error: "which lead is this for?" }, { status: 400 });
    if (!title) return NextResponse.json({ error: "give the proposal a title" }, { status: 400 });

    // Scoped: a proposal cannot be attached to another tenant's lead, and the
    // refusal is the same 404 either way so the pipeline cannot be probed.
    const [lead] = await db
      .select()
      .from(agencyLeads)
      .where(and(eq(agencyLeads.id, leadId), eq(agencyLeads.tenantId, t.tenantId)))
      .limit(1);
    if (!lead) return NextResponse.json({ error: "no such lead" }, { status: 404 });

    const id = "Q" + newId().slice(0, 8);
    await db.insert(proposals).values({
      id,
      tenantId: t.tenantId,
      leadId,
      title,
      summary: String(body.summary || "").trim() || null,
      terms: String(body.terms || "").trim() || null,
      createdBy: who,
    });
    await db.insert(audit).values({
      customerId: null, actor: who, action: "started a proposal", target: `${id} · ${lead.company}`, at: new Date(),
    });
    return NextResponse.json({ ok: true, id });
  } catch (e) {
    return fail(e);
  }
}
