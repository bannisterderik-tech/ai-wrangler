import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { fail, guardTenant, operator } from "@/lib/api";
import { audit, boundResources, customers } from "@/lib/schema";
import { newId } from "@/lib/customers";
import { assertNotTakenByAnother, IsolationError } from "@/lib/isolation";
import { customerInTenant } from "@/lib/tenant-scope";
import { NUMBER_PROVIDER, numbersFor } from "@/lib/numbers";
import { buyNumber, releaseNumber, searchNumbers, twilioConfigured, twilioStatus } from "@/lib/twilio";
import { publicOrigin } from "@/lib/origin";

/**
 * A phone number per customer.
 *
 * Everything sent from one shared caller id until now: every shop's texts and
 * calls came from the same number, inbound could not be routed to anybody in
 * particular, and no minute could be attributed to whoever spent it.
 *
 * Buying is a real purchase with a real monthly cost, so it is deliberate — a
 * search, a choice, and a customer it is bound to.
 */
export async function GET(req: Request) {
  const t = await guardTenant();
  if ("error" in t) return t.error;
  try {
    const url = new URL(req.url);
    const areaCode = url.searchParams.get("areaCode") ?? "";
    const contains = url.searchParams.get("contains") ?? "";

    // Only searched when asked. It is a live call to Twilio and has no business
    // running on every page load.
    let available: Awaited<ReturnType<typeof searchNumbers>> = [];
    let problem = "";
    if (areaCode || contains) {
      try {
        available = await searchNumbers({ areaCode, contains });
      } catch (e) {
        problem = (e as Error).message;
      }
    }

    const bound = await numbersFor(t.tenantId);
    const mine = await db
      .select({ id: customers.id, name: customers.name })
      .from(customers)
      .where(eq(customers.tenantId, t.tenantId));

    return NextResponse.json({
      ...twilioStatus(),
      bound,
      available,
      problem,
      customers: mine.map((c) => ({ ...c, number: bound.find((b) => b.customerId === c.id)?.number ?? null })),
      /** Anybody still on the shared number is the remaining contradiction. */
      sharing: mine.filter((c) => !bound.some((b) => b.customerId === c.id)).length,
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
    const phoneNumber = String(body.phoneNumber || "").trim();
    if (!customerId || !phoneNumber) {
      return NextResponse.json({ error: "pick a customer and a number" }, { status: 400 });
    }
    const c = await customerInTenant(t.tenantId, customerId);
    if (!c) return NextResponse.json({ error: "no such customer" }, { status: 404 });
    if (!twilioConfigured()) {
      return NextResponse.json({ error: "Twilio is not configured, so no number can be bought." }, { status: 503 });
    }

    const [already] = await db
      .select()
      .from(boundResources)
      .where(and(eq(boundResources.customerId, customerId), eq(boundResources.provider, NUMBER_PROVIDER)))
      .limit(1);
    if (already) {
      return NextResponse.json(
        { error: `${c.name} already has ${already.resourceId}. Release it first — two numbers means two identities.` },
        { status: 409 },
      );
    }
    // Checked here for a readable refusal, and again by the unique index for
    // the race between two people clicking at once.
    await assertNotTakenByAnother(customerId, NUMBER_PROVIDER, phoneNumber);

    // Bought and pointed at us in one call, so there is no window where the
    // number is live and inbound reaches nothing.
    const bought = await buyNumber({
      phoneNumber,
      friendlyName: `${c.name} — AI Wrangler`,
      origin: publicOrigin(req),
    });

    try {
      await db.insert(boundResources).values({
        id: "B" + newId().slice(0, 10),
        customerId,
        provider: NUMBER_PROVIDER,
        resourceId: bought.phoneNumber,
        name: c.name,
        metaJson: JSON.stringify({ sid: bought.sid }),
      });
    } catch (e) {
      // The money already moved. Give it straight back rather than leaving a
      // number nobody owns quietly billing every month.
      await releaseNumber(bought.sid).catch(() => {});
      throw e;
    }

    await db.insert(audit).values({
      customerId,
      actor,
      action: "bought a phone number",
      target: `${bought.phoneNumber} for ${c.name}`,
      at: new Date(),
    });
    return NextResponse.json({ ok: true, number: bought.phoneNumber });
  } catch (e) {
    if (e instanceof IsolationError) return NextResponse.json({ error: e.message }, { status: e.status });
    return fail(e);
  }
}

/** Give a number back. Irreversible: Twilio will not return the same one. */
export async function DELETE(req: Request) {
  const t = await guardTenant();
  if ("error" in t) return t.error;
  const actor = (await operator())?.name || "you";
  try {
    const customerId = String(new URL(req.url).searchParams.get("customerId") || "");
    const c = await customerInTenant(t.tenantId, customerId);
    if (!c) return NextResponse.json({ error: "no such customer" }, { status: 404 });

    const bound = (await numbersFor(t.tenantId)).find((b) => b.customerId === customerId);
    if (!bound) return NextResponse.json({ error: "they have no number" }, { status: 404 });

    if (bound.sid) await releaseNumber(bound.sid);
    await db
      .delete(boundResources)
      .where(and(eq(boundResources.customerId, customerId), eq(boundResources.provider, NUMBER_PROVIDER)));
    await db.insert(audit).values({
      customerId,
      actor,
      action: "released a phone number",
      target: `${bound.number} — ${c.name}`,
      at: new Date(),
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return fail(e);
  }
}
