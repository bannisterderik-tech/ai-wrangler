import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { fail, guardTenant, operator } from "@/lib/api";
import { audit, boundResources, customers } from "@/lib/schema";
import { newId } from "@/lib/customers";
import { assertNotTakenByAnother, IsolationError } from "@/lib/isolation";
import { listBindings, PROVIDER } from "@/lib/ads-scope";
import { zernioConfigured, ZernioError } from "@/lib/zernio";
import { listAdAccounts } from "@/lib/zernio-generated";

/**
 * Binding a customer to their Google Ads account.
 *
 * Nothing about ads works until this exists: every Zernio call is scoped to an
 * account, and picking the wrong one spends the wrong shop's money. So it is a
 * deliberate act with its own screen, not something inferred from a name match.
 */
export async function GET(req: Request) {
  const t = await guardTenant();
  if ("error" in t) return t.error;
  try {
    const url = new URL(req.url);
    const discoverFor = url.searchParams.get("discover");
    const bound = await listBindings(t.tenantId);

    // Offer the accounts Zernio can actually see, but only when asked — it is a
    // live call to Google and does not belong in every page load.
    let available: { id: string; name: string; currency?: string }[] = [];
    let problem = "";
    if (discoverFor && zernioConfigured()) {
      try {
        available = ((await listAdAccounts({ accountId: discoverFor, limit: 200 })).accounts ?? []) as typeof available;
      } catch (e) {
        problem = (e as Error).message;
      }
    }
    return NextResponse.json({
      connected: zernioConfigured(),
      bound,
      available,
      problem,
      customers: (
        await db
          .select({ id: customers.id, name: customers.name })
          .from(customers)
          .where(eq(customers.tenantId, t.tenantId))
      ).map((c) => ({ ...c, bound: bound.some((b) => b.customerId === c.id) })),
    });
  } catch (e) {
    return fail(e);
  }
}

export async function POST(req: Request) {
  const t = await guardTenant();
  if ("error" in t) return t.error;
  const actor = (await operator())?.name || "you";
  try {
    const body = await req.json().catch(() => ({}));
    const customerId = String(body.customerId || "").trim();
    const accountId = String(body.accountId || "").trim();
    const adAccountId = String(body.adAccountId || "").trim();
    const name = String(body.name || adAccountId).trim();
    if (!customerId || !accountId || !adAccountId) {
      return NextResponse.json({ error: "customer, Zernio account and Google Ads account are all required" }, { status: 400 });
    }

    const [c] = await db
      .select()
      .from(customers)
      .where(and(eq(customers.id, customerId), eq(customers.tenantId, t.tenantId)))
      .limit(1);
    if (!c) return NextResponse.json({ error: "no such customer" }, { status: 404 });

    // One Google Ads account, one customer — checked here for a readable
    // refusal, and again by the unique index for the race.
    await assertNotTakenByAnother(customerId, PROVIDER, adAccountId);

    await db
      .delete(boundResources)
      .where(and(eq(boundResources.customerId, customerId), eq(boundResources.provider, PROVIDER)));
    await db.insert(boundResources).values({
      id: "B" + newId().slice(0, 10),
      customerId,
      provider: PROVIDER,
      resourceId: adAccountId,
      name,
      metaJson: JSON.stringify({ accountId }),
    });
    await db.insert(audit).values({
      customerId,
      actor,
      action: "bound a Google Ads account",
      target: `${name} (${adAccountId})`,
      at: new Date(),
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof IsolationError) return NextResponse.json({ error: e.message }, { status: e.status });
    if (e instanceof ZernioError) return NextResponse.json({ error: e.message }, { status: e.status });
    return fail(e);
  }
}

export async function DELETE(req: Request) {
  const t = await guardTenant();
  if ("error" in t) return t.error;
  const actor = (await operator())?.name || "you";
  try {
    const customerId = String(new URL(req.url).searchParams.get("customerId") || "");
    const [c] = await db
      .select()
      .from(customers)
      .where(and(eq(customers.id, customerId), eq(customers.tenantId, t.tenantId)))
      .limit(1);
    if (!c) return NextResponse.json({ error: "no such customer" }, { status: 404 });
    await db
      .delete(boundResources)
      .where(and(eq(boundResources.customerId, customerId), eq(boundResources.provider, PROVIDER)));
    await db.insert(audit).values({
      customerId,
      actor,
      action: "unbound their Google Ads account",
      target: c.name,
      at: new Date(),
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return fail(e);
  }
}
