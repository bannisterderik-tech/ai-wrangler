import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { encrypt } from "@/lib/crypto";
import { ensureCustomer, newId } from "@/lib/customers";
import { db } from "@/lib/db";
import { audit, connections } from "@/lib/schema";
import { bindResources } from "@/lib/binding";
import { listCustomerProjects } from "@/lib/vercel";
import { publicOrigin } from "@/lib/origin";

/**
 * Vercel Integration callback. The customer installs on *their* Vercel account,
 * and we store the resulting token against exactly one customer — never shared.
 */
export async function GET(req: NextRequest) {
  const origin = publicOrigin(req);
  const bail = (msg: string) =>
    NextResponse.redirect(new URL(`/connect?error=${encodeURIComponent(msg)}`, origin));

  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const configurationId = req.nextUrl.searchParams.get("configurationId");
  const next = req.nextUrl.searchParams.get("next");
  const cookie = req.cookies.get("vercel_oauth_state")?.value || "";
  const [expectedState, customerId] = cookie.split(":");

  if (!code) return bail("Vercel sent us back without a code.");
  if (!state || !expectedState || state !== expectedState || !customerId) {
    return bail("That install did not match the customer it started from — start again from Connect.");
  }

  const clientId = process.env.VERCEL_INTEGRATION_CLIENT_ID;
  const clientSecret = process.env.VERCEL_INTEGRATION_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return bail("VERCEL_INTEGRATION_CLIENT_ID / SECRET are not set on this deploy.");
  }

  const tokenRes = await fetch("https://api.vercel.com/v2/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: `${origin}/api/auth/vercel/callback`,
    }),
  });
  const tokenData = await tokenRes.json().catch(() => ({}));
  if (!tokenRes.ok || !tokenData.access_token) {
    return bail(tokenData.error_description || tokenData.error || "Vercel would not issue a token.");
  }

  const customer = await ensureCustomer(customerId);
  const userRes = await fetch("https://api.vercel.com/v2/user", {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  const user = await userRes.json().catch(() => ({}));

  await db
    .delete(connections)
    .where(and(eq(connections.customerId, customer.id), eq(connections.provider, "vercel")));
  await db.insert(connections).values({
    id: newId(),
    customerId: customer.id,
    provider: "vercel",
    mode: "integration",
    encryptedAccess: encrypt(tokenData.access_token),
    teamId: tokenData.team_id || null,
    teamName: user.user?.name || null,
    installationId: tokenData.installation_id || configurationId || null,
    userJson: JSON.stringify({
      id: tokenData.user_id || user.user?.uid,
      username: user.user?.username,
      email: user.user?.email,
    }),
    tokenPrefix: String(tokenData.access_token).slice(0, 6),
    connectedAt: new Date(),
  });
  await db.insert(audit).values({
    customerId: customer.id,
    actor: user.user?.username || "vercel-integration",
    action: "connected vercel via integration",
    target: tokenData.team_id || configurationId || "personal",
    at: new Date(),
  });

  // Bind exactly the projects this install can reach — that set is the customer's wall.
  let note = "";
  try {
    const projects = await listCustomerProjects(customer.id);
    await bindResources(
      customer.id,
      "vercel",
      projects.map((p) => ({ resourceId: p.id, name: p.name, meta: { framework: p.framework } })),
      { actor: "vercel-integration" },
    );
    note = `&bound=${projects.length}`;
  } catch (e) {
    note = `&error=${encodeURIComponent((e as Error).message)}`;
  }

  const dest = next && next.startsWith("/") ? next : `/connect?connected=${customer.id}${note}`;
  const res = NextResponse.redirect(new URL(dest, origin));
  res.cookies.set("vercel_oauth_state", "", { maxAge: 0, path: "/" });
  return res;
}
