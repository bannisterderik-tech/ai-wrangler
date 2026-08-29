import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, withCustomer } from "@/lib/db";
import { fail, guardTenant} from "@/lib/api";
import { customerInTenant } from "@/lib/tenant-scope";
import { boundResources, connections, customers } from "@/lib/schema";

export async function GET(_req: Request, ctx: RouteContext<"/api/customers/[id]">) {
  const t = await guardTenant();
  if ("error" in t) return t.error;
  const { id } = await ctx.params;
  // Another agency's customer reads as not found, the same as one that
  // never existed — the refusal must not confirm it is out there.
  if (!(await customerInTenant(t.tenantId, id))) {
    return NextResponse.json({ error: "no such customer" }, { status: 404 });
  }
  try {
    const [row] = await db.select().from(customers).where(eq(customers.id, id)).limit(1);
    if (!row) return NextResponse.json({ error: "not found" }, { status: 404 });
    const profile = row.profileJson ? JSON.parse(row.profileJson) : {};

    // Everything below is read as the tenant role — one customer's view, enforced by Postgres.
    const { conns, bound } = await withCustomer(id, async (tx) => ({
      conns: await tx.select().from(connections),
      bound: await tx.select().from(boundResources),
    }));
    const v = conns.find((c) => c.provider === "vercel");

    return NextResponse.json({
      id: row.id,
      name: row.name,
      profile,
      vercel: v
        ? {
            connected: true,
            mode: v.mode,
            teamId: v.teamId,
            bound: bound.filter((b) => b.provider === "vercel").length,
          }
        : { connected: false },
      github: {
        repos: bound.filter((b) => b.provider === "github").map((b) => b.resourceId),
      },
    });
  } catch (e) {
    return fail(e);
  }
}
