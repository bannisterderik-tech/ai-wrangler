import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { fail, guardTenant, operator } from "@/lib/api";
import { agencyLeads, audit, customers, memories, partners, proposalItems, proposals } from "@/lib/schema";
import { planImport, slugName, type Plan } from "@/lib/import-deals";
import { looksLikeXlsx, readXlsx } from "@/lib/xlsx";

const cash = (c: number) => `$${(c / 100).toLocaleString()}`;

/**
 * Import a CRM export from the OS, rather than from a shell holding a
 * production connection string.
 *
 * Preview and import run the same planImport(), so what you approve is exactly
 * what gets written. Nothing is written unless `write` is true.
 */
export async function POST(req: Request) {
  const t = await guardTenant();
  if ("error" in t) return t.error;
  const actor = (await operator())?.name || "you";
  try {
    const body = await req.json().catch(() => ({}));

    /**
     * A CRM export is Excel more often than CSV — and frequently named .csv
     * while being Excel, which is exactly how this failed the first time: the
     * name said csv, the bytes said PK. So the format is decided by the bytes.
     */
    const asText = (field: string, b64: string) => {
      const raw = String(body[b64] || "");
      if (raw) {
        const buf = Buffer.from(raw, "base64");
        if (looksLikeXlsx(buf)) {
          return readXlsx(buf)
            .map((r) => r.map((c) => (/[",\n]/.test(c) ? `"${c.replace(/"/g, '""')}"` : c)).join(","))
            .join("\n");
        }
        return buf.toString("utf8");
      }
      return String(body[field] || "");
    };

    const csv = asText("csv", "csvB64");
    if (!csv.trim()) return NextResponse.json({ error: "no file" }, { status: 400 });
    if (csv.length > 20_000_000) return NextResponse.json({ error: "that file is too big" }, { status: 413 });
    const peopleCsv = asText("peopleCsv", "peopleB64");

    const planned = planImport(csv, peopleCsv || undefined);
    if ("error" in planned) return NextResponse.json({ error: planned.error }, { status: 400 });
    const plan: Plan = planned;

    const preview = {
      total: plan.total,
      customers: plan.customers.length,
      leads: plan.leads.length,
      proposals: plan.proposals.length,
      partners: plan.partners.length,
      skipped: plan.skipped,
      samples: {
        customers: plan.customers.slice(0, 5).map((x) => `${x.name}${x.total ? ` · ${cash(x.total)}` : ""}`),
        leads: plan.leads.slice(0, 5).map((x) => `${x.name} · ${x.stage}${x.total ? ` · ${cash(x.total)}` : ""}`),
        partners: plan.partners.slice(0, 5).map((x) => x.name),
      },
    };

    if (body.write !== true) return NextResponse.json({ preview, wrote: null });

    const made = { customers: 0, leads: 0, proposals: 0, partners: 0, already: 0 };

    for (const x of plan.partners) {
      const id = `P_${t.tenantId}_${x.srcId.slice(0, 8)}`.slice(0, 60);
      const [seen] = await db.select().from(partners).where(eq(partners.id, id)).limit(1);
      if (seen) { made.already++; continue; }
      await db.insert(partners).values({
        id, tenantId: t.tenantId, name: x.name, operatorName: x.owner || null,
        tier: "operator", status: "applied", note: "Imported from a deals export.",
      }).onConflictDoNothing();
      made.partners++;
    }

    for (const x of plan.customers) {
      const id = slugName(x.name);
      const [seen] = await db.select().from(customers).where(eq(customers.id, id)).limit(1);
      // Customer ids are global slugs, so "acme" may already belong to another
      // agency. Adopting it would hand them a customer; skipping is the only
      // honest option until customer ids are keyed per tenant.
      if (seen && seen.tenantId !== t.tenantId) {
        plan.skipped.push({ name: x.name, why: "that name is taken — add them by hand" });
        continue;
      }
      if (!seen) {
        await db.insert(customers).values({ id, name: x.name, tenantId: t.tenantId }).onConflictDoNothing();
        made.customers++;
      } else made.already++;
      // What they bought, where read_project shows it to an agent working for
      // them. Not a job: a job carries a spend cap and an agent can claim it,
      // and a spreadsheet row is not a decision to spend money.
      if (x.product) {
        await db.insert(memories).values({
          id: `M_${t.tenantId}_${x.srcId.slice(0, 8)}`.slice(0, 60),
          customerId: id,
          text: `We sold them: ${x.product}${x.total ? ` (${cash(x.total)}${x.monthly ? `, ${cash(x.monthly)}/mo` : ""})` : ""}.`,
          kind: "note",
          source: "deals import",
        }).onConflictDoNothing();
      }
    }

    for (const x of plan.leads) {
      const id = `L_${t.tenantId}_${x.srcId.slice(0, 8)}`.slice(0, 60);
      const [seen] = await db.select().from(agencyLeads).where(eq(agencyLeads.id, id)).limit(1);
      if (seen) { made.already++; continue; }
      await db.insert(agencyLeads).values({
        id, tenantId: t.tenantId, company: x.name, contact: x.owner || null, email: x.email,
        stage: x.stage, valueCents: x.monthly || x.once,
        trade: x.product || null, source: "deals import",
        note: x.product ? `Interested in: ${x.product}` : null,
      });
      made.leads++;

      if (x.once || x.monthly) {
        const qId = `Q_${t.tenantId}_${x.srcId.slice(0, 8)}`.slice(0, 60);
        const [q] = await db.select().from(proposals).where(eq(proposals.id, qId)).limit(1);
        if (q) continue;
        // Draft, never sent. Sending is a decision, and a pile of live signable
        // links nobody meant to create is worse than none.
        await db.insert(proposals).values({
          id: qId, tenantId: t.tenantId, leadId: id, title: `${x.product || "Proposal"} for ${x.name}`,
          status: "draft", onceCents: x.once, monthlyCents: x.monthly, createdBy: "deals import",
        });
        let sort = 0;
        if (x.once)
          await db.insert(proposalItems).values({
            id: `I_${t.tenantId}_${x.srcId.slice(0, 6)}o`.slice(0, 60), proposalId: qId, name: x.product || "One-time work",
            cadence: "once", qty: 1, unitCents: x.once, sort: sort++,
          }).onConflictDoNothing();
        if (x.monthly)
          await db.insert(proposalItems).values({
            id: `I_${t.tenantId}_${x.srcId.slice(0, 6)}m`.slice(0, 60), proposalId: qId, name: x.product || "Retainer",
            cadence: "monthly", qty: 1, unitCents: x.monthly, sort: sort++,
          }).onConflictDoNothing();
        made.proposals++;
      }
    }

    await db.insert(audit).values({
      customerId: null, actor, action: "imported a CRM export",
      target: `${made.customers} customers, ${made.leads} leads, ${made.proposals} proposals, ${made.partners} partners`,
      at: new Date(),
    });
    return NextResponse.json({ preview, wrote: made });
  } catch (e) {
    return fail(e);
  }
}
