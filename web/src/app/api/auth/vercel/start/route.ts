import { NextRequest, NextResponse } from "next/server";
import { ensureCustomer } from "@/lib/customers";

export async function GET(req: NextRequest) {
  const customerId = req.nextUrl.searchParams.get("customerId") || "new-customer";
  const name = req.nextUrl.searchParams.get("name") || customerId;
  ensureCustomer(customerId, name);
  const slug = process.env.VERCEL_INTEGRATION_SLUG;
  const clientId = process.env.VERCEL_INTEGRATION_CLIENT_ID;
  if (!slug || !clientId) {
    return NextResponse.redirect(
      new URL(
        `/connect?error=${encodeURIComponent(
          "Create a Vercel Integration, then set VERCEL_INTEGRATION_CLIENT_ID / SLUG. Until then paste a project-scoped token.",
        )}`,
        req.nextUrl.origin,
      ),
    );
  }
  const state = crypto.randomUUID();
  const url = `https://vercel.com/integrations/${encodeURIComponent(slug)}/new?state=${encodeURIComponent(state)}`;
  return NextResponse.redirect(url);
}
