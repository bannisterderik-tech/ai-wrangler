import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { approvals, customers } from "@/lib/schema";

export async function GET() {
  const rows = db.select().from(approvals).orderBy(desc(approvals.createdAt)).all();
  const names = Object.fromEntries(db.select().from(customers).all().map((c) => [c.id, c.name]));
  return NextResponse.json({
    approvals: rows.map((a) => ({ ...a, customerName: names[a.customerId] || a.customerId })),
  });
}
