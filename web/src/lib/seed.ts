import { eq } from "drizzle-orm";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import {
  approvals,
  audit,
  changes,
  customers,
  deals,
  inbox,
  jobs,
  memories,
  orchLog,
} from "./schema";
import * as schema from "./schema";

type DB = BetterSQLite3Database<typeof schema>;

function profile(p: Record<string, unknown>) {
  return JSON.stringify(p);
}

export function seedIfEmpty(db: DB) {
  const existing = db.select().from(jobs).all();
  if (existing.length) return;

  const now = new Date();

  const upsertCustomer = (row: typeof customers.$inferInsert) => {
    const hit = db.select().from(customers).where(eq(customers.id, row.id)).get();
    if (hit) {
      db.update(customers).set({ name: row.name, profileJson: row.profileJson }).where(eq(customers.id, row.id)).run();
      return;
    }
    db.insert(customers).values(row).run();
  };

  upsertCustomer({
    id: "brightline",
    name: "Brightline",
    createdAt: now,
    profileJson: profile({
      project: "Invoice portal v2",
      pct: 68,
      repo: "github.com/brightline/invoice-portal",
      vercel: "brightline-team.vercel.app",
      supabase: "brightline-prod.supabase.co",
      rules: "Ask before anything a customer could see or that can’t be undone.",
      owner: "Alex (you)",
      contact: {
        name: "Maya Chen",
        role: "Head of Ops",
        phone: "(415) 555-0132",
        email: "maya@brightline.com",
        addr: "548 Market St, Suite 210, San Francisco, CA",
      },
      health: [
        { label: "Code freshness", value: "Up to date", color: "var(--state-running)" },
        { label: "Waiting reviews", value: "2 open, oldest 1 day", color: "var(--text-primary)" },
        { label: "Automated checks", value: "Passing", color: "var(--state-running)" },
      ],
      timeline: [
        { who: "You", text: "Kickoff call — agreed the invoice portal scope.", when: "2 days ago" },
        { who: "AI", text: "Set up the project board with 12 tasks.", when: "2 days ago" },
        { who: "You", text: "Reviewed and merged the payment-page polish.", when: "yesterday" },
        { who: "AI", text: "Routine checkup — everything healthy.", when: "8 hours ago" },
      ],
    }),
  });
  upsertCustomer({
    id: "harbor-and-co",
    name: "Harbor & Co",
    createdAt: now,
    profileJson: profile({
      project: "Storefront refresh",
      pct: 41,
      repo: "github.com/harbor-co/storefront",
      vercel: "harbor-co.vercel.app",
      supabase: "harbor-prod.supabase.co",
      rules: "Busy season Nov–Jan: no risky changes then.",
      owner: "Alex (you)",
      contact: {
        name: "Dev Okafor",
        role: "Founder",
        phone: "(206) 555-0187",
        email: "dev@harborandco.shop",
        addr: "1120 Alaskan Way, Seattle, WA",
      },
      health: [
        { label: "Code freshness", value: "3 days behind", color: "var(--state-blocked)" },
        { label: "Waiting reviews", value: "1 open, 6 days old", color: "var(--state-blocked)" },
        { label: "Automated checks", value: "Passing", color: "var(--state-running)" },
      ],
      timeline: [
        { who: "You", text: "Shared the new homepage direction with their team.", when: "3 days ago" },
        { who: "AI", text: "Drafted the product-grid layout for review.", when: "2 days ago" },
        { who: "AI", text: "Flagged a review that has been waiting 6 days.", when: "this morning" },
      ],
    }),
  });
  upsertCustomer({
    id: "atlas-labs",
    name: "Atlas Labs",
    createdAt: now,
    profileJson: profile({
      project: "Patient intake app",
      pct: 83,
      repo: "github.com/atlas-labs/patient-intake",
      vercel: "atlas-labs.vercel.app",
      supabase: "atlas-prod.supabase.co",
      rules: "Healthcare data: never log form contents. Deploys must be one-click reversible.",
      owner: "Alex (you)",
      contact: {
        name: "Rosa Alvarez",
        role: "Clinical Director",
        phone: "(512) 555-0119",
        email: "rosa@atlaslabs.health",
        addr: "77 Congress Ave, Austin, TX",
      },
      health: [
        { label: "Code freshness", value: "Up to date", color: "var(--state-running)" },
        { label: "Automated checks", value: "Passing", color: "var(--state-running)" },
        { label: "Library updates", value: "1 security update", color: "var(--state-blocked)" },
      ],
      timeline: [
        { who: "You", text: "HIPAA review of the intake flow.", when: "last week" },
        { who: "AI", text: "Shipped form autosave.", when: "yesterday" },
        { who: "You", text: "Patients keep getting logged out mid-form — looking now.", when: "this morning" },
      ],
    }),
  });

  db.insert(jobs)
    .values([
      {
        id: "A",
        customerId: "brightline",
        title: "Add PDF export to invoices",
        status: "blocked",
        harness: "claude-code-mcp",
        tier: "Medium brain",
        spentCents: 214,
        budgetCents: 1000,
        cache: 72,
        transcriptJson: JSON.stringify([
          { kind: "think", text: "Maya wants customers to export invoices as PDF. I’ll find the existing CSV export and mirror it." },
          { kind: "tool", label: "Reading the invoice page", text: "Found Export as CSV. I’ll add Export as PDF next to it, same data." },
          { kind: "tool", label: "Writing the change (on a safe copy)", text: "src/pages/InvoicePage.tsx + src/lib/pdf.ts · branch agent/invoice-export" },
          { kind: "tool", label: "Running the checks", text: "6 new checks pass. Totals and dates come out right." },
          { kind: "gate", text: "Paused — needs your OK to open the PR and preview." },
        ]),
        createdAt: now,
      },
      {
        id: "C",
        customerId: "atlas-labs",
        title: "Fix login timeout bug",
        status: "queued",
        harness: "claude-code-mcp",
        tier: "Big brain",
        spentCents: 0,
        budgetCents: 2000,
        cache: 64,
        transcriptJson: JSON.stringify([]),
        createdAt: now,
      },
      {
        id: "D",
        customerId: "harbor-and-co",
        title: "Speed up the checkout page",
        status: "working",
        harness: "claude-code-mcp",
        tier: "Medium brain",
        spentCents: 88,
        budgetCents: 1000,
        cache: 58,
        transcriptJson: JSON.stringify([
          { kind: "think", text: "Harbor & Co’s checkout feels slow on phones. Measuring before I touch anything." },
          { kind: "tool", label: "Measuring the slow parts", text: "Full-size product photos on tiny screens. 4.1s wasted per visit." },
          { kind: "tool", label: "Writing the change (on a safe copy)", text: "2 files on agent/faster-checkout. Live store untouched." },
        ]),
        createdAt: now,
      },
    ])
    .run();

  db.insert(approvals)
    .values({
      id: "g1",
      customerId: "brightline",
      jobId: "A",
      title: "Share “Add PDF export to invoices” for review + preview site",
      why: "The work is done and every check passes — on a safe copy only. I need your OK to open it for review. Nothing touches the real site.",
      payload:
        "branch: agent/invoice-export -> main\nopens: pull request + preview website\n\n src/pages/InvoicePage.tsx\n+  <ExportButton onClick={downloadPdf}\n+     label=\"Export as PDF\" />\n\n src/lib/pdf.ts   (new, 48 lines)\n+  builds the PDF from invoice data",
      irreversible: false,
      status: "pending",
      createdAt: now,
    })
    .run();

  db.insert(inbox)
    .values([
      {
        id: "i1",
        customerId: "brightline",
        fromName: "Maya @ Brightline",
        via: "email",
        at: "8:52 AM",
        text: "Could customers get an email receipt after paying? We keep forwarding them by hand.",
        task: "Send email receipts after payment",
        status: "new",
      },
      {
        id: "i2",
        customerId: "harbor-and-co",
        fromName: "Dev @ Harbor & Co",
        via: "slack",
        at: "9:18 AM",
        text: "The product photos look blurry on phones. Any quick fix?",
        task: "Sharpen product photos on mobile",
        status: "new",
      },
    ])
    .run();

  db.insert(changes)
    .values({
      id: "ch1",
      customerId: "brightline",
      title: "Add PDF export to invoices",
      repo: "github.com/brightline/invoice-portal",
      branch: "agent/invoice-export",
      files: 3,
      status: "pushed",
      diff: "branch: agent/invoice-export -> main\n+ Export as PDF button\n+ src/lib/pdf.ts",
      expl: "• Adds an “Export as PDF” button next to the existing CSV one\n• The PDF is built from the same data the page already shows\n• 6 new checks make sure totals and dates come out right",
      createdAt: now,
    })
    .run();

  db.insert(memories)
    .values([
      { id: "m1", customerId: "brightline", text: "They prefer small, frequent releases over big ones.", createdAt: now },
      { id: "m2", customerId: "brightline", text: "Maya is the decision-maker; cc her on anything customer-facing.", createdAt: now },
      { id: "m3", customerId: "harbor-and-co", text: "Busy season is Nov–Jan: no risky changes then.", createdAt: now },
      { id: "m4", customerId: "atlas-labs", text: "Healthcare data: never log form contents, ever.", createdAt: now },
    ])
    .run();

  db.insert(orchLog)
    .values([
      { tag: "mcp", text: "claude-code connected — Head Wrangler session 7f3a (your laptop)", at: now, customerId: null },
      { tag: "mcp", text: "tools granted: create_task · read_runs · deploy · query_costs", at: now, customerId: null },
      { tag: "plan", text: "watching 3 customer workspaces, isolation walls up", at: now, customerId: null },
      { tag: "assign", text: "→ sub-agent brightline-builder: “Add PDF export to invoices”", at: now, customerId: "brightline" },
      { tag: "paused", text: "Brightline — waiting on you to open the PR", at: now, customerId: "brightline" },
    ])
    .run();

  db.insert(deals)
    .values([
      { id: "d1", name: "Northwind Dental", value: "$4k/mo", note: "Website + intake. Call notes in Drive.", stage: 1 },
      { id: "d2", name: "Copper Kettle", value: "$2.5k/mo", note: "Online ordering. Warm intro from Maya.", stage: 2 },
      { id: "d3", name: "Kinship Goods", value: "$3k/mo", note: "Won — ready to onboard.", stage: 3 },
    ])
    .run();

  db.insert(audit)
    .values([
      { customerId: "brightline", actor: "brightline-builder", action: "used GitHub write key", target: "agent/invoice-export", at: now },
      { customerId: null, actor: "you", action: "signed in", target: "session 7f3a via MCP", at: now },
    ])
    .run();
}
