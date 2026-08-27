import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { guard } from "@/lib/api";
import { changes, customers } from "@/lib/schema";

export async function GET() {
  const denied = await guard();
  if (denied) return denied;
  const [rows, names] = await Promise.all([
    db.select().from(changes).orderBy(desc(changes.createdAt)),
    db.select().from(customers),
  ]);
  const byId = Object.fromEntries(names.map((c) => [c.id, c.name]));
  return NextResponse.json({
    changes: rows.map((c) => ({ ...c, customerName: byId[c.customerId] || c.customerId })),
  });
}
