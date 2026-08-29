import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { fail, guardBuild, operator} from "@/lib/api";
import { customerInTenant } from "@/lib/tenant-scope";
import { boundResources } from "@/lib/schema";
import { ensureCustomer } from "@/lib/customers";
import { bindResources } from "@/lib/binding";
import { listCustomerProjects } from "@/lib/vercel";
import { IsolationError } from "@/lib/isolation";

/** Their Vercel, their token: projects are listed with the customer's own token, never a shared one. */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const t = await guardBuild();
  if ("error" in t) return t.error;
  const { id } = await ctx.params;
  // Another agency's customer reads as not found, the same as one that
  // never existed — the refusal must not confirm it is out there.
  if (!(await customerInTenant(t.tenantId, id))) {
    return NextResponse.json({ error: "no such customer" }, { status: 404 });
  }
  try {
    const [projects, bound] = await Promise.all([
      listCustomerProjects(id),
      db
        .select()
        .from(boundResources)
        .where(and(eq(boundResources.customerId, id), eq(boundResources.provider, "vercel"))),
    ]);
    const boundIds = new Set(bound.map((b) => b.resourceId));
    return NextResponse.json({
      projects: projects.map((p) => ({ ...p, bound: boundIds.has(p.id) })),
    });
  } catch (e) {
    return fail(e);
  }
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const t = await guardBuild();
  if ("error" in t) return t.error;
  const { id } = await ctx.params;
  // Another agency's customer reads as not found, the same as one that
  // never existed — the refusal must not confirm it is out there.
  if (!(await customerInTenant(t.tenantId, id))) {
    return NextResponse.json({ error: "no such customer" }, { status: 404 });
  }
  const body = await req.json().catch(() => ({}));
  const ids: string[] = body.projectIds || body.projects || [];
  try {
    const customer = await ensureCustomer(id);
    const projects = await listCustomerProjects(customer.id);
    const byId = new Map(projects.map((p) => [p.id, p]));
    const items = ids.map((projectId) => {
      const project = byId.get(projectId);
      if (!project) {
        // Binding something we cannot see on their account puts a row into the
        // wall that the wall cannot vouch for. The GitHub route refuses this
        // and so does this one.
        throw new IsolationError(
          `${projectId} is not a project on that customer's Vercel account.`,
          403,
        );
      }
      return { resourceId: project.id, name: project.name, meta: { framework: project.framework } };
    });
    const bound = await bindResources(customer.id, "vercel", items, {
      actor: (await operator())?.name || "you",
    });
    return NextResponse.json({ ok: true, projects: bound });
  } catch (e) {
    return fail(e);
  }
}
