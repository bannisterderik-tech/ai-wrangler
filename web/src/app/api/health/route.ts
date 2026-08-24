import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    integration: Boolean(process.env.VERCEL_INTEGRATION_CLIENT_ID && process.env.VERCEL_INTEGRATION_SLUG),
    signin: Boolean(process.env.VERCEL_APP_CLIENT_ID),
  });
}
