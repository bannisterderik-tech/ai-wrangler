import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { guardTenant } from "@/lib/api";
import { orchLog } from "@/lib/schema";
import { customerIdsFor, customerInTenant, ownedBy } from "@/lib/tenant-scope";

export async function GET() {
  const t = await guardTenant();
  if ("error" in t) return t.error;
  const rows = await db
    .select()
    .from(orchLog)
    .where(ownedBy(orchLog.customerId, await customerIdsFor(t.tenantId)))
    .orderBy(desc(orchLog.at))
    .limit(80);
  return NextResponse.json({ log: rows.reverse() });
}

export async function POST(req: Request) {
  const t = await guardTenant();
  if ("error" in t) return t.error;
  const body = await req.json().catch(() => ({}));
  const goal = String(body.goal || "").trim();
  const customerId = String(body.customerId || "");
  if (!goal) return NextResponse.json({ error: "goal required" }, { status: 400 });
  // Naming a customer means it has to be one of yours. Unnamed is fine — that
  // is an agency-level note with no customer on it.
  if (customerId && !(await customerInTenant(t.tenantId, customerId))) {
    return NextResponse.json({ error: "no such customer" }, { status: 404 });
  }
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
