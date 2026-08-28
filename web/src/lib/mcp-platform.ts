import { and, asc, desc, eq, sql } from "drizzle-orm";
import { db } from "./db";
import { agencyLeads, audit, customers, proposalItems, proposals } from "./schema";
import { newId } from "./customers";
import type { McpSession } from "./session-token";

/**
 * The platform, over MCP.
 *
 * The build tools work one customer's repository. These work the agency itself:
 * the pipeline, the quotes, the book. Van connects his own Claude Code and it
 * acts as him — inside his account and nowhere else.
 *
 * Two rules make that safe enough to grant:
 *
 *   Every query is scoped by session.tenantId, taken from the person's row and
 *   never from an argument. A tool that accepted a tenant would be a tool for
 *   reading somebody else's business.
 *
 *   Nothing here sends. A proposal is created as a draft with no token, a lead
 *   moves stage, a note gets written — and anything that would reach a customer
 *   (sending a proposal, taking a deposit, a first message to a real person)
 *   stays a human decision on a screen, the same wall the build agents stop at.
 */

const str = (d: string) => ({ type: "string" as const, description: d });
const s = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const money = (c: number) => `$${(c / 100).toLocaleString()}`;

export class PlatformError extends Error {}

export const PLATFORM_TOOLS = [
  {
    name: "list_leads",
    description:
      "The agency's own pipeline: shops buying web and technology from us. Optionally filter by stage " +
      "(prospect, new, talking, proposal, won, lost) or search by name.",
    inputSchema: {
      type: "object",
      properties: { stage: str("Optional stage filter."), q: str("Optional text to match on.") },
      additionalProperties: false,
    },
  },
  {
    name: "read_lead",
    description: "Everything on one lead, including any proposals against it.",
    inputSchema: {
      type: "object",
      properties: { lead_id: str("The lead.") },
      required: ["lead_id"],
      additionalProperties: false,
    },
  },
  {
    name: "add_lead",
    description: "Put a new shop into the pipeline.",
    inputSchema: {
      type: "object",
      properties: {
        company: str("Their business name."),
        contact: str("Who you spoke to."),
        phone: str("Phone."),
        email: str("Email."),
        city: str("Their market."),
        trade: str("What they do."),
        note: str("Anything worth remembering."),
        value_monthly: str("Retainer in dollars, if it is priced."),
      },
      required: ["company"],
      additionalProperties: false,
    },
  },
  {
    name: "move_lead",
    description: "Move a lead to another stage. Winning one does not create a customer — money does that.",
    inputSchema: {
      type: "object",
      properties: { lead_id: str("The lead."), stage: str("prospect, new, talking, proposal, won or lost.") },
      required: ["lead_id", "stage"],
      additionalProperties: false,
    },
  },
  {
    name: "draft_proposal",
    description:
      "Write a proposal against a lead, as a DRAFT. It is never sent from here — sending is a decision a " +
      "human makes on the screen, because a sent proposal carries a live signable link.",
    inputSchema: {
      type: "object",
      properties: {
        lead_id: str("The lead this is for."),
        title: str("What the proposal is called."),
        summary: str("The pitch, in their words."),
        once_dollars: str("One-time total, in dollars."),
        monthly_dollars: str("Monthly retainer, in dollars."),
        line_name: str("What the work is called on the line item."),
      },
      required: ["lead_id", "title"],
      additionalProperties: false,
    },
  },
  {
    name: "list_customers",
    description: "Who this agency runs: the shops we have won and what is bound for each.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
] as const;

export const PLATFORM_TOOL_NAMES = PLATFORM_TOOLS.map((t) => t.name) as readonly string[];

const STAGES = ["prospect", "new", "talking", "proposal", "won", "lost"];

export async function callPlatformTool(session: McpSession, name: string, args: Record<string, unknown>) {
  // Every query below is pinned to this. It comes from the person's row, so a
  // tool cannot be talked into another account.
  const tenant = session.tenantId;

  const mine = eq(agencyLeads.tenantId, tenant);
  const lead = async (id: string) => {
    const [row] = await db
      .select()
      .from(agencyLeads)
      .where(and(mine, eq(agencyLeads.id, id)))
      .limit(1);
    // Same refusal whether it does not exist or is not theirs, so a pipeline
    // cannot be enumerated by watching the error change.
    if (!row) throw new PlatformError(`refused: no lead ${id} on this account.`);
    return row;
  };

  switch (name) {
    case "list_leads": {
      const stage = s(args.stage).toLowerCase();
      const q = s(args.q).toLowerCase();
      let rows = await db.select().from(agencyLeads).where(mine).orderBy(desc(agencyLeads.createdAt));
      if (stage) rows = rows.filter((l) => l.stage === stage);
      if (q) {
        rows = rows.filter((l) =>
          [l.company, l.contact, l.city, l.trade, l.note].filter(Boolean).join(" ").toLowerCase().includes(q),
        );
      }
      if (!rows.length) return "Nothing in the pipeline matches that.";
      const open = rows.filter((l) => !["won", "lost"].includes(l.stage));
      return [
        `${rows.length} lead(s). ${money(open.reduce((a, l) => a + l.valueCents, 0))}/mo in play.`,
        "",
        ...rows.map(
          (l) =>
            `- [${l.id}] ${l.company} — ${l.stage}` +
            `${l.contact ? ` · ${l.contact}` : ""}${l.valueCents ? ` · ${money(l.valueCents)}/mo` : ""}`,
        ),
      ].join("\n");
    }

    case "read_lead": {
      const l = await lead(s(args.lead_id));
      const qs = await db
        .select()
        .from(proposals)
        .where(and(eq(proposals.tenantId, tenant), eq(proposals.leadId, l.id)))
        .orderBy(desc(proposals.createdAt));
      return [
        `# ${l.company}`,
        `stage: ${l.stage}`,
        l.contact ? `who: ${l.contact}` : "",
        l.phone ? `phone: ${l.phone}` : "",
        l.email ? `email: ${l.email}` : "",
        l.city ? `market: ${l.city}` : "",
        l.trade ? `trade: ${l.trade}` : "",
        l.valueCents ? `retainer: ${money(l.valueCents)}/mo` : "not priced",
        l.note ? `\n${l.note}` : "",
        "",
        "## Proposals",
        ...(qs.length
          ? qs.map(
              (q) =>
                `- [${q.id}] ${q.title} — ${q.status}, ${money(q.onceCents)} once` +
                `${q.monthlyCents ? ` + ${money(q.monthlyCents)}/mo` : ""}`,
            )
          : ["- none yet"]),
      ]
        .filter(Boolean)
        .join("\n");
    }

    case "add_lead": {
      const company = s(args.company);
      if (!company) throw new PlatformError("A lead needs a company name.");
      const id = "L" + newId().slice(0, 8);
      const monthly = Math.max(0, Math.round((Number(s(args.value_monthly)) || 0) * 100));
      await db.insert(agencyLeads).values({
        id,
        tenantId: tenant,
        company,
        contact: s(args.contact) || null,
        phone: s(args.phone) || null,
        email: s(args.email) || null,
        city: s(args.city) || null,
        trade: s(args.trade) || null,
        note: s(args.note) || null,
        source: `${session.handle} over MCP`,
        stage: "new",
        valueCents: monthly,
      });
      await db.insert(audit).values({
        customerId: null, actor: session.handle, action: "added a lead over MCP", target: company, at: new Date(),
      });
      return `Added ${company} as ${id}, at stage "new".`;
    }

    case "move_lead": {
      const l = await lead(s(args.lead_id));
      const stage = s(args.stage).toLowerCase();
      if (!STAGES.includes(stage)) throw new PlatformError(`Stage must be one of: ${STAGES.join(", ")}.`);
      await db.update(agencyLeads).set({ stage }).where(eq(agencyLeads.id, l.id));
      await db.insert(audit).values({
        customerId: null, actor: session.handle, action: `moved a lead to ${stage}`, target: l.company, at: new Date(),
      });
      return stage === "won"
        ? `${l.company} is marked won. They become a customer when the deposit clears, not before — that is what the proposal is for.`
        : `${l.company} is now at "${stage}".`;
    }

    case "draft_proposal": {
      const l = await lead(s(args.lead_id));
      const title = s(args.title);
      if (!title) throw new PlatformError("A proposal needs a title.");
      const once = Math.max(0, Math.round((Number(s(args.once_dollars)) || 0) * 100));
      const monthly = Math.max(0, Math.round((Number(s(args.monthly_dollars)) || 0) * 100));
      const id = "Q" + newId().slice(0, 8);
      await db.insert(proposals).values({
        id, tenantId: tenant, leadId: l.id, title,
        summary: s(args.summary) || null,
        // Draft, and no token. A sent proposal carries a live signable link, and
        // that is not a thing to create from a chat.
        status: "draft", onceCents: once, monthlyCents: monthly,
        createdBy: `${session.handle} over MCP`,
      });
      let sort = 0;
      const lineName = s(args.line_name) || title;
      if (once)
        await db.insert(proposalItems).values({
          id: "I" + newId().slice(0, 8), proposalId: id, name: lineName,
          cadence: "once", qty: 1, unitCents: once, sort: sort++,
        });
      if (monthly)
        await db.insert(proposalItems).values({
          id: "I" + newId().slice(0, 8), proposalId: id, name: lineName,
          cadence: "monthly", qty: 1, unitCents: monthly, sort: sort++,
        });
      await db.insert(audit).values({
        customerId: null, actor: session.handle, action: "drafted a proposal over MCP",
        target: `${l.company} · ${title}`, at: new Date(),
      });
      return (
        `Drafted ${id} for ${l.company}: ${money(once)} once` +
        `${monthly ? ` + ${money(monthly)}/mo` : ""}. It is a DRAFT — open it on Leads to price it properly and send it.`
      );
    }

    case "list_customers": {
      const rows = await db
        .select()
        .from(customers)
        .where(eq(customers.tenantId, tenant))
        .orderBy(asc(customers.name));
      if (!rows.length) return "No customers on this account yet.";
      return [`${rows.length} customer(s):`, ...rows.map((c) => `- [${c.id}] ${c.name}`)].join("\n");
    }

    default:
      throw new PlatformError(`Unknown tool: ${name}`);
  }
}

/** Platform tools are for people, not for build agents. */
export function mayUsePlatform(session: McpSession) {
  return session.kind === "operator";
}

void sql;
