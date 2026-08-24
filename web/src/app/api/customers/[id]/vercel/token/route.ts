import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { encrypt } from "@/lib/crypto";
import { ensureCustomer, newId } from "@/lib/customers";
import { db } from "@/lib/db";
import { audit, connections } from "@/lib/schema";

export async function POST(req: Request, ctx: RouteContext<"/api/customers/[id]/vercel/token">) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const token = String(body.token || "").trim();
  if (token.length < 12) {
    return NextResponse.json({ error: "a Vercel access token is required" }, { status: 400 });
  }
  const customer = ensureCustomer(id, body.name);
  const res = await fetch("https://api.vercel.com/v2/user", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const user = await res.json();
  if (!res.ok) {
    return NextResponse.json(
      { error: user.error?.message || "token was rejected by Vercel" },
      { status: 401 },
    );
  }
  db.delete(connections)
    .where(and(eq(connections.customerId, customer.id), eq(connections.provider, "vercel")))
    .run();
  db.insert(connections)
    .values({
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
    })
    .run();
  db.insert(audit)
    .values({
      customerId: customer.id,
      actor: user.user?.username || "pat",
      action: "connected vercel via project-scoped token",
      target: body.teamId || "token-scope",
      at: new Date(),
    })
    .run();
  return NextResponse.json({ ok: true, customerId: customer.id });
}
