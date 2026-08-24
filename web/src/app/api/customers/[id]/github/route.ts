import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { audit, boundResources } from "@/lib/schema";
import { ensureCustomer, newId } from "@/lib/customers";
import { IsolationError, assertBound } from "@/lib/isolation";
import { createAgencyRepo, listAgencyRepos } from "@/lib/github";

export async function GET(_req: Request, ctx: RouteContext<"/api/customers/[id]/github">) {
  const { id } = await ctx.params;
  const bound = db
    .select()
    .from(boundResources)
    .where(and(eq(boundResources.customerId, id), eq(boundResources.provider, "github")))
    .all();
  return NextResponse.json({
    repos: bound.map((b) => ({ fullName: b.resourceId, name: b.name, meta: b.metaJson ? JSON.parse(b.metaJson) : {} })),
  });
}

export async function POST(req: Request, ctx: RouteContext<"/api/customers/[id]/github">) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const customer = ensureCustomer(id);

  try {
    if (body.create) {
      const slugName = String(body.name || customer.id).replace(/[^a-zA-Z0-9._-]/g, "-");
      const repo = await createAgencyRepo(slugName, `Wrangler workspace for ${customer.name}`);
      return bind(customer.id, [repo.full_name]);
    }

    const names: string[] = body.repos || body.repoFullNames || [];
    if (!names.length) return NextResponse.json({ error: "repos required" }, { status: 400 });
    return bind(customer.id, names);
  } catch (e) {
    const err = e as IsolationError;
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}

async function bind(customerId: string, fullNames: string[]) {
  const ours = await listAgencyRepos();
  const allowed = new Set(ours.map((r) => r.full_name));
  const taken = db
    .select()
    .from(boundResources)
    .where(eq(boundResources.provider, "github"))
    .all();

  for (const name of fullNames) {
    if (!allowed.has(name)) {
      throw new IsolationError(`${name} is not in this agency’s GitHub — we only bind repos we own`, 403);
    }
    const other = taken.find((t) => t.resourceId === name && t.customerId !== customerId);
    if (other) {
      throw new IsolationError(
        `${name} is already bound to customer ${other.customerId}. no overlap.`,
        403,
      );
    }
  }

  db.delete(boundResources)
    .where(and(eq(boundResources.customerId, customerId), eq(boundResources.provider, "github")))
    .run();

  for (const name of fullNames) {
    const repo = ours.find((r) => r.full_name === name)!;
    db.insert(boundResources)
      .values({
        id: newId(),
        customerId,
        provider: "github",
        resourceId: name,
        name,
        metaJson: JSON.stringify({ htmlUrl: repo.html_url, defaultBranch: repo.default_branch, ghId: repo.id }),
      })
      .run();
  }

  // sanity: bound list must equal what we just wrote
  const bound = db
    .select()
    .from(boundResources)
    .where(and(eq(boundResources.customerId, customerId), eq(boundResources.provider, "github")))
    .all()
    .map((b) => b.resourceId);
  for (const name of fullNames) assertBound(customerId, "github", name, bound);

  db.insert(audit)
    .values({
      customerId,
      actor: "you",
      action: "bound agency github repos",
      target: fullNames.join(", "),
      at: new Date(),
    })
    .run();

  return NextResponse.json({ ok: true, repos: bound });
}
