import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { boundResources, connections, customers } from "@/lib/schema";

export async function GET(_req: Request, ctx: RouteContext<"/api/customers/[id]">) {
  const { id } = await ctx.params;
  const row = db.select().from(customers).where(eq(customers.id, id)).get();
  if (!row) return NextResponse.json({ error: "not found" }, { status: 404 });
  const profile = row.profileJson ? JSON.parse(row.profileJson) : {};
  const v = db
    .select()
    .from(connections)
    .where(eq(connections.customerId, id))
    .all()
    .find((c) => c.provider === "vercel");
  const bound = db.select().from(boundResources).where(eq(boundResources.customerId, id)).all();
  return NextResponse.json({
    id: row.id,
    name: row.name,
    profile,
    vercel: v
      ? { connected: true, mode: v.mode, teamId: v.teamId, bound: bound.filter((b) => b.provider === "vercel").length }
      : { connected: false },
  });
}
