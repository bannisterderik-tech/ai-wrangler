import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db, withCustomer } from "@/lib/db";
import { fail, guardTenant, operator } from "@/lib/api";
import { memories } from "@/lib/schema";
import { ensureCustomer, newId } from "@/lib/customers";
import { embedOne } from "@/lib/recall";
import { customerIdsFor, customerInTenant, ownedBy } from "@/lib/tenant-scope";

export async function GET(req: Request) {
  const t = await guardTenant();
  if ("error" in t) return t.error;
  const customerId = new URL(req.url).searchParams.get("customerId");
  if (customerId) {
    // RLS keeps one customer out of another's rows, but it knows nothing about
    // agencies — the operator picks the customer id, so that has to be checked
    // here before Postgres is asked anything.
    if (!(await customerInTenant(t.tenantId, customerId))) {
      return NextResponse.json({ error: "no such customer" }, { status: 404 });
    }
    const rows = await withCustomer(customerId, (tx) => tx.select().from(memories));
    return NextResponse.json({ memories: rows });
  }
  const rows = await db
    .select()
    .from(memories)
    .where(ownedBy(memories.customerId, await customerIdsFor(t.tenantId)));
  return NextResponse.json({ memories: rows });
}

export async function POST(req: Request) {
  const t = await guardTenant();
  if ("error" in t) return t.error;
  const body = await req.json().catch(() => ({}));
  const text = String(body.text || "").trim();
  const customerId = String(body.customerId || "");
  if (!text || !customerId) {
    return NextResponse.json({ error: "text and customerId required" }, { status: 400 });
  }
  try {
    // ensureCustomer would happily create one, so the check comes first —
    // otherwise writing a memory is a way to make a customer in any agency.
    if (!(await customerInTenant(t.tenantId, customerId))) {
      return NextResponse.json({ error: "no such customer" }, { status: 404 });
    }
    const customer = await ensureCustomer(customerId, undefined, t.tenantId);
    // A rule outranks a note when the agent reads the project, so which one
    // this is has to be said at the point it is written.
    const kind = ["note", "rule", "outcome"].includes(String(body.kind)) ? String(body.kind) : "note";
    const vec = await embedOne(text);
    const row = {
      id: newId(),
      customerId: customer.id,
      text,
      kind,
      source: (await operator())?.name ?? null,
      embedding: vec?.embedding ?? null,
      embeddingModel: vec?.model ?? null,
      createdAt: new Date(),
    };
    await withCustomer(customer.id, (tx) => tx.insert(memories).values(row));
    return NextResponse.json(row);
  } catch (e) {
    return fail(e);
  }
}

export async function DELETE(req: Request) {
  const t = await guardTenant();
  if ("error" in t) return t.error;
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  // Delete by id AND ownership in one statement: reading it first and deleting
  // second leaves a gap where the row could change owner between the two.
  const gone = await db
    .delete(memories)
    .where(and(eq(memories.id, id), ownedBy(memories.customerId, await customerIdsFor(t.tenantId))))
    .returning({ id: memories.id });
  if (!gone.length) return NextResponse.json({ error: "no such memory" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
