import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { fail, guardBuild, operator} from "@/lib/api";
import { customerInTenant } from "@/lib/tenant-scope";
import { boundResources } from "@/lib/schema";
import { ensureCustomer } from "@/lib/customers";
import { IsolationError } from "@/lib/isolation";
import { bindResources } from "@/lib/binding";
import { createAgencyRepo, listAgencyRepos } from "@/lib/github";

export async function GET(_req: Request, ctx: RouteContext<"/api/customers/[id]/github">) {
  const t = await guardBuild();
  if ("error" in t) return t.error;
  const { id } = await ctx.params;
  // Another agency's customer reads as not found, the same as one that
  // never existed — the refusal must not confirm it is out there.
  if (!(await customerInTenant(t.tenantId, id))) {
    return NextResponse.json({ error: "no such customer" }, { status: 404 });
  }
  const bound = await db
    .select()
    .from(boundResources)
    .where(and(eq(boundResources.customerId, id), eq(boundResources.provider, "github")));
  return NextResponse.json({
    repos: bound.map((b) => ({
      fullName: b.resourceId,
      name: b.name,
      meta: b.metaJson ? JSON.parse(b.metaJson) : {},
    })),
  });
}

export async function POST(req: Request, ctx: RouteContext<"/api/customers/[id]/github">) {
  const t = await guardBuild();
  if ("error" in t) return t.error;
  const { id } = await ctx.params;
  // Another agency's customer reads as not found, the same as one that
  // never existed — the refusal must not confirm it is out there.
  if (!(await customerInTenant(t.tenantId, id))) {
    return NextResponse.json({ error: "no such customer" }, { status: 404 });
  }
  const body = await req.json().catch(() => ({}));
  const actor = (await operator())?.name || "you";

  try {
    const customer = await ensureCustomer(id);

    if (body.create) {
      const slugName = String(body.name || customer.id).replace(/[^a-zA-Z0-9._-]/g, "-");
      const repo = await createAgencyRepo(slugName, `Wrangler workspace for ${customer.name}`);
      const bound = await bindResources(
        customer.id,
        "github",
        [
          {
            resourceId: repo.full_name,
            name: repo.full_name,
            meta: { htmlUrl: repo.html_url, defaultBranch: repo.default_branch, ghId: repo.id },
          },
        ],
        { actor },
      );
      return NextResponse.json({ ok: true, repos: bound });
    }

    const names: string[] = body.repos || body.repoFullNames || [];
    if (!names.length) return NextResponse.json({ error: "repos required" }, { status: 400 });

    // Only repos this agency actually owns. We never bind someone else's repo.
    const ours = await listAgencyRepos();
    const byName = new Map(ours.map((r) => [r.full_name, r]));
    const items = names.map((name) => {
      const repo = byName.get(name);
      if (!repo) {
        throw new IsolationError(
          `${name} is not in this agency’s GitHub — we only bind repos we own`,
          403,
        );
      }
      return {
        resourceId: name,
        name,
        meta: { htmlUrl: repo.html_url, defaultBranch: repo.default_branch, ghId: repo.id },
      };
    });

    const bound = await bindResources(customer.id, "github", items, { actor });
    return NextResponse.json({ ok: true, repos: bound });
  } catch (e) {
    return fail(e);
  }
}
