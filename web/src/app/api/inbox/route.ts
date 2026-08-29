import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { guardTenant } from "@/lib/api";
import { eq } from "drizzle-orm";
import { customers, inbox } from "@/lib/schema";
import { customerIdsFor, ownedBy } from "@/lib/tenant-scope";

export async function GET() {
  const t = await guardTenant();
  if ("error" in t) return t.error;
  const ids = await customerIdsFor(t.tenantId);
  const [rows, names] = await Promise.all([
    db.select().from(inbox).where(ownedBy(inbox.customerId, ids)),
    db.select().from(customers).where(eq(customers.tenantId, t.tenantId)),
  ]);
  const byId = Object.fromEntries(names.map((c) => [c.id, c.name]));
  return NextResponse.json({
    items: rows.map((i) => ({ ...i, customerName: byId[i.customerId] || i.customerId })),
  });
}
