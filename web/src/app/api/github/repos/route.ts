import { NextResponse } from "next/server";
import { IsolationError } from "@/lib/isolation";
import { listAgencyRepos } from "@/lib/github";
import { db } from "@/lib/db";
import { boundResources, customers } from "@/lib/schema";

export async function GET() {
  try {
    const repos = await listAgencyRepos();
    const bound = db.select().from(boundResources).all().filter((b) => b.provider === "github");
    const names = Object.fromEntries(db.select().from(customers).all().map((c) => [c.id, c.name]));
    const byRepo = new Map(bound.map((b) => [b.resourceId, { customerId: b.customerId, customerName: names[b.customerId] || b.customerId }]));
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
    const err = e as IsolationError;
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}
