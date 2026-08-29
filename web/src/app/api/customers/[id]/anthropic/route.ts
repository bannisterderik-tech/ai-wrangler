import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { fail, guardBuild, operator} from "@/lib/api";
import { customerInTenant } from "@/lib/tenant-scope";
import { audit } from "@/lib/schema";
import { checkCustomerKey, clearCustomerKey, customerKeyStatus, setCustomerKey } from "@/lib/customer-keys";
import { getCustomer } from "@/lib/customers";

/** Whether they brought their own key, and whether it works. Never the key. */
export async function GET(_req: Request, ctx: RouteContext<"/api/customers/[id]/anthropic">) {
  const t = await guardBuild();
  if ("error" in t) return t.error;
  try {
    const { id } = await ctx.params;
    // Another agency's customer reads as not found, the same as one that
    // never existed — the refusal must not confirm it is out there.
    if (!(await customerInTenant(t.tenantId, id))) {
      return NextResponse.json({ error: "no such customer" }, { status: 404 });
    }
    const status = await customerKeyStatus(id);
    return NextResponse.json({
      ...status,
      // Asked of Anthropic, not inferred from the row existing.
      ...(status.set ? await checkCustomerKey(id) : { ok: false, why: "no key saved" }),
    });
  } catch (e) {
    return fail(e);
  }
}

export async function POST(req: Request, ctx: RouteContext<"/api/customers/[id]/anthropic">) {
  const t = await guardBuild();
  if ("error" in t) return t.error;
  const actor = (await operator())?.name || "you";
  try {
    const { id } = await ctx.params;
    // Another agency's customer reads as not found, the same as one that
    // never existed — the refusal must not confirm it is out there.
    if (!(await customerInTenant(t.tenantId, id))) {
      return NextResponse.json({ error: "no such customer" }, { status: 404 });
    }
    if (!(await getCustomer(id))) return NextResponse.json({ error: "no such customer" }, { status: 404 });
    const body = await req.json().catch(() => ({}));

    if (body.remove === true) {
      await clearCustomerKey(id);
      await db.insert(audit).values({
        customerId: id, actor, action: "removed their Anthropic key", target: null, at: new Date(),
      });
      return NextResponse.json({ ok: true, set: false });
    }

    await setCustomerKey(id, String(body.key || ""));
    // Checked before it is called good. A key that is stored and rejected is
    // worse than none, because every pass fails on it instead.
    const check = await checkCustomerKey(id);
    if (!check.ok) {
      await clearCustomerKey(id);
      return NextResponse.json({ error: `Anthropic rejected that key: ${check.why}` }, { status: 400 });
    }
    await db.insert(audit).values({
      customerId: id, actor, action: "saved their own Anthropic key", target: null, at: new Date(),
    });
    return NextResponse.json({ ...(await customerKeyStatus(id)), ...check });
  } catch (e) {
    return fail(e);
  }
}
