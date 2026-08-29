import { eq } from "drizzle-orm";
import { db } from "./db";
import { tenants } from "./schema";

/**
 * What a client actually sees.
 *
 * Multi-tenancy without branding is a database feature, not a product somebody
 * can resell. This is the name on the proposal they sign, the colour of the
 * button they click, and the logo above the portal they log into.
 *
 * Everything falls back to ours, so an agency that has set nothing gets a
 * working, unbranded product rather than a page with holes in it.
 */
export type Brand = {
  name: string;
  logoUrl: string | null;
  accent: string;
  domain: string | null;
  fromEmail: string | null;
  support: string | null;
  /** False when nothing has been set — the screens say so rather than pretending. */
  custom: boolean;
};

export const HOUSE_BRAND: Brand = {
  name: "AI Wrangler",
  logoUrl: null,
  accent: "#c4491a",
  domain: null,
  fromEmail: null,
  support: null,
  custom: false,
};

/** A hex colour, or nothing. Never anything that could close a style attribute. */
function safeAccent(v: string | null): string | null {
  const s = (v ?? "").trim();
  return /^#[0-9a-fA-F]{6}$/.test(s) ? s : null;
}

/**
 * An https URL, or nothing.
 *
 * The logo is rendered into a page the client loads. A `javascript:` or `data:`
 * URL in that position is a script somebody else chose to run on our page, so
 * the scheme is checked rather than trusted.
 */
function safeUrl(v: string | null): string | null {
  const s = (v ?? "").trim();
  if (!s) return null;
  try {
    return new URL(s).protocol === "https:" ? s : null;
  } catch {
    return null;
  }
}

export async function brandFor(tenantId: string): Promise<Brand> {
  const [row] = await db.select().from(tenants).where(eq(tenants.id, tenantId)).limit(1);
  if (!row) return HOUSE_BRAND;
  const accent = safeAccent(row.brandAccent);
  const logoUrl = safeUrl(row.brandLogoUrl);
  const name = (row.brandName ?? "").trim();
  return {
    name: name || row.name || HOUSE_BRAND.name,
    logoUrl,
    accent: accent ?? HOUSE_BRAND.accent,
    domain: (row.brandDomain ?? "").trim() || null,
    fromEmail: (row.brandFromEmail ?? "").trim() || null,
    support: (row.brandSupport ?? "").trim() || null,
    custom: Boolean(name || accent || logoUrl),
  };
}
