import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { fail, guardTenant, operator } from "@/lib/api";
import { audit, tenants } from "@/lib/schema";
import { brandFor } from "@/lib/brand";

/** The agency's own branding — the name and colour their clients see. */
export async function GET() {
  const t = await guardTenant();
  if ("error" in t) return t.error;
  try {
    return NextResponse.json({ brand: await brandFor(t.tenantId), tenantId: t.tenantId });
  } catch (e) {
    return fail(e);
  }
}

export async function POST(req: Request) {
  const t = await guardTenant();
  if ("error" in t) return t.error;
  // Admins and owners only: branding is what every client of this agency sees,
  // so it is not something an operator changes in passing.
  if (t.role === "operator") return NextResponse.json({ error: "ask an admin" }, { status: 403 });
  const actor = (await operator())?.name || "you";
  try {
    const b = await req.json().catch(() => ({}));
    const str = (v: unknown, n: number) => String(v ?? "").trim().slice(0, n) || null;

    const accent = str(b.accent, 7);
    if (accent && !/^#[0-9a-fA-F]{6}$/.test(accent)) {
      return NextResponse.json({ error: "the accent has to be a hex colour like #c4491a" }, { status: 400 });
    }
    const logo = str(b.logoUrl, 500);
    if (logo) {
      // It is rendered into a page a client loads, so the scheme is checked
      // here rather than trusted at render time.
      try {
        if (new URL(logo).protocol !== "https:") throw new Error("not https");
      } catch {
        return NextResponse.json({ error: "the logo has to be an https URL" }, { status: 400 });
      }
    }

    await db
      .update(tenants)
      .set({
        brandName: str(b.name, 80),
        brandLogoUrl: logo,
        brandAccent: accent,
        brandDomain: str(b.domain, 200),
        brandFromEmail: str(b.fromEmail, 200),
        brandSupport: str(b.support, 200),
      })
      .where(eq(tenants.id, t.tenantId));
    await db.insert(audit).values({
      customerId: null, actor, action: "changed the agency branding", target: str(b.name, 80), at: new Date(),
    });
    return NextResponse.json({ ok: true, brand: await brandFor(t.tenantId) });
  } catch (e) {
    return fail(e);
  }
}
