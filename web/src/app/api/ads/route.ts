import { NextResponse } from "next/server";
import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { fail, guardTenant, operator } from "@/lib/api";
import { adCampaigns, audit, customers } from "@/lib/schema";
import { newId } from "@/lib/customers";

const PLATFORMS = ["google", "meta", "tiktok", "linkedin", "x", "pinterest"];
const STATUSES = ["draft", "pending_review", "active", "paused"];

/**
 * Campaigns on a customer's own ad account. We never hold the spend.
 *
 * Scoped through the customers of this agency rather than read whole: ad spend
 * is one of the more sensitive numbers in the product, and this screen used to
 * show every agency's.
 */
export async function GET() {
  const t = await guardTenant();
  if ("error" in t) return t.error;
  const custs = await db.select().from(customers).where(eq(customers.tenantId, t.tenantId));
  const rows = custs.length
    ? await db
        .select()
        .from(adCampaigns)
        .where(inArray(adCampaigns.customerId, custs.map((c) => c.id)))
        .orderBy(desc(adCampaigns.createdAt))
    : [];
  const name = (id: string) => custs.find((c) => c.id === id)?.name ?? id;
  return NextResponse.json({
    platforms: PLATFORMS,
    statuses: STATUSES,
    customers: custs.map((c) => ({ id: c.id, name: c.name })),
    campaigns: rows.map((a) => ({
      id: a.id, customerId: a.customerId, customer: name(a.customerId), name: a.name,
      platform: a.platform, status: a.status, goal: a.goal,
      spend: a.spendCents / 100, leads: a.leads,
      dailyCap: a.dailyCapCents / 100,
      cpl: a.leads > 0 ? Math.round(a.spendCents / a.leads) / 100 : null,
    })),
  });
}

export async function POST(req: Request) {
  const t = await guardTenant();
  if ("error" in t) return t.error;
  const actor = (await operator())?.name || "you";
  try {
    const body = await req.json().catch(() => ({}));
    const name = String(body.name || "").trim();
    const customerId = String(body.customerId || "").trim();
    if (!name || !customerId) return NextResponse.json({ error: "name and customer required" }, { status: 400 });
    const cap = Number(body.dailyCap);
    if (!Number.isFinite(cap) || cap <= 0) return NextResponse.json({ error: "set a daily cap" }, { status: 400 });
    // Another agency's customer is "no such customer" — the same answer as one
    // that does not exist, so the reply never confirms it is out there.
    const [c] = await db
      .select()
      .from(customers)
      .where(and(eq(customers.id, customerId), eq(customers.tenantId, t.tenantId)))
      .limit(1);
    if (!c) return NextResponse.json({ error: "no such customer" }, { status: 404 });
    const id = "A" + newId().slice(0, 8);
    await db.insert(adCampaigns).values({
      id,
      customerId,
      name,
      platform: PLATFORMS.includes(String(body.platform)) ? String(body.platform) : "google",
      // New campaigns never start live. Spending money is an approval.
      status: "pending_review",
      goal: String(body.goal || "").trim() || null,
      dailyCapCents: Math.round(cap * 100),
    });
    await db.insert(audit).values({ customerId, actor, action: "drafted a campaign", target: name, at: new Date() });
    return NextResponse.json({ ok: true, id });
  } catch (e) {
    return fail(e);
  }
}

export async function PATCH(req: Request) {
  const t = await guardTenant();
  if ("error" in t) return t.error;
  const actor = (await operator())?.name || "you";
  try {
    const body = await req.json().catch(() => ({}));
    const id = String(body.id || "");
    const [a] = await db
      .select({ id: adCampaigns.id, customerId: adCampaigns.customerId, name: adCampaigns.name })
      .from(adCampaigns)
      .innerJoin(customers, eq(customers.id, adCampaigns.customerId))
      .where(and(eq(adCampaigns.id, id), eq(customers.tenantId, t.tenantId)))
      .limit(1);
    if (!a) return NextResponse.json({ error: "no such campaign" }, { status: 404 });
    const status = String(body.status || "");
    if (!STATUSES.includes(status)) return NextResponse.json({ error: "unknown status" }, { status: 400 });
    await db.update(adCampaigns).set({ status }).where(eq(adCampaigns.id, id));
    await db.insert(audit).values({
      customerId: a.customerId, actor, action: `campaign ${status}`, target: a.name, at: new Date(),
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return fail(e);
  }
}
