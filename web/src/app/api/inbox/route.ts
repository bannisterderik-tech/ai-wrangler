import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { customers, inbox } from "@/lib/schema";

export async function GET() {
  const rows = db.select().from(inbox).all();
  const names = Object.fromEntries(db.select().from(customers).all().map((c) => [c.id, c.name]));
  return NextResponse.json({
    items: rows.map((i) => ({ ...i, customerName: names[i.customerId] || i.customerId })),
  });
}
