import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, withCustomer } from "@/lib/db";
import { fail, guard, operator } from "@/lib/api";
import { memories } from "@/lib/schema";
import { ensureCustomer, newId } from "@/lib/customers";
import { embedOne } from "@/lib/recall";

export async function GET(req: Request) {
  const denied = await guard();
  if (denied) return denied;
  const customerId = new URL(req.url).searchParams.get("customerId");
  // Scoped reads run as the tenant role: Postgres itself refuses the other customers' rows.
  const rows = customerId
    ? await withCustomer(customerId, (tx) => tx.select().from(memories))
    : await db.select().from(memories);
  return NextResponse.json({ memories: rows });
}

export async function POST(req: Request) {
  const denied = await guard();
  if (denied) return denied;
  const body = await req.json().catch(() => ({}));
  const text = String(body.text || "").trim();
  const customerId = String(body.customerId || "");
  if (!text || !customerId) {
    return NextResponse.json({ error: "text and customerId required" }, { status: 400 });
  }
  try {
    const customer = await ensureCustomer(customerId);
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
  const denied = await guard();
  if (denied) return denied;
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await db.delete(memories).where(eq(memories.id, id));
  return NextResponse.json({ ok: true });
}
