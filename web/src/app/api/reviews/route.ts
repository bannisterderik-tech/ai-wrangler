import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { fail, guardTenant, operator } from "@/lib/api";
import { audit, customers, reviews } from "@/lib/schema";
import { customerIdsFor, customerInTenant } from "@/lib/tenant-scope";
import { bindingFor } from "@/lib/ads-scope";
import { draftReply, postReply, reviewsFor, syncReviews } from "@/lib/reviews";
import { ZernioError, zernioConfigured } from "@/lib/zernio";
import { meter } from "@/lib/numbers";

/** What people said, and which ones nobody has answered. */
export async function GET() {
  const t = await guardTenant();
  if ("error" in t) return t.error;
  try {
    const ids = await customerIdsFor(t.tenantId);
    const rows = await reviewsFor(ids);
    const names = Object.fromEntries(
      (await db.select({ id: customers.id, name: customers.name }).from(customers).where(eq(customers.tenantId, t.tenantId)))
        .map((c) => [c.id, c.name]),
    );
    return NextResponse.json({
      connected: zernioConfigured(),
      reviews: rows.map((r) => ({ ...r, customer: names[r.customerId] ?? r.customerId })),
      // The queue: anything nobody has answered, worst first.
      waiting: rows.filter((r) => !r.replyText).length,
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
    const action = String(body.action || "");

    if (action === "sync") {
      const customerId = String(body.customerId || "");
      const c = await customerInTenant(t.tenantId, customerId);
      if (!c) return NextResponse.json({ error: "no such customer" }, { status: 404 });
      // Reviews come through the same Google connection as the ads.
      const binding = await bindingFor(t.tenantId, customerId);
      if (!binding) {
        return NextResponse.json(
          { error: "Bind their Google account on Settings first — reviews come through the same connection." },
          { status: 409 },
        );
      }
      const out = await syncReviews({ accountId: binding.accountId, customerId, tenantId: t.tenantId });
      return NextResponse.json({ ok: true, ...out });
    }

    const id = String(body.id || "");
    const [review] = await db
      .select()
      .from(reviews)
      .where(and(eq(reviews.id, id), eq(reviews.tenantId, t.tenantId)))
      .limit(1);
    if (!review) return NextResponse.json({ error: "no such review" }, { status: 404 });
    const [c] = await db.select().from(customers).where(eq(customers.id, review.customerId)).limit(1);

    if (action === "draft") {
      const { text, costMillicents } = await draftReply(review, c?.name ?? "the business");
      await db
        .update(reviews)
        .set({ draftText: text, draftState: "draft", draftBy: actor, updatedAt: new Date() })
        .where(eq(reviews.id, id));
      await meter({
        customerId: review.customerId, tenantId: t.tenantId, kind: "ai",
        quantity: 1, unit: "drafts", costMillicents, ref: `review:${id}:${Date.now()}`,
        detail: "review reply draft",
      });
      return NextResponse.json({ ok: true, text });
    }

    if (action === "save") {
      const text = String(body.text || "").trim().slice(0, 900);
      await db
        .update(reviews)
        .set({ draftText: text || null, draftState: text ? "draft" : "none", draftBy: actor, updatedAt: new Date() })
        .where(eq(reviews.id, id));
      return NextResponse.json({ ok: true });
    }

    if (action === "skip") {
      await db.update(reviews).set({ draftState: "skipped", updatedAt: new Date() }).where(eq(reviews.id, id));
      return NextResponse.json({ ok: true });
    }

    if (action === "post") {
      const text = String(body.text || review.draftText || "").trim();
      if (!text) return NextResponse.json({ error: "there is nothing to post" }, { status: 400 });
      if (!zernioConfigured()) {
        return NextResponse.json({ error: "Zernio is not connected." }, { status: 503 });
      }
      const binding = await bindingFor(t.tenantId, review.customerId);
      if (!binding) return NextResponse.json({ error: "their Google account is not bound" }, { status: 409 });

      // Reads it back first: somebody may have answered in the Google app since
      // the draft was written, and Google keeps no history of what it replaces.
      await postReply({ accountId: binding.accountId, review, text });
      await db.insert(audit).values({
        customerId: review.customerId, actor,
        action: "posted a public review reply",
        target: `${review.rating ?? "?"}★ from ${review.author ?? "anonymous"}`,
        at: new Date(),
      });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "unknown action" }, { status: 400 });
  } catch (e) {
    if (e instanceof ZernioError) return NextResponse.json({ error: e.message }, { status: e.status });
    if (e instanceof Error && e.message.includes("already replied")) {
      return NextResponse.json({ error: e.message }, { status: 409 });
    }
    return fail(e);
  }
}
