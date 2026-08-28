import { NextResponse } from "next/server";
import { fail, guardBuild } from "@/lib/api";
import { listAgencyRepos } from "@/lib/github";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { boundResources, customers } from "@/lib/schema";

export async function GET() {
  // The build half. A CRM-only account is refused it outright rather than
  // shown an empty floor and left to wonder.
  const b = await guardBuild();
  if ("error" in b) return b.error;
  try {
    const [repos, bound, names] = await Promise.all([
      listAgencyRepos(),
      db.select().from(boundResources).where(eq(boundResources.provider, "github")),
      db.select().from(customers),
    ]);
    const nameById = Object.fromEntries(names.map((c) => [c.id, c.name]));
    const byRepo = new Map(
      bound.map((b) => [
        b.resourceId,
        { customerId: b.customerId, customerName: nameById[b.customerId] || b.customerId },
      ]),
    );
    return NextResponse.json({
      repos: repos.map((r) => ({
        id: r.id,
        fullName: r.full_name,
        name: r.name,
        private: r.private,
        url: r.html_url,
        defaultBranch: r.default_branch,
        boundTo: byRepo.get(r.full_name) || null,
      })),
    });
  } catch (e) {
    return fail(e);
  }
}
