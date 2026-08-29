import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { encrypt } from "@/lib/crypto";
import { ensureCustomer, newId } from "@/lib/customers";
import { db } from "@/lib/db";
import { fail, guardBuild} from "@/lib/api";
import { customerInTenant } from "@/lib/tenant-scope";
import { audit, connections } from "@/lib/schema";

export async function POST(req: Request, ctx: RouteContext<"/api/customers/[id]/vercel/token">) {
  const t = await guardBuild();
  if ("error" in t) return t.error;
  const { id } = await ctx.params;
  // Another agency's customer reads as not found, the same as one that
  // never existed — the refusal must not confirm it is out there.
  if (!(await customerInTenant(t.tenantId, id))) {
    return NextResponse.json({ error: "no such customer" }, { status: 404 });
  }
  const body = await req.json().catch(() => ({}));
  const token = String(body.token || "").trim();
  if (token.length < 12) {
    return NextResponse.json({ error: "a Vercel access token is required" }, { status: 400 });
  }
  try {
    const customer = await ensureCustomer(id, body.name);
    const res = await fetch("https://api.vercel.com/v2/user", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const user = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(
        { error: user.error?.message || "token was rejected by Vercel" },
        { status: 401 },
      );
    }
    await db
      .delete(connections)
      .where(and(eq(connections.customerId, customer.id), eq(connections.provider, "vercel")));
    await db.insert(connections).values({
      id: newId(),
      customerId: customer.id,
      provider: "vercel",
      mode: "pat",
      encryptedAccess: encrypt(token),
      teamId: body.teamId || null,
      teamName: user.user?.name || null,
      userJson: JSON.stringify({
        id: user.user?.uid || user.user?.id,
        username: user.user?.username,
        email: user.user?.email,
      }),
      tokenPrefix: token.slice(0, 6),
      connectedAt: new Date(),
    });
    await db.insert(audit).values({
      customerId: customer.id,
      actor: user.user?.username || "pat",
      action: "connected vercel via project-scoped token",
      target: body.teamId || "token-scope",
      at: new Date(),
    });
    return NextResponse.json({ ok: true, customerId: customer.id });
  } catch (e) {
    return fail(e);
  }
}
