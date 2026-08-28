import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { guardBuild } from "@/lib/api";
import { changes, customers } from "@/lib/schema";

export async function GET() {
  // The build half. A CRM-only account is refused it outright rather than
  // shown an empty floor and left to wonder.
  const b = await guardBuild();
  if ("error" in b) return b.error;
  const [rows, names] = await Promise.all([
    db.select().from(changes).orderBy(desc(changes.createdAt)),
    db.select().from(customers),
  ]);
  const byId = Object.fromEntries(names.map((c) => [c.id, c.name]));
  return NextResponse.json({
    changes: rows.map((c) => ({ ...c, customerName: byId[c.customerId] || c.customerId })),
  });
}
