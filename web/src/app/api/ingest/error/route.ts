import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { newId } from "@/lib/customers";
import { customers, siteErrors } from "@/lib/schema";
import { hashToken } from "@/lib/session-token";
import { raiseEvent } from "@/lib/agent-events";

/**
 * Errors from a customer's deployed site.
 *
 * Public by necessity — it is called from their frontend — so the key that
 * routes an error to a customer is write-only and can do nothing else. It cannot
 * read, it cannot list, and a wrong key is a flat 401 rather than a hint.
 *
 * Deduplicated by fingerprint: one broken route is one row with a count, not ten
 * thousand rows and a bill.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY = 16_000;

function fingerprint(message: string, url: string) {
  // Numbers and ids vary per occurrence; the shape of the failure does not.
  const shape = `${message} ${url}`.replace(/\d+/g, "#").replace(/\s+/g, " ").trim().slice(0, 400);
  return createHash("sha256").update(shape).digest("hex").slice(0, 32);
}

export async function POST(req: Request) {
  const key = req.headers.get("x-wrangler-key") || "";
  if (!key) return NextResponse.json({ error: "missing key" }, { status: 401 });

  const [customer] = await db
    .select({ id: customers.id })
    .from(customers)
    .where(eq(customers.ingestKeyHash, hashToken(key)))
    .limit(1);
  if (!customer) return NextResponse.json({ error: "unknown key" }, { status: 401 });

  const raw = await req.text();
  if (raw.length > MAX_BODY) return NextResponse.json({ error: "too large" }, { status: 413 });
  let body: { message?: string; url?: string; stack?: string };
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  const message = String(body.message || "").trim().slice(0, 500);
  if (!message) return NextResponse.json({ error: "message required" }, { status: 400 });
  const url = String(body.url || "").slice(0, 300);
  const stack = String(body.stack || "").slice(0, 4000);
  const fp = fingerprint(message, url);

  // One row per shape. A repeat bumps the count and the clock, and re-opens
  // something previously marked fixed, because it evidently was not.
  await db
    .insert(siteErrors)
    .values({ id: newId(), customerId: customer.id, fingerprint: fp, message, url, stack })
    .onConflictDoUpdate({
      target: [siteErrors.customerId, siteErrors.fingerprint],
      set: {
        count: sql`${siteErrors.count} + 1`,
        lastSeen: new Date(),
        status: sql`CASE WHEN ${siteErrors.status} = 'fixed' THEN 'open' ELSE ${siteErrors.status} END`,
      },
    });

  // Wake their copilot, if they have one. Keyed on the fingerprint, so the
  // same error seen five hundred times is one thing to react to.
  await raiseEvent({
    customerId: customer.id,
    kind: "site_error",
    source: "their site",
    refId: fp,
    summary: `${message}${url ? ` on ${url}` : ""}`,
    payload: { url, stack: stack.slice(0, 600) },
  });

  // 202: it is recorded, and the caller is a browser that should not care.
  return new NextResponse(null, { status: 202 });
}
