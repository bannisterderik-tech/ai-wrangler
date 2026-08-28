import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { fail, guard, operator } from "@/lib/api";
import { audit, partners } from "@/lib/schema";
import { newId } from "@/lib/customers";

const TIERS: Record<string, { royalty: number; fee: number; exclusive: boolean }> = {
  founding: { royalty: 18, fee: 0, exclusive: true },
  operator: { royalty: 12, fee: 95000, exclusive: true },
  associate: { royalty: 8, fee: 45000, exclusive: false },
};
const STATUSES = ["applied", "onboarding", "live", "paused"];

/** Franchise licensees. One market, one partner — the index enforces it. */
export async function GET() {
  const denied = await guard();
  if (denied) return denied;
  const rows = await db.select().from(partners).orderBy(asc(partners.name));
  return NextResponse.json({
    tiers: Object.entries(TIERS).map(([id, t]) => ({ id, ...t, fee: t.fee / 100 })),
    statuses: STATUSES,
    partners: rows.map((p) => ({
      id: p.id, name: p.name, operator: p.operatorName, email: p.email, phone: p.phone,
      territory: p.territory, tier: p.tier, status: p.status, customers: p.customers,
      book: p.bookCents / 100, royaltyPct: p.royaltyPct, fee: p.feeCents / 100,
      collect: Math.round((p.bookCents * p.royaltyPct) / 100 + p.feeCents) / 100,
      note: p.note, since: p.since,
    })),
  });
}

export async function POST(req: Request) {
  const denied = await guard();
  if (denied) return denied;
  const actor = (await operator())?.name || "you";
  try {
    const body = await req.json().catch(() => ({}));
    const name = String(body.name || "").trim();
    if (!name) return NextResponse.json({ error: "what is the agency called?" }, { status: 400 });
    const tier = TIERS[String(body.tier)] ? String(body.tier) : "operator";
    const territory = String(body.territory || "").trim() || null;
    const spec = TIERS[tier];
    await db.insert(partners).values({
      id: "P" + newId().slice(0, 8),
      name,
      operatorName: String(body.operator || "").trim() || null,
      email: String(body.email || "").trim() || null,
      phone: String(body.phone || "").trim() || null,
      territory,
      tier,
      status: STATUSES.includes(String(body.status)) ? String(body.status) : "applied",
      royaltyPct: spec.royalty,
      feeCents: spec.fee,
      note: String(body.note || "").trim() || null,
      since: String(body.since || "").trim() || null,
    });
    await db.insert(audit).values({ customerId: null, actor, action: "added a partner", target: name, at: new Date() });
    return NextResponse.json({ ok: true });
  } catch (e) {
    // The unique index on territory is the refusal, not a check we might forget.
    return fail(e, { "23505": "that territory already belongs to another partner" });
  }
}

export async function PATCH(req: Request) {
  const denied = await guard();
  if (denied) return denied;
  try {
    const body = await req.json().catch(() => ({}));
    const id = String(body.id || "");
    const [p] = await db.select().from(partners).where(eq(partners.id, id)).limit(1);
    if (!p) return NextResponse.json({ error: "no such partner" }, { status: 404 });
    const patch: Record<string, unknown> = {};
    if (body.status !== undefined) {
      if (!STATUSES.includes(String(body.status))) return NextResponse.json({ error: "unknown status" }, { status: 400 });
      patch.status = String(body.status);
    }
    if (body.customers !== undefined) patch.customers = Math.max(0, Number(body.customers) || 0);
    if (body.book !== undefined) patch.bookCents = Math.max(0, Math.round((Number(body.book) || 0) * 100));
    await db.update(partners).set(patch).where(eq(partners.id, id));
    return NextResponse.json({ ok: true });
  } catch (e) {
    return fail(e);
  }
}
