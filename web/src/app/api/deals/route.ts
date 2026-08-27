import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { guard } from "@/lib/api";
import { deals } from "@/lib/schema";

export async function GET() {
  const denied = await guard();
  if (denied) return denied;
  return NextResponse.json({ deals: await db.select().from(deals) });
}

export async function POST(req: Request) {
  const denied = await guard();
  if (denied) return denied;
  const body = await req.json().catch(() => ({}));
  if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await db.update(deals).set({ stage: Number(body.stage) }).where(eq(deals.id, body.id));
  return NextResponse.json({ ok: true });
}
