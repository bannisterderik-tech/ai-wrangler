import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { customers, jobs } from "@/lib/schema";
import { ensureCustomer, newId } from "@/lib/customers";
import { orchLog } from "@/lib/schema";

export async function GET() {
  const rows = db.select().from(jobs).orderBy(desc(jobs.createdAt)).all();
  const names = Object.fromEntries(db.select().from(customers).all().map((c) => [c.id, c.name]));
  return NextResponse.json({
    jobs: rows.map((j) => ({
      ...j,
      customerName: names[j.customerId] || j.customerId,
      transcript: j.transcriptJson ? JSON.parse(j.transcriptJson) : [],
    })),
  });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const title = String(body.title || "").trim();
  const customerId = String(body.customerId || "").trim();
  const tier = String(body.tier || "Medium brain");
  if (!title || !customerId) {
    return NextResponse.json({ error: "title and customerId required" }, { status: 400 });
  }
  const customer = ensureCustomer(customerId);
  const budgets: Record<string, number> = { "Small brain": 300, "Medium brain": 1000, "Big brain": 2000 };
  const id = "R" + newId().slice(0, 8);
  const transcript = [
    { kind: "think", text: `New task for ${customer.name}: ${title}. I’ll read the relevant code before touching anything.` },
    { kind: "note", text: "Queued — Claude Code on this laptop will pick it up via MCP." },
  ];
  db.insert(jobs)
    .values({
      id,
      customerId: customer.id,
      title,
      status: "queued",
      harness: "claude-code-mcp",
      tier,
      spentCents: 0,
      budgetCents: budgets[tier] || 1000,
      cache: 60,
      transcriptJson: JSON.stringify(transcript),
      createdAt: new Date(),
    })
    .run();
  db.insert(orchLog)
    .values({
      customerId: customer.id,
      tag: "assign",
      text: `→ sub-agent ${customer.id}-builder: “${title}” (${tier.toLowerCase()})`,
      at: new Date(),
    })
    .run();
  return NextResponse.json({ id, customerId: customer.id });
}
