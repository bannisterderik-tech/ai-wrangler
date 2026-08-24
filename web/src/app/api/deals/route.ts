import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { deals } from "@/lib/schema";

export async function GET() {
  return NextResponse.json({ deals: db.select().from(deals).all() });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 });
  db.update(deals).set({ stage: Number(body.stage) }).where(eq(deals.id, body.id)).run();
  return NextResponse.json({ ok: true });
}
