import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { guard } from "@/lib/api";
import { orchLog } from "@/lib/schema";

export async function GET() {
  const denied = await guard();
  if (denied) return denied;
  const rows = await db.select().from(orchLog).orderBy(desc(orchLog.at)).limit(80);
  return NextResponse.json({ log: rows.reverse() });
}

export async function POST(req: Request) {
  const denied = await guard();
  if (denied) return denied;
  const body = await req.json().catch(() => ({}));
  const goal = String(body.goal || "").trim();
  const customerId = String(body.customerId || "");
  if (!goal) return NextResponse.json({ error: "goal required" }, { status: 400 });
  await db.insert(orchLog).values([
    { customerId: customerId || null, tag: "plan", text: `goal: ${goal}`, at: new Date() },
    {
      customerId: customerId || null,
      tag: "assign",
      text: "breaking into tasks for the bound workspace only",
      at: new Date(),
    },
  ]);
  return NextResponse.json({ ok: true });
}
