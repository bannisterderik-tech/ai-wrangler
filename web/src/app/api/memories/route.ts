import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { memories } from "@/lib/schema";
import { ensureCustomer, newId } from "@/lib/customers";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const customerId = url.searchParams.get("customerId");
  const rows = customerId
    ? db.select().from(memories).where(eq(memories.customerId, customerId)).all()
    : db.select().from(memories).all();
  return NextResponse.json({ memories: rows });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const text = String(body.text || "").trim();
  const customerId = String(body.customerId || "");
  if (!text || !customerId) return NextResponse.json({ error: "text and customerId required" }, { status: 400 });
  ensureCustomer(customerId);
  const row = { id: newId(), customerId, text, createdAt: new Date() };
  db.insert(memories).values(row).run();
  return NextResponse.json(row);
}

export async function DELETE(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  db.delete(memories).where(eq(memories.id, id)).run();
  return NextResponse.json({ ok: true });
}
