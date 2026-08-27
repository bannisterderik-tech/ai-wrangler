import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { db, withCustomer } from "@/lib/db";
import { fail, guard } from "@/lib/api";
import { customers, jobs, orchLog } from "@/lib/schema";
import { ensureCustomer, newId } from "@/lib/customers";
import { assertBoundToCustomer } from "@/lib/isolation";

export async function GET() {
  const denied = await guard();
  if (denied) return denied;
  const [rows, names] = await Promise.all([
    db.select().from(jobs).orderBy(desc(jobs.createdAt)),
    db.select().from(customers),
  ]);
  const byId = Object.fromEntries(names.map((c) => [c.id, c.name]));
  return NextResponse.json({
    jobs: rows.map((j) => ({
      ...j,
      customerName: byId[j.customerId] || j.customerId,
      transcript: j.transcriptJson ? JSON.parse(j.transcriptJson) : [],
    })),
  });
}

export async function POST(req: Request) {
  const denied = await guard();
  if (denied) return denied;
  const body = await req.json().catch(() => ({}));
  const title = String(body.title || "").trim();
  const customerId = String(body.customerId || "").trim();
  const tier = String(body.tier || "Medium brain");
  const repo = body.repo ? String(body.repo).trim() : null;
  const vercelProjectId = body.vercelProjectId ? String(body.vercelProjectId).trim() : null;
  if (!title || !customerId) {
    return NextResponse.json({ error: "title and customerId required" }, { status: 400 });
  }

  try {
    const customer = await ensureCustomer(customerId);

    // A job may only name resources bound to its own customer. This is the wall.
    if (repo) await assertBoundToCustomer(customer.id, "github", repo);
    if (vercelProjectId) await assertBoundToCustomer(customer.id, "vercel", vercelProjectId);

    const budgets: Record<string, number> = {
      "Small brain": 300,
      "Medium brain": 1000,
      "Big brain": 2000,
    };
    const id = "R" + newId().slice(0, 8);
    const transcript = [
      {
        kind: "think",
        text: `New task for ${customer.name}: ${title}. I’ll read the relevant code before touching anything.`,
      },
      { kind: "note", text: "Queued — Claude Code on this laptop will pick it up via MCP." },
    ];

    // Written as the tenant role: even a wrong customerId here cannot land in another customer's rows.
    await withCustomer(customer.id, async (tx) => {
      await tx.insert(jobs).values({
        id,
        customerId: customer.id,
        title,
        status: "queued",
        harness: "claude-code-mcp",
        tier,
        repo,
        vercelProjectId,
        spentCents: 0,
        budgetCents: budgets[tier] || 1000,
        cache: 60,
        transcriptJson: JSON.stringify(transcript),
        createdAt: new Date(),
      });
      await tx.insert(orchLog).values({
        customerId: customer.id,
        tag: "assign",
        text: `→ sub-agent ${customer.id}-builder: “${title}” (${tier.toLowerCase()})`,
        at: new Date(),
      });
    });

    return NextResponse.json({ id, customerId: customer.id, repo, vercelProjectId });
  } catch (e) {
    return fail(e);
  }
}
