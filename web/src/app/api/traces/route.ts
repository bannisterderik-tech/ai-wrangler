import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { fail, guardBuild } from "@/lib/api";
import { agentTraces } from "@/lib/schema";
import { customerIdsFor, ownedBy } from "@/lib/tenant-scope";

/**
 * Why an agent did what it did.
 *
 * The build side of the product, so a CRM-only account is refused it outright —
 * there are no agents on that plan to explain.
 */
export async function GET(req: Request) {
  const t = await guardBuild();
  if ("error" in t) return t.error;
  try {
    const url = new URL(req.url);
    const personId = url.searchParams.get("personId");
    const kind = url.searchParams.get("kind");
    const ids = await customerIdsFor(t.tenantId);

    const rows = await db
      .select()
      .from(agentTraces)
      .where(
        and(
          ownedBy(agentTraces.customerId, ids),
          personId ? eq(agentTraces.personId, personId) : undefined,
          kind ? eq(agentTraces.kind, kind) : undefined,
        ),
      )
      .orderBy(desc(agentTraces.at))
      .limit(200);

    return NextResponse.json({
      traces: rows.map((r) => ({ ...r, cost: r.costMillicents / 100000 })),
      // The two numbers worth reading first: what broke, and what it cost.
      failures: rows.filter((r) => !r.ok).length,
      cost: rows.reduce((a, r) => a + r.costMillicents, 0) / 100000,
    });
  } catch (e) {
    return fail(e);
  }
}
