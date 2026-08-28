import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { newId } from "@/lib/customers";
import { audit, clientRequests, customers } from "@/lib/schema";
import { hashToken } from "@/lib/session-token";

/**
 * "Can you add a booking page." An update request from the client, arriving from
 * their own site or portal with the same write-only key the error reporter uses.
 * It becomes a row an agent can see in next_work and promote with open_work.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const key = req.headers.get("x-wrangler-key") || "";
  if (!key) return NextResponse.json({ error: "missing key" }, { status: 401 });

  const [customer] = await db
    .select({ id: customers.id, name: customers.name })
    .from(customers)
    .where(eq(customers.ingestKeyHash, hashToken(key)))
    .limit(1);
  if (!customer) return NextResponse.json({ error: "unknown key" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const text = String(body.body || "").trim().slice(0, 4000);
  if (!text) return NextResponse.json({ error: "body required" }, { status: 400 });

  const kind = ["request", "bug", "question"].includes(String(body.kind)) ? String(body.kind) : "request";
  const id = newId();
  await db.insert(clientRequests).values({
    id,
    customerId: customer.id,
    fromName: String(body.name || "").slice(0, 120) || null,
    fromEmail: String(body.email || "").slice(0, 200) || null,
    kind,
    body: text,
  });
  await db.insert(audit).values({
    customerId: customer.id,
    actor: String(body.email || customer.name),
    action: `client ${kind} received`,
    target: id,
    at: new Date(),
  });

  return NextResponse.json({ ok: true, id }, { status: 202 });
}
