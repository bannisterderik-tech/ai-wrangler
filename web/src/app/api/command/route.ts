import { NextResponse } from "next/server";
import { isOpen } from "@/lib/stages";
import { and, desc, eq, gt, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { guardTenant } from "@/lib/api";
import { customerIdsFor, ownedBy } from "@/lib/tenant-scope";
import { adCampaigns, agencyLeads, approvals, callLog, customers, jobs, threads } from "@/lib/schema";

/** The dashboard, from rows. Every number here is countable. */
export async function GET() {
  const t = await guardTenant();
  if ("error" in t) return t.error;

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  // The morning screen reads almost every table, which makes it the single
  // worst place to forget a tenant filter — one missing clause here shows an
  // agency somebody else's whole business on the first screen they open.
  const mine = await customerIdsFor(t.tenantId);
  const [leads, custs, live, gates, ads, calls, unread] = await Promise.all([
    db.select().from(agencyLeads).where(eq(agencyLeads.tenantId, t.tenantId)).orderBy(desc(agencyLeads.createdAt)),
    db.select().from(customers).where(eq(customers.tenantId, t.tenantId)),
    db.select().from(jobs).where(ownedBy(jobs.customerId, mine)),
    db.select().from(approvals).where(and(eq(approvals.status, "pending"), ownedBy(approvals.customerId, mine))),
    db.select().from(adCampaigns).where(ownedBy(adCampaigns.customerId, mine)),
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(callLog)
      .where(and(gt(callLog.at, since), eq(callLog.tenantId, t.tenantId))),
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(threads)
      .where(and(eq(threads.unread, true), eq(threads.tenantId, t.tenantId))),
  ]);

  const open = leads.filter((l) => isOpen(l.stage));
  return NextResponse.json({
    pipeline: {
      prospects: leads.filter((l) => l.stage === "prospects").length,
      open: open.length,
      value: open.reduce((a, l) => a + l.valueCents, 0) / 100,
      won: leads.filter((l) => l.stage === "won").length,
    },
    customers: custs.length,
    work: {
      running: live.filter((j) => ["working", "thinking"].includes(j.status)).length,
      gated: gates.length,
      spentToday: live.reduce((a, j) => a + j.spentCents, 0) / 100,
    },
    ads: {
      active: ads.filter((a) => a.status === "active").length,
      spend: ads.reduce((a, x) => a + x.spendCents, 0) / 100,
      leads: ads.reduce((a, x) => a + x.leads, 0),
    },
    callsToday: calls[0]?.n ?? 0,
    unread: unread[0]?.n ?? 0,
    hot: open
      .filter((l) => l.phone)
      .slice(0, 6)
      .map((l) => ({ id: l.id, company: l.company, contact: l.contact, phone: l.phone, stage: l.stage, note: l.note })),
  });
}
