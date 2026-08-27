import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { guard } from "@/lib/api";
import { customers, inbox } from "@/lib/schema";

export async function GET() {
  const denied = await guard();
  if (denied) return denied;
  const [rows, names] = await Promise.all([db.select().from(inbox), db.select().from(customers)]);
  const byId = Object.fromEntries(names.map((c) => [c.id, c.name]));
  return NextResponse.json({
    items: rows.map((i) => ({ ...i, customerName: byId[i.customerId] || i.customerId })),
  });
}
