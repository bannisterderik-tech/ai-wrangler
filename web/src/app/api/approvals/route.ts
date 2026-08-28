import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { guardBuild } from "@/lib/api";
import { approvals, customers } from "@/lib/schema";

export async function GET() {
  // The build half. A CRM-only account is refused it outright rather than
  // shown an empty floor and left to wonder.
  const b = await guardBuild();
  if ("error" in b) return b.error;
  const [rows, names] = await Promise.all([
    db.select().from(approvals).orderBy(desc(approvals.createdAt)),
    db.select().from(customers),
  ]);
  const byId = Object.fromEntries(names.map((c) => [c.id, c.name]));
  return NextResponse.json({
    approvals: rows.map((a) => ({ ...a, customerName: byId[a.customerId] || a.customerId })),
  });
}
