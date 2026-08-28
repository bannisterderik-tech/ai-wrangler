import { createHash, randomBytes } from "node:crypto";
import { asc, eq } from "drizzle-orm";
import { db } from "./db";
import { proposalItems, proposals, signatures } from "./schema";

/**
 * Proposal maths and the document that gets signed.
 *
 * Two rules hold everywhere below.
 *
 * 1. Money is integer cents. Percentages are computed on cents and rounded
 *    once, at the end. A deposit that disagrees with the invoice by a penny is
 *    an argument with a customer.
 * 2. What gets signed is a string we can rebuild byte for byte. The signature
 *    row stores a hash of it, so "they agreed to this" is checkable later
 *    rather than a claim. If the document cannot be rebuilt identically, the
 *    hash is worthless — which is why a sent proposal is frozen.
 */

export type Item = {
  name: string;
  detail?: string | null;
  cadence: string;
  qty: number;
  unitCents: number;
};

export type Totals = {
  onceCents: number;
  monthlyCents: number;
  depositCents: number;
  /** What they owe today. The deposit, and nothing else. */
  dueTodayCents: number;
};

export const money = (cents: number, currency = "usd") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase() }).format(cents / 100);

export function lineTotal(i: Pick<Item, "qty" | "unitCents">) {
  return Math.max(0, Math.round(i.qty * i.unitCents));
}

/**
 * Totals for a set of lines and a deposit setting.
 *
 * The deposit is taken on the one-time work only. Charging a percentage of a
 * monthly retainer as a "deposit" would bill for months nobody has worked yet.
 */
export function totals(
  items: Item[],
  deposit: { depositKind: string; depositPct: number; depositCents: number },
): Totals {
  let once = 0;
  let monthly = 0;
  for (const i of items) {
    const t = lineTotal(i);
    if (i.cadence === "monthly") monthly += t;
    else once += t;
  }
  const pct = Math.min(100, Math.max(0, deposit.depositPct || 0));
  const raw = deposit.depositKind === "flat" ? deposit.depositCents || 0 : Math.round((once * pct) / 100);
  // Never ask for more than the one-time work is worth, and never for less
  // than nothing.
  const dep = Math.max(0, Math.min(raw, once));
  return { onceCents: once, monthlyCents: monthly, depositCents: dep, dueTodayCents: dep };
}

/** A fresh capability token for one proposal's public link. */
export function proposalToken() {
  return randomBytes(32).toString("base64url");
}

export type Renderable = {
  id: string;
  title: string;
  summary: string | null;
  terms: string | null;
  currency: string;
  depositKind: string;
  depositPct: number;
  depositCents: number;
};

/**
 * The exact text the signer is shown, and the exact text we hash.
 *
 * Deliberately plain: no dates, no "generated at", nothing that changes between
 * two renders of the same agreement. A timestamp in here would make the hash
 * differ every time and prove nothing.
 */
export function renderDocument(p: Renderable, items: Item[], forCompany: string) {
  const t = totals(items, p);
  const lines = [
    p.title,
    "",
    `Between: AI Wrangler and ${forCompany}`,
    "",
    p.summary?.trim() || "",
    "",
    "WHAT IS INCLUDED",
    ...items.map(
      (i) =>
        `- ${i.name}${i.detail ? ` — ${i.detail}` : ""}: ${i.qty} x ${money(i.unitCents, p.currency)}` +
        ` = ${money(lineTotal(i), p.currency)}${i.cadence === "monthly" ? " per month" : ""}`,
    ),
    "",
    "WHAT IT COSTS",
    `- One time: ${money(t.onceCents, p.currency)}`,
    `- Monthly: ${money(t.monthlyCents, p.currency)}`,
    `- Deposit due on signing: ${money(t.depositCents, p.currency)}`,
    "",
    "TERMS",
    p.terms?.trim() || "",
  ];
  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

export function documentHash(text: string) {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

/** Everything needed to show or sign one proposal. */
export async function loadProposal(id: string) {
  const [p] = await db.select().from(proposals).where(eq(proposals.id, id)).limit(1);
  if (!p) return null;
  const items = await db
    .select()
    .from(proposalItems)
    .where(eq(proposalItems.proposalId, id))
    .orderBy(asc(proposalItems.sort));
  const [sig] = await db.select().from(signatures).where(eq(signatures.proposalId, id)).limit(1);
  return { proposal: p, items, signature: sig ?? null, totals: totals(items, p) };
}

/**
 * The caller's IP, for the signature record.
 *
 * Forwarded headers are attacker-controlled, so this is evidence of what the
 * proxy reported, not proof of origin. It is recorded as such: worth having,
 * not worth pretending is stronger than it is.
 */
export function callerIp(req: Request) {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim().slice(0, 64);
  return (req.headers.get("x-real-ip") || "").slice(0, 64) || null;
}
