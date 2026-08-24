import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { changes, customers } from "@/lib/schema";

export async function GET() {
  const rows = db.select().from(changes).orderBy(desc(changes.createdAt)).all();
  const names = Object.fromEntries(db.select().from(customers).all().map((c) => [c.id, c.name]));
  return NextResponse.json({
    changes: rows.map((c) => ({ ...c, customerName: names[c.customerId] || c.customerId })),
  });
}
