import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { guard } from "@/lib/api";
import { approvals, customers } from "@/lib/schema";

export async function GET() {
  const denied = await guard();
  if (denied) return denied;
  const [rows, names] = await Promise.all([
    db.select().from(approvals).orderBy(desc(approvals.createdAt)),
    db.select().from(customers),
  ]);
  const byId = Object.fromEntries(names.map((c) => [c.id, c.name]));
  return NextResponse.json({
    approvals: rows.map((a) => ({ ...a, customerName: byId[a.customerId] || a.customerId })),
  });
}
