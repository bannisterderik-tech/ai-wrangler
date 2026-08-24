import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { orchLog } from "@/lib/schema";

export async function GET() {
  return NextResponse.json({
    log: db.select().from(orchLog).orderBy(desc(orchLog.at)).all().slice(0, 80).reverse(),
  });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const goal = String(body.goal || "").trim();
  const customerId = String(body.customerId || "");
  if (!goal) return NextResponse.json({ error: "goal required" }, { status: 400 });
  db.insert(orchLog)
    .values({
      customerId: customerId || null,
      tag: "plan",
      text: `goal: ${goal}`,
      at: new Date(),
    })
    .run();
  db.insert(orchLog)
    .values({
      customerId: customerId || null,
      tag: "assign",
      text: "breaking into tasks for the bound workspace only",
      at: new Date(),
    })
    .run();
  return NextResponse.json({ ok: true });
}
