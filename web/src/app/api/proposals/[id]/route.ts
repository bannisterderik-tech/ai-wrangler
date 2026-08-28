import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { fail, guard, operator } from "@/lib/api";
import { agencyLeads, audit, proposalItems, proposals } from "@/lib/schema";
import { newId } from "@/lib/customers";
import { loadProposal, proposalToken, renderDocument, totals } from "@/lib/proposals";
import { trustedOrigin } from "@/lib/origin";

const EDITABLE = new Set(["draft"]);

/** The whole proposal, plus the document exactly as the client will read it. */
export async function GET(req: Request, ctx: RouteContext<"/api/proposals/[id]">) {
  const denied = await guard();
  if (denied) return denied;
  try {
    const { id } = await ctx.params;
    const loaded = await loadProposal(id);
    if (!loaded) return NextResponse.json({ error: "no such proposal" }, { status: 404 });
    const [lead] = await db.select().from(agencyLeads).where(eq(agencyLeads.id, loaded.proposal.leadId)).limit(1);
    const document = renderDocument(loaded.proposal, loaded.items, lead?.company ?? "the client");
    return NextResponse.json({
      ...loaded,
      lead: lead ? { id: lead.id, company: lead.company, contact: lead.contact, email: lead.email } : null,
      document,
      link: loaded.proposal.token ? `${trustedOrigin(req)}/p/${loaded.proposal.token}` : null,
      editable: EDITABLE.has(loaded.proposal.status),
    });
  } catch (e) {
    return fail(e);
  }
}

/**
 * Edit a draft, or send it.
 *
 * A sent proposal is frozen. Editing one would change what somebody is being
 * asked to agree to — or worse, what they already agreed to — while the link in
 * their inbox stays the same. To change a sent proposal, void it and write
 * another one.
 */
export async function PATCH(req: Request, ctx: RouteContext<"/api/proposals/[id]">) {
  const denied = await guard();
  if (denied) return denied;
  const who = (await operator())?.name || "you";
  try {
    const { id } = await ctx.params;
    const body = await req.json().catch(() => ({}));
    const [p] = await db.select().from(proposals).where(eq(proposals.id, id)).limit(1);
    if (!p) return NextResponse.json({ error: "no such proposal" }, { status: 404 });

    if (body.action === "send") {
      if (p.status !== "draft") {
        return NextResponse.json({ error: `this proposal is already ${p.status}` }, { status: 409 });
      }
      const items = await db.select().from(proposalItems).where(eq(proposalItems.proposalId, id));
      if (!items.length) return NextResponse.json({ error: "add at least one line before sending" }, { status: 400 });
      const t = totals(items, p);
      if (t.onceCents + t.monthlyCents <= 0) {
        return NextResponse.json({ error: "this proposal is worth nothing — price it first" }, { status: 400 });
      }
      const token = proposalToken();
      const days = Math.min(90, Math.max(1, Number(body.expiresInDays) || 30));
      await db
        .update(proposals)
        .set({
          status: "sent",
          token,
          sentAt: new Date(),
          expiresAt: new Date(Date.now() + days * 86_400_000),
          // The totals are frozen onto the row at send time so a later change
          // to a line item cannot silently restate a sent price.
          onceCents: t.onceCents,
          monthlyCents: t.monthlyCents,
        })
        .where(eq(proposals.id, id));
      await db.insert(audit).values({
        customerId: null, actor: who, action: "sent a proposal", target: id, at: new Date(),
      });
      return NextResponse.json({ ok: true, link: `${trustedOrigin(req)}/p/${token}` });
    }

    if (body.action === "void") {
      await db.update(proposals).set({ status: "void", token: null }).where(eq(proposals.id, id));
      await db.insert(audit).values({
        customerId: null, actor: who, action: "voided a proposal", target: id, at: new Date(),
      });
      return NextResponse.json({ ok: true });
    }

    if (!EDITABLE.has(p.status)) {
      return NextResponse.json(
        { error: `a ${p.status} proposal cannot be edited. Void it and write another.` },
        { status: 409 },
      );
    }

    const patch: Record<string, unknown> = {};
    if (body.title !== undefined) patch.title = String(body.title).trim();
    if (body.summary !== undefined) patch.summary = String(body.summary).trim() || null;
    if (body.terms !== undefined) patch.terms = String(body.terms).trim() || null;
    if (body.depositKind !== undefined) {
      patch.depositKind = body.depositKind === "flat" ? "flat" : "percent";
    }
    if (body.depositPct !== undefined) {
      patch.depositPct = Math.min(100, Math.max(0, Math.round(Number(body.depositPct) || 0)));
    }
    if (body.depositCents !== undefined) {
      patch.depositCents = Math.max(0, Math.round(Number(body.depositCents) || 0));
    }
    if (Object.keys(patch).length) await db.update(proposals).set(patch).where(eq(proposals.id, id));

    // Lines are replaced wholesale — a diffing endpoint for a draft nobody has
    // seen is machinery without a purpose.
    if (Array.isArray(body.items)) {
      await db.delete(proposalItems).where(eq(proposalItems.proposalId, id));
      let sort = 0;
      for (const raw of body.items.slice(0, 60)) {
        const name = String(raw?.name || "").trim();
        if (!name) continue;
        await db.insert(proposalItems).values({
          id: "I" + newId().slice(0, 8),
          proposalId: id,
          name,
          detail: String(raw?.detail || "").trim() || null,
          cadence: raw?.cadence === "monthly" ? "monthly" : "once",
          qty: Math.max(1, Math.round(Number(raw?.qty) || 1)),
          unitCents: Math.max(0, Math.round(Number(raw?.unitCents) || 0)),
          sort: sort++,
        });
      }
    }

    const items = await db
      .select()
      .from(proposalItems)
      .where(eq(proposalItems.proposalId, id))
      .orderBy(asc(proposalItems.sort));
    const [fresh] = await db.select().from(proposals).where(eq(proposals.id, id)).limit(1);
    return NextResponse.json({ ok: true, ...totals(items, fresh) });
  } catch (e) {
    return fail(e);
  }
}

export async function DELETE(_req: Request, ctx: RouteContext<"/api/proposals/[id]">) {
  const denied = await guard();
  if (denied) return denied;
  try {
    const { id } = await ctx.params;
    const [p] = await db.select().from(proposals).where(eq(proposals.id, id)).limit(1);
    if (!p) return NextResponse.json({ error: "no such proposal" }, { status: 404 });
    if (p.status !== "draft") {
      return NextResponse.json(
        { error: "only a draft can be deleted. A sent proposal is a record — void it instead." },
        { status: 409 },
      );
    }
    await db.delete(proposals).where(eq(proposals.id, id));
    return NextResponse.json({ ok: true });
  } catch (e) {
    return fail(e);
  }
}
