import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { ensureCustomer } from "@/lib/customers";

/** Send this customer to Vercel to pick which of *their* projects Wrangler may touch. */
export async function GET(req: NextRequest) {
  const customerId = req.nextUrl.searchParams.get("customerId") || "new-customer";
  const name = req.nextUrl.searchParams.get("name") || customerId;
  const customer = await ensureCustomer(customerId, name);
  const slug = process.env.VERCEL_INTEGRATION_SLUG;
  const clientId = process.env.VERCEL_INTEGRATION_CLIENT_ID;
  if (!slug || !clientId) {
    return NextResponse.redirect(
      new URL(
        `/connect?error=${encodeURIComponent(
          "Create a Vercel Integration, then set VERCEL_INTEGRATION_CLIENT_ID / SECRET / SLUG. Until then paste a project-scoped token.",
        )}`,
        req.nextUrl.origin,
      ),
    );
  }
  const state = randomBytes(16).toString("hex");
  const url = new URL(`https://vercel.com/integrations/${encodeURIComponent(slug)}/new`);
  url.searchParams.set("state", state);
  const res = NextResponse.redirect(url);
  // The state cookie carries which customer this install belongs to. One install, one customer.
  res.cookies.set("vercel_oauth_state", `${state}:${customer.id}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 900,
    path: "/",
  });
  return res;
}
