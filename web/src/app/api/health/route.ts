import { NextResponse } from "next/server";
import { authConfigured, githubLoginConfigured, operatorAllowlist, passwordLoginConfigured } from "@/lib/auth";

export async function GET() {
  return NextResponse.json({
    ok: true,
    integration: Boolean(process.env.VERCEL_INTEGRATION_CLIENT_ID && process.env.VERCEL_INTEGRATION_SLUG),
    login: {
      configured: authConfigured(),
      password: passwordLoginConfigured(),
      github: githubLoginConfigured() && operatorAllowlist().length > 0,
      allowlist: operatorAllowlist().length > 0,
    },
  });
}
