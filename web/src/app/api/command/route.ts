import { NextResponse } from "next/server";
import { desc, eq, gt, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { guard } from "@/lib/api";
import { adCampaigns, agencyLeads, approvals, callLog, customers, jobs, threads } from "@/lib/schema";

/** The dashboard, from rows. Every number here is countable. */
export async function GET() {
  const denied = await guard();
  if (denied) return denied;

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [leads, custs, live, gates, ads, calls, unread] = await Promise.all([
    db.select().from(agencyLeads).orderBy(desc(agencyLeads.createdAt)),
    db.select().from(customers),
    db.select().from(jobs),
    db.select().from(approvals).where(eq(approvals.status, "pending")),
    db.select().from(adCampaigns),
    db.select({ n: sql<number>`count(*)::int` }).from(callLog).where(gt(callLog.at, since)),
    db.select({ n: sql<number>`count(*)::int` }).from(threads).where(eq(threads.unread, true)),
  ]);

  const open = leads.filter((l) => !["won", "lost"].includes(l.stage));
  return NextResponse.json({
    pipeline: {
      prospects: leads.filter((l) => l.stage === "prospect").length,
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
